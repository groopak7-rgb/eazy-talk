import { getLanguageByCode, SUPPORTED_LANGUAGES } from '../data/languages';
import { QUICK_PHRASES } from '../data/phrasesAndScenarios';
import type {
  ChatMessage,
  DomainMode,
  RoomParticipant,
  TranslationEnginePreference,
  TranslationEntry,
} from '../types/easytalk';

const localTranslationCache = new Map<string, string>();
const inFlightTranslations = new Map<string, Promise<TranslationEntry>>();
const PERSISTED_TX_KEY = 'easytalk_tx_cache_v1';
const PERSISTED_TX_MAX = 250;
let storageCacheHydrated = false;

function hydratePersistedCache(): void {
  if (storageCacheHydrated || typeof window === 'undefined') return;
  storageCacheHydrated = true;
  try {
    const raw = window.localStorage.getItem(PERSISTED_TX_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Array<[string, string]>;
    if (Array.isArray(entries)) {
      for (const [k, v] of entries) {
        if (typeof k === 'string' && typeof v === 'string') {
          localTranslationCache.set(k, v);
        }
      }
    }
  } catch {
    // Ignore storage read issues
  }
}

function persistLocalCache(): void {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(localTranslationCache.entries()).slice(-PERSISTED_TX_MAX);
    window.localStorage.setItem(PERSISTED_TX_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota issues
  }
}

function buildCacheKey(sourceLang: string, targetLang: string, normalizedText: string): string {
  const srcIso = getLanguageByCode(sourceLang).isoCode;
  const tgtIso = getLanguageByCode(targetLang).isoCode;
  return `${srcIso}|${tgtIso}|${normalizedText}`;
}

export function clearLocalTranslationCacheForTest(): void {
  localTranslationCache.clear();
  inFlightTranslations.clear();
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ROOM_ALPHABET.length);
    code += ROOM_ALPHABET[idx];
  }
  return code;
}

export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

/**
 * Unicode script detection for Indian regional and international languages.
 * Falls back to `fallbackCode` for Latin-script languages unless clear Spanish/French cues exist.
 */
export function detectLanguageFromText(text: string, fallbackCode = 'en-IN'): string {
  const trimmed = text.trim();
  if (!trimmed) return fallbackCode;

  if (/[\u0B80-\u0BFF]/.test(trimmed)) return 'ta-IN'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(trimmed)) return 'te-IN'; // Telugu
  if (/[\u0C80-\u0CFF]/.test(trimmed)) return 'kn-IN'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(trimmed)) return 'ml-IN'; // Malayalam
  if (/[\u0980-\u09FF]/.test(trimmed)) return 'bn-IN'; // Bengali
  if (/[\u0A80-\u0AFF]/.test(trimmed)) return 'gu-IN'; // Gujarati
  if (/[\u0A00-\u0A7F]/.test(trimmed)) return 'pa-IN'; // Punjabi (Gurmukhi)
  if (/[\u0900-\u097F]/.test(trimmed)) {
    // Devanagari covers Hindi and Marathi; respect Marathi if user selected Marathi
    return fallbackCode === 'mr-IN' ? 'mr-IN' : 'hi-IN';
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    // Urdu-specific glyphs (ٹ ڈ ڑ ں ہ ے گ چ پ ژ)
    if (/[\u0679\u0688\u0691\u06BA\u06C1\u06D2\u06AF\u0686\u067E\u0698]/.test(trimmed)) {
      return 'ur-IN';
    }
    return fallbackCode === 'ur-IN' ? 'ur-IN' : 'ar-SA';
  }
  if (/[\u3040-\u30FF]/.test(trimmed)) return 'ja-JP'; // Hiragana / Katakana
  if (/[\u4E00-\u9FFF]/.test(trimmed)) return 'zh-CN'; // CJK Ideographs

  // Lightweight Latin-script cues for Spanish / French
  if (/[¿¡ñáéíóúü]/i.test(trimmed) || /\b(hola|gracias|por favor|buenos)\b/i.test(trimmed)) {
    return 'es-ES';
  }
  if (/[çœàâêîôûè]/i.test(trimmed) || /\b(bonjour|merci|s’il vous plaît|s'il vous plaît)\b/i.test(trimmed)) {
    return 'fr-FR';
  }

  return fallbackCode;
}

