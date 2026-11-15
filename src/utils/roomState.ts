import type { ChatMessage, RoomParticipant } from '../types/easytalk';

const AVATAR_COLORS = [
  'bg-indigo-600 text-white',
  'bg-teal-600 text-white',
  'bg-sky-600 text-white',
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-rose-600 text-white',
];

export function buildParticipantAvatar(name: string): {
  initials: string;
  colorClass: string;
} {
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (clean.slice(0, 2) || 'ET').toUpperCase();

  let hash = 0;
  for (let i = 0; i < clean.length; i += 1) {
    hash = (hash * 31 + clean.charCodeAt(i)) | 0;
  }
  const colorClass = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  return { initials, colorClass };
}

/**
 * Idempotently merges incoming messages into existing list,
 * deduplicating by `id`, merging any newly computed translations,
 * and sorting chronologically by `createdAt`.
 */
export function mergeMessagesIdempotently(
  existing: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();

  for (const msg of existing) {
    byId.set(msg.id, msg);
  }

  for (const msg of incoming) {
    const prev = byId.get(msg.id);
    if (!prev) {
      byId.set(msg.id, msg);
    } else {
      byId.set(msg.id, {
        ...prev,
        ...msg,
        translations: {
          ...prev.translations,
          ...msg.translations,
        },
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function upsertParticipant(
  participants: RoomParticipant[],
  next: RoomParticipant,
): RoomParticipant[] {
  const index = participants.findIndex((p) => p.id === next.id);
  if (index === -1) {
    return [...participants, next];
  }
  const copy = [...participants];
  copy[index] = { ...copy[index], ...next };
  return copy;
}

export function removeParticipant(
  participants: RoomParticipant[],
  participantId: string,
): RoomParticipant[] {
  return participants.filter((p) => p.id !== participantId);
}
