import { useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Captions,
  Check,
  Copy,
  Download,
  HelpCircle,
  Link2,
  Moon,
  Settings,
  Sun,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { DOMAIN_MODE_OPTIONS } from '../data/phrasesAndScenarios';
import type { ConnectionTransportState, DomainMode } from '../types/easytalk';

interface RoomHeaderProps {
  roomCode: string;
  transportState: ConnectionTransportState;
  speakingLanguage: string;
  hearingLanguage: string;
  onChangeSpeakingLanguage: (langCode: string) => void;
  onChangeHearingLanguage: (langCode: string) => void;
  onSwapLanguages: () => void;
  domainMode: DomainMode;
  onChangeDomainMode: (mode: DomainMode) => void;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  showEnglishSubtitles: boolean;
  onToggleEnglishSubtitles: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  participantCount: number;
  onOpenMobileParticipants: () => void;
  onOpenHowItWorks: () => void;
  onOpenSettings: () => void;
  onDownloadTranscript: (format: 'txt' | 'json') => void;
  onLeaveRoom: () => void;
}

export function RoomHeader({
  roomCode,
  transportState,
  speakingLanguage,
  hearingLanguage,
  onChangeSpeakingLanguage,
  onChangeHearingLanguage,
  onSwapLanguages,
  domainMode,
  onChangeDomainMode,
  autoSpeak,
  onToggleAutoSpeak,
  showEnglishSubtitles,
  onToggleEnglishSubtitles,
  darkMode,
  onToggleDarkMode,
  participantCount,
  onOpenMobileParticipants,
  onOpenHowItWorks,
  onOpenSettings,
  onDownloadTranscript,
  onLeaveRoom,
}: RoomHeaderProps) {
  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedType('code');
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setCopiedType('code');
      setTimeout(() => setCopiedType(null), 1800);
    }
  };

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 1800);
    }
  };

  const statusLabel =
    transportState === 'live-ws'
      ? 'Live'
      : transportState === 'tab-sync'
        ? 'Tab Sync'
        : transportState === 'connecting'
          ? 'Connecting'
          : 'Local Mode';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      <div className="px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Back, Brand, Room Code & Status */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave room and return to lobby"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="hidden sm:block font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0">
            EasyTalk
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 px-2.5 sm:px-3 py-1 text-white shrink-0">
            <span className="font-mono text-xs sm:text-sm font-semibold tracking-wider tabular-nums">
              {roomCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              aria-label="Copy Room Code"
              title="Copy Room Code"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
            >
              {copiedType === 'code' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleCopyShareLink}
              aria-label="Copy Shareable Room Link"
              title="Copy Share Link"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
            >
              {copiedType === 'link' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
            <span
              className={`h-2 w-2 rounded-full ${
                transportState === 'live-ws'
                  ? 'bg-emerald-500'
                  : transportState === 'tab-sync'
                    ? 'bg-teal-500'
                    : 'bg-amber-500'
              }`}
              aria-hidden="true"
            />
            <span className="font-medium">{statusLabel}</span>
          </div>
        </div>

        {/* Center/Right: Editable Speak -> Hear Pair, Subtitles, Auto-Speak, Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Mobile Participants Button */}
          <button
            type="button"
            onClick={onOpenMobileParticipants}
            className="lg:hidden inline-flex items-center gap-1 h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0"
          >
            <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{participantCount}</span>
          </button>

          {/* Editable Speaking -> Hearing Language Pair */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-1">
            <div className="flex items-center gap-1 pl-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                Speak
              </span>
              <label htmlFor="header-speaking-language" className="sr-only">
                Speaking Language
              </label>
              <select
                id="header-speaking-language"
                value={speakingLanguage}
                onChange={(e) => onChangeSpeakingLanguage(e.target.value)}
                className="h-7 sm:h-8 max-w-[115px] sm:max-w-[145px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onSwapLanguages}
              aria-label="Swap speaking and hearing languages"
              title="Swap speaking & hearing languages"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1 pr-0.5">
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hidden sm:inline">
                Hear
              </span>
              <label htmlFor="header-hearing-language" className="sr-only">
                Hearing Language
              </label>
              <select
                id="header-hearing-language"
                value={hearingLanguage}
                onChange={(e) => onChangeHearingLanguage(e.target.value)}
                className="h-7 sm:h-8 max-w-[115px] sm:max-w-[145px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Domain Mode Selector */}
          <div className="hidden xl:flex items-center">
            <label htmlFor="header-domain-select" className="sr-only">
              Domain Mode
            </label>
            <select
              id="header-domain-select"
              value={domainMode}
              onChange={(e) => onChangeDomainMode(e.target.value as DomainMode)}
              className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DOMAIN_MODE_OPTIONS.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>

          {/* English Subtitles Toggle */}
          <button
            type="button"
            onClick={onToggleEnglishSubtitles}
            aria-pressed={showEnglishSubtitles}
            title="Show English subtitles when speaking and hearing non-English languages"
            className={`inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              showEnglishSubtitles
                ? 'border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <Captions className="h-4 w-4" />
            <span className="hidden md:inline">EN Subtitles</span>
          </button>

          {/* Auto-Speak Toggle */}
          <button
            type="button"
            onClick={onToggleAutoSpeak}
            aria-pressed={autoSpeak}
            className={`inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              autoSpeak
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden md:inline">Auto-Speak {autoSpeak ? 'On' : 'Off'}</span>
          </button>

          {/* Transcript Export Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              aria-expanded={exportOpen}
              aria-label="Download Conversation Transcript"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span className="hidden 2xl:inline">Transcript</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1.5 z-40">
                <button
                  type="button"
                  onClick={() => {
                    onDownloadTranscript('txt');
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Download Report (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDownloadTranscript('json');
                    setExportOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Download Structured (.json)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenHowItWorks}
            aria-label="Open How It Works pipeline overview"
            title="How It Works"
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open Voice and Translation Settings"
            title="Settings"
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
            className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
