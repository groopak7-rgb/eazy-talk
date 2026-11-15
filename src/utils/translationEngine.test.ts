import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectLanguageFromText,
  formatTranscriptJson,
  formatTranscriptText,
  generateRoomCode,
  lookupCachedPhrase,
  normalizeRoomCode,
  shouldShowEnglishSubtitle,
} from './translationEngine.ts';
import type { ChatMessage, RoomParticipant } from '../types/easytalk.ts';

test('generateRoomCode creates 6-char uppercase alphanumeric code without ambiguous chars', () => {
  const code = generateRoomCode();
  assert.equal(code.length, 6);
  assert.match(code, /^[A-Z2-9]{6}$/);
});

test('normalizeRoomCode strips symbols and uppercases cleanly', () => {
  assert.equal(normalizeRoomCode(' et-4829 '), 'ET4829');
  assert.equal(normalizeRoomCode('ab!@#123456'), 'AB123456');
});

test('detectLanguageFromText identifies Indian regional and global scripts accurately', () => {
  assert.equal(detectLanguageFromText('வணக்கம் நண்பரே', 'en-IN'), 'ta-IN');
  assert.equal(detectLanguageFromText('मुझे बुखार है', 'en-IN'), 'hi-IN');
  assert.equal(detectLanguageFromText('मला ताप आहे', 'mr-IN'), 'mr-IN');
  assert.equal(detectLanguageFromText('నాకు సహాయం కావాలి', 'en-IN'), 'te-IN');
  assert.equal(detectLanguageFromText('ನನಗೆ ಸಹಾಯ ಬೇಕು', 'en-IN'), 'kn-IN');
  assert.equal(detectLanguageFromText('എനിക്ക് സഹായം വേണം', 'en-IN'), 'ml-IN');
  assert.equal(detectLanguageFromText('আমার সাহায্য দরকার', 'en-IN'), 'bn-IN');
  assert.equal(detectLanguageFromText('મને મદદ જોઈએ છે', 'en-IN'), 'gu-IN');
  assert.equal(detectLanguageFromText('ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ', 'en-IN'), 'pa-IN');
  assert.equal(detectLanguageFromText('مجھے مدد چاہیے', 'en-IN'), 'ur-IN');
  assert.equal(detectLanguageFromText('مرحبا كيف حالك', 'en-IN'), 'ar-SA');
  assert.equal(detectLanguageFromText('こんにちは', 'en-IN'), 'ja-JP');
  assert.equal(detectLanguageFromText('你好朋友', 'en-IN'), 'zh-CN');
  assert.equal(detectLanguageFromText('¡Hola! ¿Cómo estás?', 'en-IN'), 'es-ES');
  assert.equal(detectLanguageFromText('Hello doctor, I feel dizzy', 'en-IN'), 'en-IN');
});

test('lookupCachedPhrase resolves pre-loaded multilingual medical & travel phrases instantaneously', () => {
  const tamilToHindi = lookupCachedPhrase(
    'எனக்கு நேற்று இரவிலிருந்து காய்ச்சல் மற்றும் தலைவலி உள்ளது.',
    'ta-IN',
    'hi-IN',
  );
  assert.equal(tamilToHindi, 'मुझे कल रात से बुखार और सिरदर्द है।');

  const englishToTelugu = lookupCachedPhrase(
    'Which platform does the next train leave from?',
    'en-IN',
    'te-IN',
  );
  assert.equal(englishToTelugu, 'తదుపరి రైలు ఏ ప్లాట్‌ఫారమ్ నుండి బయలుదేరుతుంది?');
});

test('shouldShowEnglishSubtitle enables English subtitles only when neither source nor target is English', () => {
  assert.equal(shouldShowEnglishSubtitle('te-IN', 'hi-IN', true), true);
  assert.equal(shouldShowEnglishSubtitle('te-IN', 'en-IN', true), false);
  assert.equal(shouldShowEnglishSubtitle('en-IN', 'te-IN', true), false);
  assert.equal(shouldShowEnglishSubtitle('te-IN', 'hi-IN', false), false);
});

test('formatTranscriptText and formatTranscriptJson produce complete structured exports', () => {
  const participants: RoomParticipant[] = [
    {
      id: 'u1',
      name: 'Arun',
      languageCode: 'ta-IN',
      avatarInitials: 'AR',
      avatarColor: 'bg-indigo-600 text-white',
      joinedAt: 1700000000000,
    },
  ];
  const messages: ChatMessage[] = [
    {
      id: 'm1',
      roomCode: 'ET4829',
      senderId: 'u1',
      senderName: 'Arun',
      senderLanguage: 'ta-IN',
      originalText: 'வணக்கம்',
      inputMethod: 'voice',
      domainMode: 'healthcare',
      createdAt: 1700000005000,
      translations: {
        'hi-IN': {
          translatedText: 'नमस्ते',
          provider: 'Smart Phrase Cache',
          latencyMs: 12,
        },
        'en-IN': {
          translatedText: 'Hello',
          provider: 'Smart Phrase Cache',
          latencyMs: 12,
        },
      },
    },
  ];

  const txt = formatTranscriptText('ET4829', 'healthcare', messages, participants, 'hi-IN');
  assert.ok(txt.includes('Room Code: ET4829'));
  assert.ok(txt.includes('Original:   வணக்கம்'));
  assert.ok(txt.includes('Translated: नमस्ते [Hindi]'));
  assert.ok(txt.includes('EN Sub:     Hello'));

  const json = JSON.parse(formatTranscriptJson('ET4829', 'healthcare', messages, participants));
  assert.equal(json.roomCode, 'ET4829');
  assert.equal(json.messages.length, 1);
  assert.equal(json.messages[0].translations['en-IN'].translatedText, 'Hello');
});
