import { useState, type FormEvent } from 'react';
import { AlertCircle, Mic, MicOff, RefreshCw, Send, Sparkles } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { QUICK_PHRASES } from '../data/phrasesAndScenarios';
import type {
  DomainMode,
  MicCaptureMode,
  MicPermissionState,
  QuickPhrase,
} from '../types/easytalk';

interface VoiceCommandDockProps {
  activeSpeakerName: string;
  activeSpeakerLanguage: string;
  hearingLanguage: string;
  domainMode: DomainMode;
  isListening: boolean;
  interimTranscript: string;
  permissionState: MicPermissionState;
  micErrorMessage: string | null;
  audioBars: number[];
  micMode: MicCaptureMode;
  autoDetectLanguage: boolean;
  onChangeMicMode: (mode: MicCaptureMode) => void;
  onToggleAutoDetect: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleListening: () => void;
  onRetryMicPermission: () => void;
  onSendText: (text: string, inputMethod: 'text' | 'quick-phrase') => void;
}

export function VoiceCommandDock({
  activeSpeakerName,
  activeSpeakerLanguage,
  hearingLanguage,
  domainMode,
  isListening,
  interimTranscript,
  permissionState,
  micErrorMessage,
  audioBars,
  micMode,
  autoDetectLanguage,
  onChangeMicMode,
  onToggleAutoDetect,
  onStartListening,
  onStopListening,
  onToggleListening,
  onRetryMicPermission,
  onSendText,
}: VoiceCommandDockProps) {
  const [draftText, setDraftText] = useState('');
  const [dismissBanner, setDismissBanner] = useState(false);

  const speakerLang = getLanguageByCode(activeSpeakerLanguage);
  const hearLang = getLanguageByCode(hearingLanguage);
  const isConverting = speakerLang.isoCode !== hearLang.isoCode;

  // Order quick phrases so active domain + emergency appear first
  const orderedPhrases: QuickPhrase[] = [...QUICK_PHRASES].sort((a, b) => {
    const score = (p: QuickPhrase) =>
      p.domain === domainMode ? 0 : p.domain === 'emergency' ? 1 : 2;
    return score(a) - score(b);
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = draftText.trim();
    if (!clean) return;
    onSendText(clean, 'text');
    setDraftText('');
  };

  const showDiagnosticsBanner =
    !dismissBanner &&
    (Boolean(micErrorMessage) ||
      permissionState === 'denied' ||
      permissionState === 'unsupported');

  return (
    <section
      aria-label="Voice and Message Controls"
      className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 space-y-2"
    >
      {/* Microphone Permission & Diagnostics Banner */}
      {showDiagnosticsBanner ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="leading-snug">
              {micErrorMessage ??
                (permissionState === 'denied'
                  ? 'Microphone access is blocked. Allow permission in your browser bar or type/tap Quick Phrases.'
                  : 'Speech recognition is unavailable here. Type messages or use Quick Phrases below.')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRetryMicPermission}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="h-3 w-3" />
              Retry Mic Permission
            </button>
            <button
              type="button"
              onClick={() => setDismissBanner(true)}
              className="px-2 py-1 text-amber-800 dark:text-amber-300 hover:underline font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        permissionState === 'prompt' &&
        !dismissBanner && (
          <div className="hidden sm:flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Microphone ready — tap the mic button to grant browser audio permission and speak in{' '}
              {speakerLang.name}.
            </span>
            <button
              type="button"
              onClick={onRetryMicPermission}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
              Enable Mic Now
            </button>
          </div>
        )
      )}

      {/* Floating Live Interim Transcript Caption Bar */}
      {isListening && (
        <div
          className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/50 px-4 py-2 flex items-center justify-between gap-3"
          data-testid="live-interim-bar"
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Listening in {speakerLang.nativeName} ({speakerLang.name})
              {isConverting ? ` → Converting to ${hearLang.nativeName} (${hearLang.name})` : ''}...
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {interimTranscript || 'Speak clearly into your device microphone...'}
            </p>
          </div>
          <button
            type="button"
            onClick={onStopListening}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0"
          >
            Stop Mic
          </button>
        </div>
      )}

      {/* Quick Phrase Bar (1-Tap Accessible Communication with English Subtitles) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          Quick Phrases:
        </span>
        {orderedPhrases.map((phrase) => {
          const localized = phrase.translations[activeSpeakerLanguage] ?? phrase.labelEn;
          const showGloss = speakerLang.isoCode !== 'en';
          return (
            <button
              key={phrase.id}
              type="button"
              onClick={() => onSendText(localized, 'quick-phrase')}
              title={phrase.labelEn}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-400 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/60 text-left transition-colors shrink-0 max-w-[260px]"
            >
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {localized}
              </div>
              {showGloss && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {phrase.labelEn}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Command Row: Mic + Waveform + Controls + Text Input */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
        {/* Mic Button + Real-Time Web Audio API Waveform */}
        <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {isListening && (
              <span
                className="absolute inset-0 rounded-full bg-rose-500/40 animate-mic-ring pointer-events-none"
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              onClick={micMode === 'tap' ? onToggleListening : undefined}
              onPointerDown={micMode === 'hold' ? onStartListening : undefined}
              onPointerUp={micMode === 'hold' ? onStopListening : undefined}
              onPointerLeave={micMode === 'hold' && isListening ? onStopListening : undefined}
              aria-label={
                isListening
                  ? `Stop listening in ${speakerLang.name}`
                  : micMode === 'hold'
                    ? `Hold to speak in ${speakerLang.name}`
                    : `Start microphone in ${speakerLang.name}`
              }
              aria-pressed={isListening}
              className={`relative z-10 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-md transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : permissionState === 'granted'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gradient-to-br from-indigo-600 to-teal-600 hover:opacity-95'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>

          {/* 18-Bar Web Audio API Frequency Waveform */}
          <div
            className="flex items-center gap-1 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 overflow-hidden"
            aria-hidden="true"
            data-testid="audio-waveform"
          >
            {audioBars.map((level, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-transform duration-75 ${
                  idx >= 10 ? 'hidden sm:inline-block' : ''
                } ${
                  isListening
                    ? 'bg-gradient-to-t from-indigo-500 to-teal-400'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{
                  height: '24px',
                  transform: `scaleY(${isListening ? level : 0.22})`,
                }}
              />
            ))}
          </div>

          {/* Tap / Hold & Auto-Detect Toggles */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => onChangeMicMode('tap')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  micMode === 'tap'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tap
              </button>
              <button
                type="button"
                onClick={() => onChangeMicMode('hold')}
                className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  micMode === 'hold'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Hold
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleAutoDetect}
              aria-pressed={autoDetectLanguage}
              title="Automatically detect spoken or typed script"
              className={`inline-flex items-center gap-1 h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                autoDetectLanguage
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Auto-Detect</span>
            </button>
          </div>
        </div>

        {/* Text Input & Submit */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2 min-w-0">
          <label htmlFor="chat-message-input" className="sr-only">
            Type message as {activeSpeakerName} in {speakerLang.name}
          </label>
          <input
            id="chat-message-input"
            type="text"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder={
              isConverting
                ? `Speak or type in ${speakerLang.nativeName} (${speakerLang.name}) → converts to ${hearLang.name}...`
                : `Speak or type as ${activeSpeakerName} in ${speakerLang.nativeName} (${speakerLang.name})...`
            }
            className="flex-1 min-w-0 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!draftText.trim()}
            aria-label="Send and Translate Message"
            className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-45 transition-opacity whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </section>
  );
}
