import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getLanguageByCode } from './src/data/languages.ts';
import { lookupCachedPhrase } from './src/utils/translationEngine.ts';
import {
  mergeMessagesIdempotently,
  removeParticipant,
  upsertParticipant,
} from './src/utils/roomState.ts';
import type { ChatMessage, DomainMode, RoomParticipant } from './src/types/easytalk.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerRoomState {
  roomCode: string;
  domainMode: DomainMode;
  participants: RoomParticipant[];
  messages: ChatMessage[];
  updatedAt: number;
}

interface WsClientMeta {
  ws: WebSocket;
  roomCode: string | null;
  participantId: string | null;
}

const rooms = new Map<string, ServerRoomState>();
const clients = new Set<WsClientMeta>();

function getOrCreateRoom(roomCode: string, domainMode: DomainMode = 'general'): ServerRoomState {
  const existing = rooms.get(roomCode);
  if (existing) return existing;
  const created: ServerRoomState = {
    roomCode,
    domainMode,
    participants: [],
    messages: [],
    updatedAt: Date.now(),
  };
  rooms.set(roomCode, created);
  return created;
}

function broadcastToRoom(roomCode: string, payload: unknown, excludeWs?: WebSocket): void {
  const serialized = JSON.stringify(payload);
  for (const client of clients) {
    if (
      client.roomCode === roomCode &&
      client.ws !== excludeWs &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(serialized);
    }
  }
}

