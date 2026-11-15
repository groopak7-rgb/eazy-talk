import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildParticipantAvatar,
  mergeMessagesIdempotently,
  removeParticipant,
  upsertParticipant,
} from './roomState.ts';
import type { ChatMessage, RoomParticipant } from '../types/easytalk.ts';

test('buildParticipantAvatar produces deterministic initials and color classes', () => {
  const first = buildParticipantAvatar('Dr. Sharma');
  assert.equal(first.initials, 'DS');
  assert.ok(first.colorClass.startsWith('bg-'));

  const single = buildParticipantAvatar('Arun');
  assert.equal(single.initials, 'AR');
});

test('mergeMessagesIdempotently deduplicates by id, merges translations, and sorts by timestamp', () => {
  const msg1: ChatMessage = {
    id: 'm1',
    roomCode: 'ET1234',
    senderId: 'u1',
    senderName: 'Arun',
    senderLanguage: 'ta-IN',
    originalText: 'வணக்கம்',
    inputMethod: 'voice',
    domainMode: 'general',
    createdAt: 200,
    translations: {
      'en-IN': { translatedText: 'Hello', provider: 'Cache', latencyMs: 5 },
    },
  };

  const msg1Updated: ChatMessage = {
    ...msg1,
    translations: {
      'hi-IN': { translatedText: 'नमस्ते', provider: 'MyMemory Live', latencyMs: 220 },
    },
  };

  const msg0: ChatMessage = {
    ...msg1,
    id: 'm0',
    createdAt: 100,
    originalText: 'Earlier message',
  };

  const merged = mergeMessagesIdempotently([msg1], [msg1Updated, msg0]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'm0');
  assert.equal(merged[1].id, 'm1');
  assert.equal(merged[1].translations['en-IN'].translatedText, 'Hello');
  assert.equal(merged[1].translations['hi-IN'].translatedText, 'नमस्ते');
});

test('upsertParticipant and removeParticipant maintain clean participant lists', () => {
  const p1: RoomParticipant = {
    id: 'p1',
    name: 'Arun',
    languageCode: 'ta-IN',
    avatarInitials: 'AR',
    avatarColor: 'bg-indigo-600 text-white',
    joinedAt: 1,
  };
  const p2: RoomParticipant = {
    id: 'p2',
    name: 'Dr. Sharma',
    languageCode: 'hi-IN',
    avatarInitials: 'DS',
    avatarColor: 'bg-teal-600 text-white',
    joinedAt: 2,
  };

  let list = upsertParticipant([], p1);
  list = upsertParticipant(list, p2);
  assert.equal(list.length, 2);

  list = upsertParticipant(list, { ...p1, languageCode: 'te-IN' });
  assert.equal(list.length, 2);
  assert.equal(list[0].languageCode, 'te-IN');

  list = removeParticipant(list, 'p2');
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'p1');
});