export function lookupCachedPhrase(
  text: string,
  sourceLang: string,
  targetLang: string,
): string | null {
  hydratePersistedCache();
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  // 1. Check runtime memory + persisted cache (ISO normalized + exact code fallback)
  const isoKey = buildCacheKey(sourceLang, targetLang, normalized);
  const memHit =
    localTranslationCache.get(isoKey) ??
    localTranslationCache.get(`${sourceLang}|${targetLang}|${normalized}`);
  if (memHit) return memHit;

  // 2. Check pre-loaded Smart Phrase & Domain Dictionary across all languages
  for (const phrase of QUICK_PHRASES) {
    const matchedValue = Object.values(phrase.translations).some(
      (val) => val.trim().toLowerCase() === normalized,
    );
    if (matchedValue) {
      const targetVal = phrase.translations[targetLang];
      if (targetVal) return targetVal;
    }
  }

  // 3. Check sample greetings in language catalog
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang.sampleGreeting.trim().toLowerCase() === normalized) {
      const targetGreeting = getLanguageByCode(targetLang).sampleGreeting;
      if (targetGreeting) return targetGreeting;
    }
  }

  return null;
}

export function cacheTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string,
): void {
  hydratePersistedCache();
  const normalized = text.trim().toLowerCase();
  if (!normalized || !translatedText.trim()) return;
  const isoKey = buildCacheKey(sourceLang, targetLang, normalized);
  localTranslationCache.set(isoKey, translatedText);
  if (localTranslationCache.size > PERSISTED_TX_MAX) {
    const oldestKey = localTranslationCache.keys().next().value;
    if (oldestKey) localTranslationCache.delete(oldestKey);
  }
  persistLocalCache();
}

