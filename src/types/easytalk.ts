export type DomainMode = 'general' | 'healthcare' | 'travel' | 'education' | 'banking';

export type MicCaptureMode = 'tap' | 'hold';

export type MicPermissionState =
  | 'unknown'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

export type TranslationEnginePreference = 'auto' | 'dictionary-first' | 'cloud-proxy';

export type ConnectionTransportState = 'connecting' | 'live-ws' | 'tab-sync' | 'offline';

export interface LanguageOption {
  code: string; // e.g., 'ta-IN'
  isoCode: string; // e.g., 'ta'
  name: string; // e.g., 'Tamil'
  nativeName: string; // e.g., 'தமிழ்'
  regionGroup: 'Indian Regional' | 'Global';
  shortCode: string; // e.g., 'TA'
  rtl?: boolean;
  sampleGreeting: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  languageCode: string; // BCP-47 speaking language e.g. 'te-IN'
  hearingLanguageCode?: string; // BCP-47 hearing/output language e.g. 'en-IN'
  role?: string;
  isSelf?: boolean;
  isVirtual?: boolean;
  isSpeaking?: boolean;
  avatarInitials: string;
  avatarColor: string;
  joinedAt: number;
}

export interface TranslationEntry {
  translatedText: string;
  provider: string;
  latencyMs: number;
  cached?: boolean;
}

export interface ChatMessage {
  id: string;
  roomCode: string;
  senderId: string;
  senderName: string;
  senderLanguage: string; // BCP-47 of original utterance
  originalText: string;
  inputMethod: 'voice' | 'text' | 'quick-phrase' | 'companion';
  domainMode: DomainMode;
  createdAt: number;
  translations: Record<string, TranslationEntry>;
}

export interface QuickPhrase {
  id: string;
  domain: DomainMode | 'emergency';
  labelEn: string;
  translations: Record<string, string>;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  domainMode: DomainMode;
  suggestedUserName: string;
  suggestedLanguage: string;
  partnerName: string;
  partnerLanguage: string;
  partnerRole: string;
  starterPrompt: string;
}

export interface CompanionPersona {
  id: string;
  name: string;
  role: string;
  languageCode: string;
  domainAffinity: DomainMode;
  contextualReplies: Array<{
    domain: DomainMode;
    text: string;
    englishHint: string;
  }>;
}

export interface VoiceSettings {
  autoSpeak: boolean;
  showEnglishSubtitles: boolean;
  speechRate: number; // 0.85, 1.0, 1.15
  speechPitch: number; // 0.9 - 1.1
  micMode: MicCaptureMode;
  autoDetectLanguage: boolean;
  enginePreference: TranslationEnginePreference;
}
