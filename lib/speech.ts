import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { supabase } from '@/lib/supabase';
import i18n from '@/lib/i18n';

let currentSound: Audio.Sound | null = null;
const audioCache = new Map<string, string>(); // text → base64

export async function speak(text: string, onDone?: () => void): Promise<void> {
  stop();

  if (!text?.trim()) {
    onDone?.();
    return;
  }

  // Try ElevenLabs first
  try {
    let base64Audio = audioCache.get(text);

    if (!base64Audio) {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text },
      });

      if (error || !data?.audio) throw new Error(error?.message ?? 'No audio returned');
      base64Audio = data.audio as string;
      audioCache.set(text, base64Audio);

      // Evict oldest if cache grows too large
      if (audioCache.size > 50) {
        const firstKey = audioCache.keys().next().value;
        if (firstKey !== undefined) audioCache.delete(firstKey);
      }
    }

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      { uri: `data:audio/mpeg;base64,${base64Audio}` },
      { shouldPlay: true },
    );
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (currentSound === sound) currentSound = null;
        onDone?.();
      }
    });
    return;
  } catch (e) {
    console.warn('[speech] ElevenLabs failed, falling back to expo-speech:', e);
  }

  // Fallback to system TTS
  const lang = i18n.language.startsWith('pt') ? 'pt-BR' : 'en-US';
  try { Speech.stop(); } catch { /* ignore */ }
  Speech.speak(text, {
    language: lang,
    rate: 0.85,
    onDone,
    onError: () => onDone?.(),
  });
}

export function stop(): void {
  if (currentSound) {
    const s = currentSound;
    currentSound = null;
    s.stopAsync().then(() => s.unloadAsync()).catch(() => {});
  }
  try { Speech.stop(); } catch { /* ignore */ }
}

export function isSpeaking(): boolean {
  return currentSound !== null;
}
