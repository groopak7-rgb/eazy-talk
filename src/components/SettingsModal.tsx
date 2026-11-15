import { Volume2, X, Mic } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import type {
  MicCaptureMode,
  MicPermissionState,
  TranslationEnginePreference,
  VoiceSettings,
} from '../types/easytalk';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onUpdateSettings: (next: Partial<VoiceSettings>) => void;
  currentLanguageCode: string;
  micPermissionState: MicPermissionState;
  onTestVoice: () => void;
  onRetryMic: () => void;
}

const SPEED_PRESETS = [
  { value: 0.85, label: '0.85x Slow & Clear' },
  { value: 1.0, label: '1.0x Natural' },
  { value: 1.15, label: '1.15x Fast' },
];

const ENGINE_OPTIONS: Array<{
  id: TranslationEnginePreference;
  label: string;
  desc: string;
}> = [
  {
    id: 'auto',
    label: 'Smart Auto (Cache + Live API)',
    desc: 'Uses instant phrase dictionary first, then live MyMemory / Lingva / server proxy.',
  },
  {
    id: 'dictionary-first',
    label: 'Dictionary Priority',
    desc: 'Maximizes sub-20ms cached lookups before calling live translation APIs.',
  },
  {
    id: 'cloud-proxy',
    label: 'Server Context Proxy',
    desc: 'Routes directly through /api/translate for domain-aware neural translation.',
  },
];

export function SettingsModal({
  open,
  onClose,
  settings,
  onUpdateSettings,
  currentLanguageCode,
  micPermissionState,
  onTestVoice,
  onRetryMic,
}: SettingsModalProps) {
  if (!open) return null;

  const langInfo = getLanguageByCode(currentLanguageCode);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="settings-modal-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Voice & Translation Settings
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Active output voice: {langInfo.nativeName} ({langInfo.name})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Speech Playback Speed
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {settings.speechRate.toFixed(2)}x
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SPEED_PRESETS.map((preset) => {
                const active = Math.abs(settings.speechRate - preset.value) < 0.01;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onUpdateSettings({ speechRate: preset.value })}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="voice-pitch-range"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Voice Pitch
              </label>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {settings.speechPitch.toFixed(1)}
              </span>
            </div>
            <input
              id="voice-pitch-range"
              type="range"
              min="0.8"
              max="1.2"
              step="0.1"
              value={settings.speechPitch}
              onChange={(e) => onUpdateSettings({ speechPitch: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Mic Capture Mode */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
              Microphone Control Mode
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['tap', 'hold'] as MicCaptureMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ micMode: mode })}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                    settings.micMode === mode
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode === 'tap' ? 'Tap-to-Speak (Toggle)' : 'Hold-to-Talk (Press)'}
                </button>
              ))}
            </div>
          </div>

          {/* Translation Engine */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
              Translation Engine Routing
            </span>
            <div className="space-y-2">
              {ENGINE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateSettings({ enginePreference: opt.id })}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors ${
                    settings.enginePreference === opt.id
                      ? 'border-indigo-600 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/50'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hardware Diagnostics */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Audio Hardware Diagnostics
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Mic status: <span className="font-medium capitalize">{micPermissionState}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRetryMic}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Mic className="h-3.5 w-3.5" />
                Check Mic
              </button>
              <button
                type="button"
                onClick={onTestVoice}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Test Voice
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