export async function translateText(params: {
  text: string;
  sourceLang: string;
  targetLang: string;
  domainMode?: DomainMode;
  enginePreference?: TranslationEnginePreference;
}): Promise<TranslationEntry> {
  const {
    text,
    sourceLang,
    targetLang,
    domainMode = 'general',
    enginePreference = 'auto',
  } = params;

  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const cleanText = text.trim();

  if (!cleanText) {
    return { translatedText: '', provider: 'Passthrough', latencyMs: 0, cached: true };
  }

  const srcIso = getLanguageByCode(sourceLang).isoCode;
  const tgtIso = getLanguageByCode(targetLang).isoCode;

  if (srcIso === tgtIso) {
    return {
      translatedText: cleanText,
      provider: 'Same Language',
      latencyMs: 1,
      cached: true,
    };
  }

  // Tier 2: Instant Smart Phrase & Persisted Memory Cache
  if (enginePreference !== 'cloud-proxy') {
    const cachedHit = lookupCachedPhrase(cleanText, sourceLang, targetLang);
    if (cachedHit) {
      const elapsed = Math.max(
        2,
        Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt),
      );
      return {
        translatedText: cachedHit,
        provider: 'Smart Phrase Cache',
        latencyMs: elapsed,
        cached: true,
      };
    }
  }

  const dedupeKey = `${buildCacheKey(sourceLang, targetLang, cleanText.toLowerCase())}|${enginePreference}|${domainMode}`;
  const existingFlight = inFlightTranslations.get(dedupeKey);
  if (existingFlight) {
    return existingFlight;
  }

  const promise = (async (): Promise<TranslationEntry> => {
    let proxyErrored = false;

    // Tier 1 / Tier 3: Server-Side Translation Proxy (/api/translate)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3800);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: cleanText,
          sourceLang,
          targetLang,
          domainMode,
          enginePreference,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          translatedText?: string;
          provider?: string;
          latencyMs?: number;
        };
        if (data.translatedText && data.translatedText.trim()) {
          if (data.provider !== 'Passthrough Fallback') {
            cacheTranslation(cleanText, sourceLang, targetLang, data.translatedText);
          }
          const elapsed = Math.max(
            8,
            Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt),
          );
          return {
            translatedText: data.translatedText,
            provider: data.provider ?? 'Live Translation API',
            latencyMs: data.latencyMs ?? elapsed,
            cached: false,
          };
        }
      } else {
        proxyErrored = true;
      }
    } catch {
      proxyErrored = true;
    } finally {
      clearTimeout(timer);
    }

    // Browser-direct MyMemory API fallback only if server proxy failed/timed out
    if (proxyErrored) {
      const mmController = new AbortController();
      const mmTimer = setTimeout(() => mmController.abort(), 2500);
      try {
        const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          cleanText,
        )}&langpair=${encodeURIComponent(`${srcIso}|${tgtIso}`)}`;
        const mmRes = await fetch(mmUrl, { signal: mmController.signal });
        if (mmRes.ok) {
          const mmJson = (await mmRes.json()) as {
            responseData?: { translatedText?: string };
          };
          const candidate = mmJson.responseData?.translatedText?.trim();
          if (candidate && !candidate.toUpperCase().includes('MYMEMORY WARNING')) {
            cacheTranslation(cleanText, sourceLang, targetLang, candidate);
            const elapsed = Math.max(
              15,
              Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt),
            );
            return {
              translatedText: candidate,
              provider: 'MyMemory Live',
              latencyMs: elapsed,
              cached: false,
            };
          }
        }
      } catch {
        // Final safe fallback below
      } finally {
        clearTimeout(mmTimer);
      }
    }

    const elapsed = Math.max(
      12,
      Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt),
    );
    return {
      translatedText: cleanText,
      provider: 'Original Fallback',
      latencyMs: elapsed,
      cached: false,
    };
  })();

  inFlightTranslations.set(dedupeKey, promise);
  try {
    return await promise;
  } finally {
    inFlightTranslations.delete(dedupeKey);
  }
}

export function shouldShowEnglishSubtitle(
  sourceLangCode: string,
  hearingLangCode: string,
  enabled: boolean,
): boolean {
  if (!enabled) return false;
  const srcIso = getLanguageByCode(sourceLangCode).isoCode;
  const hearIso = getLanguageByCode(hearingLangCode).isoCode;
  return srcIso !== 'en' && hearIso !== 'en';
}

export function formatTranscriptText(
  roomCode: string,
  domainMode: DomainMode,
  messages: ChatMessage[],
  participants: RoomParticipant[],
  viewerLanguage: string,
): string {
  const viewerLangInfo = getLanguageByCode(viewerLanguage);
  const header = [
    'EasyTalk Multilingual Conversation Transcript',
    `Room Code: ${roomCode}`,
    `Domain Mode: ${domainMode}`,
    `Hearing / Output Language: ${viewerLangInfo.name} (${viewerLangInfo.code})`,
    `Exported At: ${new Date().toISOString()}`,
    `Participants (${participants.length}): ${participants
      .map((p) => `${p.name} [${getLanguageByCode(p.languageCode).name}]`)
      .join(', ')}`,
    '------------------------------------------------------------',
    '',
  ];

  const lines = messages.map((msg) => {
    const time = new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const srcName = getLanguageByCode(msg.senderLanguage).name;
    const translated = msg.translations[viewerLanguage]?.translatedText ?? msg.originalText;
    const enSub = msg.translations['en-IN']?.translatedText;
    const entryLines = [
      `[${time}] ${msg.senderName} (${srcName})`,
      `  Original:   ${msg.originalText}`,
      `  Translated: ${translated} [${viewerLangInfo.name}]`,
    ];
    if (shouldShowEnglishSubtitle(msg.senderLanguage, viewerLanguage, true) && enSub) {
      entryLines.push(`  EN Sub:     ${enSub}`);
    }
    entryLines.push('');
    return entryLines.join('\n');
  });

  return [...header, ...lines].join('\n');
}

export function formatTranscriptJson(
  roomCode: string,
  domainMode: DomainMode,
  messages: ChatMessage[],
  participants: RoomParticipant[],
): string {
  return JSON.stringify(
    {
      application: 'EasyTalk',
      roomCode,
      domainMode,
      exportedAt: new Date().toISOString(),
      participants,
      messages,
    },
    null,
    2,
  );
}
