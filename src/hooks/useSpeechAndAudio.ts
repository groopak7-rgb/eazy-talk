import { useCallback, useEffect, useRef, useState } from 'react';
import type { MicPermissionState } from '../types/easytalk';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface UseSpeechAndAudioOptions {
  languageCode: string;
  onFinalTranscript: (transcript: string) => void;
}

export function useSpeechAndAudio({
  languageCode,
  onFinalTranscript,
}: UseSpeechAndAudioOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionState, setPermissionState] = useState<MicPermissionState>('unknown');
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [audioBars, setAudioBars] = useState<number[]>(() => new Array(18).fill(0.14));
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const wantListeningRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  // Warm up SpeechSynthesis voices immediately + listen for voiceschanged
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      try {
        voicesRef.current = window.speechSynthesis.getVoices();
      } catch {
        // Ignore
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  // Check browser support & initial microphone permission status
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasMedia = Boolean(navigator.mediaDevices?.getUserMedia);
    setSpeechSupported(Boolean(SpeechCtor));

    if (!hasMedia && !SpeechCtor) {
      setPermissionState('unsupported');
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') setPermissionState('granted');
          else if (status.state === 'denied') setPermissionState('denied');
          else setPermissionState('prompt');

          status.onchange = () => {
            if (status.state === 'granted') setPermissionState('granted');
            else if (status.state === 'denied') setPermissionState('denied');
            else setPermissionState('prompt');
          };
        })
        .catch(() => {
          setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioBars(new Array(18).fill(0.14));
  }, []);

  const startVisualizer = useCallback(async (suppressErrors = false): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (!suppressErrors) setPermissionState('unsupported');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!wantListeningRef.current && suppressErrors) {
        stream.getTracks().forEach((t) => t.stop());
        return true;
      }
      mediaStreamRef.current = stream;
      setPermissionState('granted');
      setMicErrorMessage(null);

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return true;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 18;

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        const nextBars: number[] = [];
        const step = Math.max(1, Math.floor(buffer.length / barCount));
        for (let i = 0; i < barCount; i += 1) {
          const val = buffer[i * step] ?? 0;
          const normalized = Math.max(0.14, Math.min(1, val / 190));
          nextBars.push(normalized);
        }
        setAudioBars(nextBars);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (err) {
      if (suppressErrors) {
        // On some mobile browsers SpeechRecognition holds audio focus exclusively; keep recognition active
        return false;
      }
      const message = err instanceof Error ? err.message : 'Microphone access was blocked.';
      if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('notallowed')) {
        setPermissionState('denied');
        setMicErrorMessage('Microphone permission denied. Allow mic access in your browser settings or type below.');
      } else {
        setPermissionState('unsupported');
        setMicErrorMessage('No active microphone hardware detected. You can type or use Quick Phrases anytime.');
      }
      return false;
    }
  }, []);

  const stopListening = useCallback(() => {
    wantListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    stopVisualizer();
  }, [stopVisualizer]);

  const startListening = useCallback(async () => {
    if (wantListeningRef.current) return;
    setMicErrorMessage(null);
    wantListeningRef.current = true;

    const SpeechCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechCtor) {
      setSpeechSupported(false);
      const micOk = await startVisualizer(false);
      if (micOk) {
        setIsListening(true);
        setMicErrorMessage(
          'Live microphone waveform is active, but Speech-to-Text requires Chrome, Edge, or Safari. Type below to translate.',
        );
      } else {
        wantListeningRef.current = false;
      }
      return;
    }

    try {
      // Start SpeechRecognition immediately inside user gesture (critical for iOS/Android low latency)
      const recognition = new SpeechCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languageCode;

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (result.isFinal) {
            const finalClean = text.trim();
            if (finalClean) {
              onFinalRef.current(finalClean);
            }
            setInterimTranscript('');
          } else {
            interim += text;
          }
        }
        if (interim.trim()) {
          setInterimTranscript(interim.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionState('denied');
          setMicErrorMessage('Microphone access is blocked. Click "Retry Mic Permission" after allowing access.');
          stopListening();
        } else if (event.error === 'no-speech') {
          // Keep listening gently on silence
        } else if (event.error !== 'aborted') {
          setMicErrorMessage(`Speech recognition notice (${event.error}). You can keep speaking or type below.`);
        }
      };

      recognition.onend = () => {
        if (wantListeningRef.current) {
          try {
            recognition.start();
          } catch {
            stopListening();
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setPermissionState('granted');

      // Start audio waveform visualizer concurrently without blocking speech recognition
      void startVisualizer(true);
    } catch {
      setMicErrorMessage('Unable to start browser Speech Recognition. Type or tap Quick Phrases below.');
      stopListening();
    }
  }, [languageCode, startVisualizer, stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening || wantListeningRef.current) {
      stopListening();
    } else {
      void startListening();
    }
  }, [isListening, startListening, stopListening]);

  const retryMicPermission = useCallback(async () => {
    setMicErrorMessage(null);
    const ok = await startVisualizer(false);
    if (ok) {
      stopVisualizer();
    }
  }, [startVisualizer, stopVisualizer]);

  // Update active recognition language seamlessly if user switches language mid-session
  useEffect(() => {
    if (isListening && recognitionRef.current && recognitionRef.current.lang !== languageCode) {
      stopListening();
      void startListening();
    }
  }, [languageCode, isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
      stopVisualizer();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopVisualizer]);

  const speakText = useCallback((text: string, targetLangCode: string, rate = 1.0, pitch = 1.0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const clean = text.trim();
    if (!clean) return false;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = targetLangCode;
      utterance.rate = rate;
      utterance.pitch = pitch;

      const voices =
        voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      const lowerCode = targetLangCode.toLowerCase();
      const baseIso = lowerCode.split('-')[0];
      const matchedVoice =
        voices.find((v) => v.lang.toLowerCase() === lowerCode) ??
        voices.find((v) => v.lang.toLowerCase().startsWith(baseIso));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => setIsSpeakingTts(true);
      utterance.onend = () => setIsSpeakingTts(false);
      utterance.onerror = () => setIsSpeakingTts(false);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      setIsSpeakingTts(false);
      return false;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
    }
  }, []);

  return {
    isListening,
    interimTranscript,
    permissionState,
    micErrorMessage,
    audioBars,
    speechSupported,
    isSpeakingTts,
    startListening,
    stopListening,
    toggleListening,
    retryMicPermission,
    speakText,
    stopSpeaking,
  };
}
