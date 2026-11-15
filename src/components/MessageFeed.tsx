import { useEffect, useRef } from 'react';
import { ArrowRight, Captions, MessageSquare, Volume2 } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import type { ChatMessage } from '../types/easytalk';
import { shouldShowEnglishSubtitle } from '../utils/translationEngine';

interface MessageFeedProps {
  messages: ChatMessage[];
  speakingLanguage: string;
  hearingLanguage: string;
  showEnglishSubtitles: boolean;
  selfParticipantId: string;
  onReplayAudio: (text: string, langCode: string) => void;
  onSendStarterGreeting: () => void;
}

export function MessageFeed({
  messages,
  speakingLanguage,
  hearingLanguage,
  showEnglishSubtitles,
  selfParticipantId,
  onReplayAudio,
  onSendStarterGreeting,
}: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const speakingLangInfo = getLanguageByCode(speakingLanguage);
  const hearingLangInfo = getLanguageByCode(hearingLanguage);
  const isConvertingDifferent = speakingLangInfo.isoCode !== hearingLangInfo.isoCode;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 flex items-center justify-center"
        data-testid="message-feed-empty"
      >
        <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isConvertingDifferent
                ? `Speak in ${speakingLangInfo.nativeName} → Hear in ${hearingLangInfo.nativeName}`
                : `Ready to Converse in ${hearingLangInfo.nativeName} (${hearingLangInfo.name})`}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isConvertingDifferent
                ? `Anything you speak or type in ${speakingLangInfo.name} is converted live into ${hearingLangInfo.name} and spoken aloud. You can edit either language anytime in the top bar.`
                : 'Tap the microphone below to speak naturally, type a message, tap a Quick Phrase, or edit your Speaking and Hearing languages in the top bar.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSendStarterGreeting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-xs sm:text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap"
            >
              {isConvertingDifferent
                ? `Test Conversion: ${speakingLangInfo.nativeName} → ${hearingLangInfo.nativeName}`
                : `Send Greeting in ${speakingLangInfo.nativeName}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4"
      data-testid="message-feed"
      aria-live="polite"
    >
      {messages.map((msg) => {
        const srcLang = getLanguageByCode(msg.senderLanguage);
        const isSelf = msg.senderId === selfParticipantId;
        const translation = msg.translations[hearingLanguage];
        const sameLanguage = srcLang.isoCode === hearingLangInfo.isoCode;
        const primaryText = sameLanguage
          ? msg.originalText
          : translation?.translatedText ?? msg.originalText;
        const isPendingTranslation = !sameLanguage && !translation;

        const showEnSub = shouldShowEnglishSubtitle(
          msg.senderLanguage,
          hearingLanguage,
          showEnglishSubtitles,
        );
        const enSubEntry = msg.translations['en-IN'];

        const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        const inputLabel =
          msg.inputMethod === 'voice'
            ? 'Voice'
            : msg.inputMethod === 'quick-phrase'
              ? 'Quick Phrase'
              : msg.inputMethod === 'companion'
                ? 'Partner'
                : 'Typed';

        return (
          <article
            key={msg.id}
            data-testid="chat-message-card"
            className={`rounded-2xl border p-4 sm:p-5 transition-colors shadow-xs ${
              isSelf
                ? 'border-indigo-200/80 dark:border-indigo-900/70 bg-white/95 dark:bg-slate-900/95'
                : 'border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95'
            }`}
          >
            {/* Speaker & Language Conversion Trail Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {msg.senderName}
                </span>
                <span aria-hidden="true">·</span>
                {sameLanguage ? (
                  <span>
                    Spoke in {srcLang.nativeName} ({srcLang.name})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-medium text-teal-700 dark:text-teal-400">
                    <span>
                      Converted {srcLang.nativeName} ({srcLang.name})
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    <span>
                      {hearingLangInfo.nativeName} ({hearingLangInfo.name})
                    </span>
                  </span>
                )}
                <span aria-hidden="true">·</span>
                <span>{inputLabel}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {isPendingTranslation ? (
                  <span>Translating...</span>
                ) : translation ? (
                  <span>
                    Converted in {(translation.latencyMs / 1000).toFixed(2)}s ·{' '}
                    {translation.provider}
                  </span>
                ) : (
                  <span>Same Language</span>
                )}
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{timeFormatted}</span>
              </div>
            </div>

            {/* Dual-Layer Side-by-Side Display */}
            <div className="mt-3.5 grid gap-4 md:grid-cols-12 items-start">
              {/* Primary: Converted / Hearing Language Output */}
              <div className="md:col-span-7 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    {sameLanguage
                      ? `Message in ${hearingLangInfo.name}`
                      : `Converted to ${hearingLangInfo.nativeName} (${hearingLangInfo.name})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onReplayAudio(primaryText, hearingLangInfo.code)}
                    aria-label={`Replay converted voice from ${msg.senderName}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-colors whitespace-nowrap"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Replay Voice</span>
                  </button>
                </div>

                <p
                  dir={hearingLangInfo.rtl ? 'rtl' : 'ltr'}
                  className="text-base sm:text-lg font-semibold leading-relaxed text-slate-900 dark:text-slate-100"
                >
                  {primaryText}
                </p>
              </div>

              {/* Secondary: Original Speech Text for Verification */}
              <div className="md:col-span-5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Original Speech ({srcLang.nativeName})
                  </span>
                  <button
                    type="button"
                    onClick={() => onReplayAudio(msg.originalText, srcLang.code)}
                    aria-label={`Hear original ${srcLang.name} message`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Original</span>
                  </button>
                </div>
                <p
                  dir={srcLang.rtl ? 'rtl' : 'ltr'}
                  className="text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                >
                  {msg.originalText}
                </p>
              </div>
            </div>

            {/* Universal English Subtitle Bar (when speaking & hearing non-English languages) */}
            {showEnSub && (
              <div
                data-testid="english-subtitle-bar"
                className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2 min-w-0 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400 shrink-0 pt-0.5">
                    <Captions className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>English Subtitle:</span>
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {enSubEntry?.translatedText ?? 'Translating English subtitle...'}
                  </span>
                </div>
                {enSubEntry?.translatedText && (
                  <button
                    type="button"
                    onClick={() => onReplayAudio(enSubEntry.translatedText, 'en-IN')}
                    aria-label={`Play English subtitle for ${msg.senderName}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Hear EN</span>
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
