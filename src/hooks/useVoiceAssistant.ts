import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

type Recognition = any;

export interface UseVoiceAssistantOptions {
  language?: string; // e.g., 'es-MX'
}

export function useVoiceAssistant(options?: UseVoiceAssistantOptions) {
  const language = options?.language || 'es-MX';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);

  const supportsListening = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const W: any = window as any;
    return !!(W.SpeechRecognition || W.webkitSpeechRecognition);
  }, []);

  const speak = useCallback((text: string) => {
    if (!text) return;
    try {
      Speech.stop();
      setIsSpeaking(true);
      Speech.speak(text, {
        language,
        voice: voiceId,
        rate: 0.98,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (_e) {
      setIsSpeaking(false);
    }
  }, [language, voiceId]);

  const stop = useCallback(() => {
    try { Speech.stop(); } catch {}
    setIsSpeaking(false);
  }, []);

  const listenOnce = useCallback(async (): Promise<string | null> => {
    if (!supportsListening) return null;
    return new Promise((resolve) => {
      try {
        const W: any = window as any;
        const Rec = W.SpeechRecognition || W.webkitSpeechRecognition;
        const rec: any = new Rec();
        recognitionRef.current = rec;
        rec.lang = language;
        rec.maxAlternatives = 3;
        rec.interimResults = false;
        setIsListening(true);
        rec.onresult = (event: any) => {
          const transcript = event?.results?.[0]?.[0]?.transcript as string;
          setIsListening(false);
          resolve(transcript || '');
        };
        rec.onerror = () => { setIsListening(false); resolve(''); };
        rec.onend = () => { setIsListening(false); };
        rec.start();
      } catch (_e) {
        setIsListening(false);
        resolve(null);
      }
    });
  }, [language, supportsListening]);

  useEffect(() => () => { try { Speech.stop(); } catch {} }, []);

  // Pick the best available voice for the selected language on native platforms
  useEffect(() => {
    (async () => {
      try {
        const voices = await (Speech as any).getAvailableVoicesAsync?.();
        if (Array.isArray(voices)) {
          // Prefer exact locale match, then language prefix
          const exact = voices.find((v: any) => v?.language?.toLowerCase() === language.toLowerCase());
          const partial = voices.find((v: any) => (v?.language || '').toLowerCase().startsWith(language.split('-')[0].toLowerCase()));
          const chosen = exact || partial;
          if (chosen?.identifier) setVoiceId(chosen.identifier);
        }
      } catch {}
    })();
  }, [language]);

  return { speak, stop, isSpeaking, listenOnce, isListening, supportsListening };
}

export default useVoiceAssistant;


