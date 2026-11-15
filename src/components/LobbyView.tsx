import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Globe2,
  Moon,
  RefreshCw,
  Stethoscope,
  Sun,
  Train,
  GraduationCap,
  Landmark,
  Users,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { DOMAIN_MODE_OPTIONS, SCENARIO_PRESETS } from '../data/phrasesAndScenarios';
import type { DomainMode, ScenarioPreset } from '../types/easytalk';
import { generateRoomCode, normalizeRoomCode } from '../utils/translationEngine';

interface LobbyViewProps {
  initialRoomCode?: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHowItWorks: () => void;
  onEnterRoom: (params: {
    mode: 'create' | 'join';
    roomCode: string;
    userName: string;
    speakingLanguage: string;
    hearingLanguage: string;
    domainMode: DomainMode;
    preset?: ScenarioPreset;
  }) => void;
}

const SCENARIO_ICONS = {
  'healthcare-consultation': Stethoscope,
  'travel-directions': Train,
  'classroom-lecture': GraduationCap,
  'public-service-desk': Landmark,
  'team-collaboration': Users,
} as const;

export function LobbyView({
  initialRoomCode,
  darkMode,
  onToggleDarkMode,
  onOpenHowItWorks,
  onEnterRoom,
}: LobbyViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create',
  );
  const [userName, setUserName] = useState('');
  const [speakingLanguage, setSpeakingLanguage] = useState('te-IN');
  const [hearingLanguage, setHearingLanguage] = useState('en-IN');
  const [domainMode, setDomainMode] = useState<DomainMode>('general');
  const [generatedCode, setGeneratedCode] = useState(() => generateRoomCode());
  const [joinCode, setJoinCode] = useState(initialRoomCode ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const indianLanguages = SUPPORTED_LANGUAGES.filter(
    (l) => l.regionGroup === 'Indian Regional',
  );
  const globalLanguages = SUPPORTED_LANGUAGES.filter((l) => l.regionGroup === 'Global');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = userName.trim();
    if (!cleanName) {
      setFormError('Please enter your name so other participants know who is speaking.');
      return;
    }

    const targetCode =
      activeTab === 'create' ? generatedCode : normalizeRoomCode(joinCode);

    if (activeTab === 'join' && targetCode.length < 4) {
      setFormError('Please enter a valid 6-character Room Code (for example, ET4829).');
      return;
    }

    setFormError(null);
    onEnterRoom({
      mode: activeTab,
      roomCode: targetCode,
      userName: cleanName,
      speakingLanguage,
      hearingLanguage,
      domainMode,
    });
  };

  const handleStartPreset = (preset: ScenarioPreset) => {
    onEnterRoom({
      mode: 'create',
      roomCode: generateRoomCode(),
      userName: userName.trim() || preset.suggestedUserName,
      speakingLanguage: preset.suggestedLanguage,
      hearingLanguage: preset.partnerLanguage,
      domainMode: preset.domainMode,
      preset,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Three-Zone Top Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            EasyTalk
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#scenarios"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Scenarios
            </a>
            <a
              href="#languages"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Languages
            </a>
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-14 space-y-10 sm:space-y-16">
        {/* Hero Split: Story & Photo Left + Create/Join Room Card Right */}
        <section className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 min-w-0 flex flex-col justify-between gap-5 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-400">
                Any Language, One Easy Conversation
              </p>
              <h1 className="font-display text-2xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-tight text-balance">
                Speak in your language. Everyone hears theirs.
              </h1>
              <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Hold effortless two-way or group voice conversations across 16 Indian regional and
                global languages inside a shared browser room—with side-by-side text verification
                and spoken playback.
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span>Zero app installation</span>
                <span aria-hidden="true">·</span>
                <span>Live browser microphone &amp; TTS</span>
                <span aria-hidden="true">·</span>
                <span>16 scripts supported</span>
              </div>
            </div>

            {/* Warm Documentary Hero Image with Fallback (hidden on small phones so Create/Join is immediate) */}
            <div className="hidden sm:block relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 aspect-4/3 max-h-[320px] w-full">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/easytalk_hero_conversation_1794732739092.jpg"
                  alt="A doctor and patient smiling and conversing comfortably across a desk"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600/15 to-teal-600/15 text-center">
                  <Globe2 className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    EasyTalk Multilingual Rooms
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-4 sm:p-5">
                <p className="text-xs sm:text-sm font-medium text-white">
                  Built for clinics, railway help desks, classrooms, and everyday conversations.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Prominent Dual-Tab Create / Join Room Card */}
          <div className="lg:col-span-6 min-w-0 flex items-stretch">
            <div className="w-full min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 shadow-sm p-5 sm:p-8 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Tab Switcher */}
                <div
                  className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900"
                  role="tablist"
                  aria-label="Room Entry Mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'create'}
                    onClick={() => {
                      setActiveTab('create');
                      setFormError(null);
                    }}
                    className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'create'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Create New Room
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'join'}
                    onClick={() => {
                      setActiveTab('join');
                      setFormError(null);
                    }}
                    className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'join'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Join with Code
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="lobby-name-input"
                      className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                    >
                      Your Name
                    </label>
                    <input
                      id="lobby-name-input"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g., Arun, Dr. Sharma, Lakshmi"
                      className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Speaking & Hearing Language Selectors */}
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="lobby-speaking-language"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                      >
                        I Speak (Voice / Input)
                      </label>
                      <select
                        id="lobby-speaking-language"
                        value={speakingLanguage}
                        onChange={(e) => setSpeakingLanguage(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <optgroup label="Indian Regional Languages">
                          {indianLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="International Languages">
                          {globalLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="lobby-hearing-language"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                      >
                        Hear &amp; Read In (Convert To)
                      </label>
                      <select
                        id="lobby-hearing-language"
                        value={hearingLanguage}
                        onChange={(e) => setHearingLanguage(e.target.value)}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <optgroup label="International Languages">
                          {globalLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Indian Regional Languages">
                          {indianLanguages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.nativeName} ({lang.name})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {/* Create vs Join Specific Field */}
                  {activeTab === 'create' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Generated Room Code
                        </span>
                        <div className="flex items-center justify-between h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5">
                          <span className="font-mono text-base font-bold tracking-widest text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {generatedCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => setGeneratedCode(generateRoomCode())}
                            aria-label="Generate new room code"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="lobby-domain-select"
                          className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                        >
                          Conversation Domain
                        </label>
                        <select
                          id="lobby-domain-select"
                          value={domainMode}
                          onChange={(e) => setDomainMode(e.target.value as DomainMode)}
                          className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {DOMAIN_MODE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="lobby-room-code-input"
                        className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
                      >
                        6-Character Room Code
                      </label>
                      <input
                        id="lobby-room-code-input"
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(normalizeRoomCode(e.target.value))}
                        placeholder="e.g., ET4829"
                        maxLength={8}
                        className="w-full h-12 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 font-mono text-base font-bold tracking-widest text-slate-900 dark:text-slate-100 uppercase placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {formError && (
                    <p
                      role="alert"
                      className="text-xs font-medium text-rose-600 dark:text-rose-400"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-sm sm:text-base font-bold text-white shadow-sm hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2"
                  >
                    <span>
                      {activeTab === 'create' ? 'Create & Enter Room' : 'Join Live Room'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-900/60 p-4 grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Live Microphone
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Tap or hold to speak with live captions
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Side-by-Side Text
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Verify both original &amp; translated lines
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Auto-Speak Audio
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      Reads replies aloud in your language
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Share room code across devices or open a second tab to test live sync</span>
                <button
                  type="button"
                  onClick={onOpenHowItWorks}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
                >
                  4-Stage AI Pipeline
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick-Start Scenario Presets */}
        <section id="scenarios" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                Quick-Start Conversation Scenarios
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Launch a pre-configured room with domain vocabulary and a ready companion partner in
                one click.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SCENARIO_PRESETS.map((preset) => {
              const Icon = SCENARIO_ICONS[preset.id as keyof typeof SCENARIO_ICONS] ?? Users;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleStartPreset(preset)}
                  className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 p-5 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {preset.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {preset.subtitle}
                    </p>
                  </div>
                  <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 inline-flex items-center gap-1">
                    <span>Launch Room</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Supported Languages Matrix */}
        <section id="languages" className="space-y-5">
          <div className="space-y-1">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
              16 Supported Indian Regional &amp; Global Languages
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every participant speaks and reads in their own script with crisp Noto Sans
              typography.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className="min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 space-y-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {lang.nativeName}
                  </span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {lang.code}
                  </span>
                </div>
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {lang.name} · {lang.regionGroup}
                </div>
                <p
                  dir={lang.rtl ? 'rtl' : 'ltr'}
                  className="text-xs text-slate-600 dark:text-slate-300 truncate pt-1"
                >
                  {lang.sampleGreeting}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>EasyTalk — Any Language, One Easy Conversation</span>
          <span>Real-time WebSocket + Web Speech API + Multi-Tier Translation</span>
        </div>
      </footer>
    </div>
  );
}