async function translateWithMyMemory(
  text: string,
  srcIso: string,
  tgtIso: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=${encodeURIComponent(`${srcIso}|${tgtIso}`)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || translated.toUpperCase().includes('MYMEMORY WARNING')) {
      return null;
    }
    return translated;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function translateWithLingva(
  text: string,
  srcIso: string,
  tgtIso: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const src = srcIso === 'zh-CN' ? 'zh' : srcIso;
    const tgt = tgtIso === 'zh-CN' ? 'zh' : tgtIso;
    const url = `https://lingva.ml/api/v1/${encodeURIComponent(src)}/${encodeURIComponent(
      tgt,
    )}/${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { translation?: string };
    return data.translation?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function translateWithGoogleCloud(
  text: string,
  srcIso: string,
  tgtIso: string,
): Promise<string | null> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: srcIso === 'zh-CN' ? 'zh-CN' : srcIso,
          target: tgtIso === 'zh-CN' ? 'zh-CN' : tgtIso,
          format: 'text',
        }),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: { translations?: Array<{ translatedText?: string }> };
    };
    return data.data?.translations?.[0]?.translatedText?.trim() || null;
  } catch {
    return null;
  }
}

async function translateWithGeminiServer(
  text: string,
  sourceLangName: string,
  targetLangName: string,
  domainMode: DomainMode,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate the following ${domainMode} conversation utterance from ${sourceLangName} to ${targetLangName}. Return ONLY the natural, accurate translation in ${targetLangName} without quotes, notes, or explanations:\n\n${text}`,
    });
    return response.text?.trim() || null;
  } catch {
    return null;
  }
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      activeRooms: rooms.size,
      connectedClients: clients.size,
    });
  });

  app.post('/api/translate', async (req, res) => {
    const started = Date.now();
    const body = req.body as {
      text?: string;
      sourceLang?: string;
      targetLang?: string;
      domainMode?: DomainMode;
      enginePreference?: string;
    };

    const text = (body.text ?? '').trim();
    const sourceLang = body.sourceLang ?? 'en-IN';
    const targetLang = body.targetLang ?? 'hi-IN';
    const domainMode: DomainMode = body.domainMode ?? 'general';
    const enginePreference = body.enginePreference ?? 'auto';

    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const srcInfo = getLanguageByCode(sourceLang);
    const tgtInfo = getLanguageByCode(targetLang);

    if (srcInfo.isoCode === tgtInfo.isoCode) {
      res.json({
        translatedText: text,
        provider: 'Same Language',
        latencyMs: Date.now() - started,
      });
      return;
    }

    // Tier 2: Instant Smart Phrase & Domain Dictionary Cache
    if (enginePreference !== 'cloud-proxy') {
      const cached = lookupCachedPhrase(text, sourceLang, targetLang);
      if (cached) {
        res.json({
          translatedText: cached,
          provider: 'Smart Phrase Cache',
          latencyMs: Math.max(4, Date.now() - started),
        });
        return;
      }
    }

    // Tier 3 (Server-Configured Cloud Keys) if cloud-proxy preferred
    if (enginePreference === 'cloud-proxy') {
      const cloudResult = await translateWithGoogleCloud(text, srcInfo.isoCode, tgtInfo.isoCode);
      if (cloudResult) {
        res.json({
          translatedText: cloudResult,
          provider: 'Google Cloud Proxy',
          latencyMs: Date.now() - started,
        });
        return;
      }
      const geminiResult = await translateWithGeminiServer(
        text,
        srcInfo.name,
        tgtInfo.name,
        domainMode,
      );
      if (geminiResult) {
        res.json({
          translatedText: geminiResult,
          provider: 'Neural Context Proxy',
          latencyMs: Date.now() - started,
        });
        return;
      }
    }

    // Tier 1: Live Free MyMemory API
    const mmResult = await translateWithMyMemory(text, srcInfo.isoCode, tgtInfo.isoCode);
    if (mmResult) {
      res.json({
        translatedText: mmResult,
        provider: 'MyMemory Live',
        latencyMs: Date.now() - started,
      });
      return;
    }

    // Tier 1B: Lingva Public Endpoint Fallback
    const lingvaResult = await translateWithLingva(text, srcInfo.isoCode, tgtInfo.isoCode);
    if (lingvaResult) {
      res.json({
        translatedText: lingvaResult,
        provider: 'Lingva Live',
        latencyMs: Date.now() - started,
      });
      return;
    }

    // Tier 3 Fallback: Server-Side Gemini Neural Context Proxy (if key is present)
    const geminiFallback = await translateWithGeminiServer(
      text,
      srcInfo.name,
      tgtInfo.name,
      domainMode,
    );
    if (geminiFallback) {
      res.json({
        translatedText: geminiFallback,
        provider: 'Neural Context Proxy',
        latencyMs: Date.now() - started,
      });
      return;
    }

    res.json({
      translatedText: text,
      provider: 'Passthrough Fallback',
      latencyMs: Date.now() - started,
    });
  });

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    const meta: WsClientMeta = { ws, roomCode: null, participantId: null };
    clients.add(meta);

    ws.on('message', (raw) => {
      try {
        const event = JSON.parse(raw.toString()) as {
          type: string;
          roomCode?: string;
          domainMode?: DomainMode;
          participant?: RoomParticipant;
          participantId?: string;
          message?: ChatMessage;
        };

        if (event.type === 'room:join' && event.roomCode && event.participant) {
          const room = getOrCreateRoom(event.roomCode, event.domainMode ?? 'general');
          meta.roomCode = event.roomCode;
          meta.participantId = event.participant.id;
          room.participants = upsertParticipant(room.participants, {
            ...event.participant,
            isSelf: false,
          });
          room.updatedAt = Date.now();

          ws.send(
            JSON.stringify({
              type: 'room:state',
              roomCode: room.roomCode,
              domainMode: room.domainMode,
              participants: room.participants,
              messages: room.messages,
            }),
          );

          broadcastToRoom(
            room.roomCode,
            {
              type: 'participant:upsert',
              roomCode: room.roomCode,
              participant: { ...event.participant, isSelf: false },
            },
            ws,
          );
          return;
        }

        if (!meta.roomCode) return;
        const room = rooms.get(meta.roomCode);
        if (!room) return;

        if (event.type === 'participant:upsert' && event.participant) {
          room.participants = upsertParticipant(room.participants, {
            ...event.participant,
            isSelf: false,
          });
          room.updatedAt = Date.now();
          broadcastToRoom(
            room.roomCode,
            {
              type: 'participant:upsert',
              roomCode: room.roomCode,
              participant: { ...event.participant, isSelf: false },
            },
            ws,
          );
        } else if (event.type === 'participant:remove' && event.participantId) {
          room.participants = removeParticipant(room.participants, event.participantId);
          room.updatedAt = Date.now();
          broadcastToRoom(
            room.roomCode,
            {
              type: 'participant:remove',
              roomCode: room.roomCode,
              participantId: event.participantId,
            },
            ws,
          );
        } else if (event.type === 'message:send' && event.message) {
          room.messages = mergeMessagesIdempotently(room.messages, [event.message]);
          room.updatedAt = Date.now();
          broadcastToRoom(
            room.roomCode,
            {
              type: 'message:new',
              roomCode: room.roomCode,
              message: event.message,
            },
            ws,
          );
        } else if (event.type === 'room:domain' && event.domainMode) {
          room.domainMode = event.domainMode;
          room.updatedAt = Date.now();
          broadcastToRoom(
            room.roomCode,
            {
              type: 'room:domain',
              roomCode: room.roomCode,
              domainMode: event.domainMode,
            },
            ws,
          );
        }
      } catch {
        // Ignore malformed client payloads
      }
    });

    ws.on('close', () => {
      clients.delete(meta);
      if (meta.roomCode && meta.participantId) {
        const room = rooms.get(meta.roomCode);
        if (room) {
          room.participants = removeParticipant(room.participants, meta.participantId);
          broadcastToRoom(meta.roomCode, {
            type: 'participant:remove',
            roomCode: meta.roomCode,
            participantId: meta.participantId,
          });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT ?? 3000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`EasyTalk server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
