import { X, Mic, Languages, Radio, Volume2 } from 'lucide-react';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

const PIPELINE_STAGES = [
  {
    step: '01',
    title: 'Speech Recognition (Web Speech API + Web Audio)',
    description:
      'Captures device microphone audio at low latency via getUserMedia, renders a live frequency waveform through an AnalyserNode, and streams interim and final speech transcripts in 16 regional and global locales.',
    icon: Mic,
  },
  {
    step: '02',
    title: 'Multi-Tier AI Translation Engine',
    description:
      'Resolves critical healthcare, travel, and civic phrases in under 20ms from an in-memory domain dictionary, then queries live neural translation endpoints (MyMemory, Lingva, and server-side context proxy) for open-ended speech.',
    icon: Languages,
  },
  {
    step: '03',
    title: 'Real-Time WebSocket & Multi-Tab Sync',
    description:
      'Broadcasts every utterance idempotently across connected devices over WebSockets (/ws) and across local browser tabs via BroadcastChannel, preserving room history and speaker metadata.',
    icon: Radio,
  },
  {
    step: '04',
    title: 'Native Speech Synthesis Playback',
    description:
      'Speaks the translated message aloud on each listener’s device in their chosen BCP-47 voice with configurable speed (0.85x Slow & Clear to 1.15x Fast) and one-tap message replay.',
    icon: Volume2,
  },
];

export function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="how-it-works-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              How EasyTalk Works
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Four-stage real-time speech-to-speech translation architecture
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close How It Works modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            {PIPELINE_STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.step}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Stage {stage.step}
                    </span>
                    <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {stage.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {stage.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-50/60 dark:bg-indigo-950/30 p-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            <strong className="font-semibold text-slate-900 dark:text-slate-100">
              Side-by-Side Verification:
            </strong>{' '}
            Every utterance displays both the translated sentence in the listener’s language and the
            speaker’s original text so doctors, officers, teachers, and travelers can verify meaning
            instantly without misunderstandings.
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 text-sm font-semibold text-white hover:opacity-95 transition-opacity whitespace-nowrap"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
