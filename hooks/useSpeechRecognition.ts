'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
}

export function useSpeechRecognition({
  lang = 'en-US',
  interimResults = true,
  continuous = true,
  onInterim,
  onFinal,
}: UseSpeechRecognitionOptions) {
  const [supported, setSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any | null>(null);
  const shouldRestartRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    // Detect support
    const SR: any = (typeof window !== 'undefined' && (window as any).SpeechRecognition)
      || (typeof window !== 'undefined' && (window as any).webkitSpeechRecognition);
    if (SR) {
      setSupported(true);
      recognitionRef.current = new SR();
      recognitionRef.current.lang = lang;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.continuous = continuous;

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        if (interim) {
          setInterimTranscript(interim);
          onInterim?.(interim);
        }
        if (finalText.trim()) {
          setInterimTranscript('');
          onFinal?.(finalText.trim());
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (!pausedRef.current && shouldRestartRef.current) {
          // Auto-restart to keep continuous listening
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (e) {
            // start can throw if called too soon; allow next onend to retry
          }
        }
      };

      recognitionRef.current.onerror = (e: any) => {
        // Network/no-speech etc. We keep trying if allowed
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
          shouldRestartRef.current = false;
          pausedRef.current = true;
          setIsListening(false);
        }
      };
    } else {
      setSupported(false);
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, [lang, interimResults, continuous, onInterim, onFinal]);

  const startListening = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    pausedRef.current = false;
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Ignore if already started
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestartRef.current = false;
    pausedRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const pause = useCallback(() => {
    // Temporarily stop but allow auto-resume later
    if (!recognitionRef.current) return;
    pausedRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const resume = useCallback(() => {
    if (!supported || !recognitionRef.current) return;
    pausedRef.current = false;
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {}
  }, [supported]);

  return {
    supported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    pause,
    resume,
  };
}
