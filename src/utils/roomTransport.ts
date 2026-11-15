import type {
  ChatMessage,
  ConnectionTransportState,
  DomainMode,
  RoomParticipant,
} from '../types/easytalk';

export interface RoomTransportHandlers {
  onStateSync: (state: {
    domainMode?: DomainMode;
    participants?: RoomParticipant[];
    messages?: ChatMessage[];
  }) => void;
  onMessageReceived: (message: ChatMessage) => void;
  onParticipantUpsert: (participant: RoomParticipant) => void;
  onParticipantRemove: (participantId: string) => void;
  onDomainChanged: (domainMode: DomainMode) => void;
  onTransportStateChange: (state: ConnectionTransportState) => void;
}

const STORAGE_PREFIX = 'easytalk_room_';

export class UnifiedRoomTransport {
  private roomCode: string;
  private participant: RoomParticipant;
  private domainMode: DomainMode;
  private handlers: RoomTransportHandlers;
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private reconnectTimer: number | null = null;
  private disposed = false;
  private wsConnected = false;

  constructor(params: {
    roomCode: string;
    participant: RoomParticipant;
    domainMode: DomainMode;
    handlers: RoomTransportHandlers;
  }) {
    this.roomCode = params.roomCode;
    this.participant = params.participant;
    this.domainMode = params.domainMode;
    this.handlers = params.handlers;
  }

  public connect(): void {
    this.disposed = false;
    this.handlers.onTransportStateChange('connecting');

    // 1. Setup BroadcastChannel for instant multi-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('easytalk_rooms');
      this.channel.onmessage = (evt: MessageEvent) => {
        const data = evt.data as {
          roomCode?: string;
          senderTabId?: string;
          type?: string;
          message?: ChatMessage;
          participant?: RoomParticipant;
          participantId?: string;
          domainMode?: DomainMode;
        };
        if (!data || data.roomCode !== this.roomCode) return;
        this.handleIncomingEvent(data);
      };
    }

    // 2. Setup localStorage sync listener + hydrate prior local room snapshot
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
      this.hydrateFromLocalStorage();
    }

    // 3. Connect WebSocket to authoritative server
    this.connectWebSocket();
  }

  private hydrateFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.roomCode}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        domainMode?: DomainMode;
        messages?: ChatMessage[];
        participants?: RoomParticipant[];
      };
      this.handlers.onStateSync({
        domainMode: parsed.domainMode,
        messages: parsed.messages ?? [],
        participants: parsed.participants ?? [],
      });
    } catch {
      // Ignore storage parse error
    }
  }

  public persistSnapshot(snapshot: {
    domainMode: DomainMode;
    messages: ChatMessage[];
    participants: RoomParticipant[];
  }): void {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${this.roomCode}`,
        JSON.stringify({
          domainMode: snapshot.domainMode,
          messages: snapshot.messages.slice(-150),
          participants: snapshot.participants,
          updatedAt: Date.now(),
        }),
      );
    } catch {
      // Ignore quota issues
    }
  }

  private handleStorageEvent = (evt: StorageEvent): void => {
    if (evt.key !== `${STORAGE_PREFIX}${this.roomCode}` || !evt.newValue) return;
    try {
      const parsed = JSON.parse(evt.newValue) as {
        domainMode?: DomainMode;
        messages?: ChatMessage[];
        participants?: RoomParticipant[];
      };
      this.handlers.onStateSync({
        domainMode: parsed.domainMode,
        messages: parsed.messages ?? [],
        participants: parsed.participants ?? [],
      });
    } catch {
      // Ignore
    }
  };

  private connectWebSocket(): void {
    if (this.disposed || typeof window === 'undefined') return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        if (this.disposed) {
          ws.close();
          return;
        }
        this.wsConnected = true;
        this.handlers.onTransportStateChange('live-ws');
        ws.send(
          JSON.stringify({
            type: 'room:join',
            roomCode: this.roomCode,
            domainMode: this.domainMode,
            participant: this.participant,
          }),
        );
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(String(evt.data));
          this.handleIncomingEvent(data);
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = () => {
        this.wsConnected = false;
        if (this.disposed) return;
        this.handlers.onTransportStateChange(this.channel ? 'tab-sync' : 'offline');
        this.reconnectTimer = window.setTimeout(() => {
          this.connectWebSocket();
        }, 2500);
      };

      ws.onerror = () => {
        this.wsConnected = false;
        if (!this.disposed) {
          this.handlers.onTransportStateChange(this.channel ? 'tab-sync' : 'offline');
        }
      };
    } catch {
      this.handlers.onTransportStateChange(this.channel ? 'tab-sync' : 'offline');
    }
  }

  private handleIncomingEvent(data: {
    type?: string;
    domainMode?: DomainMode;
    participants?: RoomParticipant[];
    messages?: ChatMessage[];
    message?: ChatMessage;
    participant?: RoomParticipant;
    participantId?: string;
  }): void {
    if (data.type === 'room:state') {
      this.handlers.onStateSync({
        domainMode: data.domainMode,
        participants: data.participants,
        messages: data.messages,
      });
    } else if (data.type === 'message:new' && data.message) {
      this.handlers.onMessageReceived(data.message);
    } else if (data.type === 'participant:upsert' && data.participant) {
      this.handlers.onParticipantUpsert({
        ...data.participant,
        isSelf: data.participant.id === this.participant.id,
      });
    } else if (data.type === 'participant:remove' && data.participantId) {
      this.handlers.onParticipantRemove(data.participantId);
    } else if (data.type === 'room:domain' && data.domainMode) {
      this.handlers.onDomainChanged(data.domainMode);
    }
  }

  public sendMessage(message: ChatMessage): void {
    const payload = {
      type: 'message:send',
      roomCode: this.roomCode,
      message,
    };
    if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    this.channel?.postMessage({
      type: 'message:new',
      roomCode: this.roomCode,
      message,
    });
  }

  public updateParticipant(participant: RoomParticipant): void {
    this.participant = participant;
    const payload = {
      type: 'participant:upsert',
      roomCode: this.roomCode,
      participant,
    };
    if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    this.channel?.postMessage(payload);
  }

  public removeParticipant(participantId: string): void {
    const payload = {
      type: 'participant:remove',
      roomCode: this.roomCode,
      participantId,
    };
    if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    this.channel?.postMessage(payload);
  }

  public updateDomainMode(domainMode: DomainMode): void {
    this.domainMode = domainMode;
    const payload = {
      type: 'room:domain',
      roomCode: this.roomCode,
      domainMode,
    };
    if (this.ws && this.wsConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    this.channel?.postMessage(payload);
  }

  public disconnect(): void {
    this.disposed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
