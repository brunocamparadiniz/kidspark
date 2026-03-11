import * as Speech from 'expo-speech';
import i18n from '@/lib/i18n';

const RATE = 0.85;

function getLanguageCode(): string {
  return i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';
}

export function speak(text: string, onDone?: () => void): void {
  Speech.stop();
  Speech.speak(text, {
    language: getLanguageCode(),
    rate: RATE,
    onDone,
    onError: () => {
      // Speech failed — call onDone so callers don't hang
      onDone?.();
    },
  });
}

export function stop(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}
