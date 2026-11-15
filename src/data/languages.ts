import type { LanguageOption } from '../types/easytalk';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'ta-IN',
    isoCode: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    regionGroup: 'Indian Regional',
    shortCode: 'TA',
    sampleGreeting: 'வணக்கம், நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  },
  {
    code: 'hi-IN',
    isoCode: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    regionGroup: 'Indian Regional',
    shortCode: 'HI',
    sampleGreeting: 'नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?',
  },
  {
    code: 'te-IN',
    isoCode: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    regionGroup: 'Indian Regional',
    shortCode: 'TE',
    sampleGreeting: 'నమస్కారం, నేను మీకు ఎలా సహాయం చేయగలను?',
  },
  {
    code: 'kn-IN',
    isoCode: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    regionGroup: 'Indian Regional',
    shortCode: 'KN',
    sampleGreeting: 'ನಮಸ್ಕಾರ, ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
  },
  {
    code: 'ml-IN',
    isoCode: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    regionGroup: 'Indian Regional',
    shortCode: 'ML',
    sampleGreeting: 'നമസ്കാരം, എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാനാകും?',
  },
  {
    code: 'bn-IN',
    isoCode: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    regionGroup: 'Indian Regional',
    shortCode: 'BN',
    sampleGreeting: 'নমস্কার, আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
  {
    code: 'mr-IN',
    isoCode: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    regionGroup: 'Indian Regional',
    shortCode: 'MR',
    sampleGreeting: 'नमस्कार, मी तुम्हाला कशी मदत करू शकतो?',
  },
  {
    code: 'gu-IN',
    isoCode: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    regionGroup: 'Indian Regional',
    shortCode: 'GU',
    sampleGreeting: 'નમસ્તે, હું તમને કેવી રીતે મદદ કરી શકું?',
  },
  {
    code: 'pa-IN',
    isoCode: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    regionGroup: 'Indian Regional',
    shortCode: 'PA',
    sampleGreeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
  },
  {
    code: 'ur-IN',
    isoCode: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    regionGroup: 'Indian Regional',
    shortCode: 'UR',
    rtl: true,
    sampleGreeting: 'السلام علیکم، میں آپ کی کس طرح مدد کر سکتا ہوں؟',
  },
  {
    code: 'en-IN',
    isoCode: 'en',
    name: 'English',
    nativeName: 'English',
    regionGroup: 'Global',
    shortCode: 'EN',
    sampleGreeting: 'Hello, how can I help you today?',
  },
  {
    code: 'es-ES',
    isoCode: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    regionGroup: 'Global',
    shortCode: 'ES',
    sampleGreeting: 'Hola, ¿cómo puedo ayudarte hoy?',
  },
  {
    code: 'fr-FR',
    isoCode: 'fr',
    name: 'French',
    nativeName: 'Français',
    regionGroup: 'Global',
    shortCode: 'FR',
    sampleGreeting: 'Bonjour, comment puis-je vous aider ?',
  },
  {
    code: 'ar-SA',
    isoCode: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    regionGroup: 'Global',
    shortCode: 'AR',
    rtl: true,
    sampleGreeting: 'مرحبا، كيف يمكنني مساعدتك اليوم؟',
  },
  {
    code: 'zh-CN',
    isoCode: 'zh-CN',
    name: 'Mandarin Chinese',
    nativeName: '中文',
    regionGroup: 'Global',
    shortCode: 'ZH',
    sampleGreeting: '你好，今天我可以怎么帮你？',
  },
  {
    code: 'ja-JP',
    isoCode: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    regionGroup: 'Global',
    shortCode: 'JA',
    sampleGreeting: 'こんにちは、今日はどのようなご用件ですか？',
  },
];

export function getLanguageByCode(code: string): LanguageOption {
  const exact = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  if (exact) return exact;
  const isoMatch = SUPPORTED_LANGUAGES.find((l) => l.isoCode === code);
  return isoMatch ?? SUPPORTED_LANGUAGES[10]; // English fallback
}

export function formatLanguageLabel(code: string): string {
  const lang = getLanguageByCode(code);
  return lang.nativeName === lang.name
    ? lang.name
    : `${lang.nativeName} (${lang.name})`;
}
