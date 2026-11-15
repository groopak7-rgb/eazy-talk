import { Bot, MessageSquarePlus, UserPlus, Users, X } from 'lucide-react';
import { getLanguageByCode } from '../data/languages';
import { COMPANION_PERSONAS } from '../data/phrasesAndScenarios';
import type { CompanionPersona, DomainMode, RoomParticipant } from '../types/easytalk';

interface ParticipantsSidebarProps {
  participants: RoomParticipant[];
  activeSpeakerId: string;
  selfParticipantId: string;
  domainMode: DomainMode;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectActiveSpeaker: (participantId: string) => void;
  onAddVirtualPartner: (persona: CompanionPersona) => void;
  onRemoveVirtualPartner: (participantId: string) => void;
  onTriggerPartnerReply: (persona: CompanionPersona) => void;
}

export function ParticipantsSidebar({
  participants,
  activeSpeakerId,
  selfParticipantId,
  domainMode,
  mobileOpen,
  onCloseMobile,
  onSelectActiveSpeaker,
  onAddVirtualPartner,
  onRemoveVirtualPartner,
  onTriggerPartnerReply,
}: ParticipantsSidebarProps) {
  const existingIds = new Set(participants.map((p) => p.id));

  const sidebarBody = (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Room Participants ({participants.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close participants drawer"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Active Participant Roster */}
        <div className="space-y-2.5">
          {participants.map((p) => {
            const lang = getLanguageByCode(p.languageCode);
            const isSpeakingAs = p.id === activeSpeakerId;
            return (
              <div
                key={p.id}
                className={`rounded-xl border p-3 transition-colors ${
                  isSpeakingAs
                    ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${p.avatarColor}`}
                    >
                      {p.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {p.name}
                        </span>
                        {p.id === selfParticipantId && (
                          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {p.hearingLanguageCode && p.hearingLanguageCode !== p.languageCode
                          ? `Speaks ${lang.nativeName} · Hears ${getLanguageByCode(p.hearingLanguageCode).nativeName}`
                          : `${lang.nativeName} · ${lang.name}`}
                        {p.role ? ` · ${p.role}` : ''}
                      </div>
                    </div>
                  </div>

                  {p.isVirtual && (
                    <button
                      type="button"
                      onClick={() => onRemoveVirtualPartner(p.id)}
                      aria-label={`Remove ${p.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200 shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Speaking Indicator / Perspective Switch */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  {p.isSpeaking ? (
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Speaking live now
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {isSpeakingAs ? 'Active input speaker' : 'Listening'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectActiveSpeaker(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isSpeakingAs
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isSpeakingAs ? 'Speaking As' : 'Speak As'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Companion / Multi-Participant Simulator */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Demo Companion Simulator
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Test two-way or group translation on a single device. Add a partner and trigger a
            contextual reply in their native language.
          </p>

          <div className="space-y-2">
            {COMPANION_PERSONAS.map((persona) => {
              const lang = getLanguageByCode(persona.languageCode);
              const isAdded = existingIds.has(persona.id);
              const domainMatch =
                persona.contextualReplies.find((r) => r.domain === domainMode) ??
                persona.contextualReplies[0];

              return (
                <div
                  key={persona.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {persona.name} · {lang.nativeName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {persona.role} ({lang.name})
                      </div>
                    </div>

                    {!isAdded ? (
                      <button
                        type="button"
                        onClick={() => onAddVirtualPartner(persona)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onTriggerPartnerReply(persona)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        Reply
                      </button>
                    )}
                  </div>
                  {isAdded && domainMatch && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      “{domainMatch.englishHint}”
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0 h-full overflow-hidden">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
