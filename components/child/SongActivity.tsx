import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { Colors, Spacing, FontSizes } from '@/constants/themes';
import { speak, stop } from '@/lib/speech';
import { lightImpact } from '@/lib/haptics';

interface SongContent {
  lyrics?: string;
  rhythm?: 'slow' | 'fast';
}

interface SongActivityProps {
  content: SongContent;
  onComplete: () => void;
  activityTitle?: string;
}

export function SongActivity({ content, onComplete, activityTitle }: SongActivityProps) {
  const lyricsSource = (typeof content.lyrics === 'string' && content.lyrics.trim())
    ? content.lyrics
    : activityTitle ?? '';
  const lines = lyricsSource.split('\n').filter((l) => l.trim());
  const [currentLine, setCurrentLine] = useState(0);
  const [songDone, setSongDone] = useState(false);
  const isFast = content.rhythm === 'fast';
  const interval = isFast ? 1500 : 2500;

  const bounce = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const noteScale = useRef(new Animated.Value(1)).current;
  const tapFlash = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load pop sound
  useEffect(() => {
    let mounted = true;
    async function loadSound() {
      try {
        // Required for sound playback on iOS (especially in silent mode)
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/pop.wav'),
        );
        if (mounted) soundRef.current = sound;
      } catch (err) {
        console.warn('[SongActivity] Failed to load pop sound:', err);
      }
    }
    loadSound();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Bounce + wiggle animation
  useEffect(() => {
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -18, duration: isFast ? 250 : 400, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: isFast ? 250 : 400, useNativeDriver: true }),
      ]),
    );
    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: isFast ? 200 : 350, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: isFast ? 400 : 700, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: isFast ? 200 : 350, useNativeDriver: true }),
      ]),
    );
    bounceLoop.start();
    wiggleLoop.start();
    return () => { bounceLoop.stop(); wiggleLoop.stop(); };
  }, [bounce, rotate, isFast]);

  // Speak each line as it becomes active
  useEffect(() => {
    if (currentLine < lines.length) {
      speak(lines[currentLine]);
    }
    return () => stop();
  }, [currentLine, lines]);

  // Auto-advance lyrics
  useEffect(() => {
    if (lines.length <= 1) {
      setSongDone(true);
      return;
    }
    const timer = setInterval(() => {
      setCurrentLine((prev) => {
        const next = prev + 1;
        if (next >= lines.length) {
          setSongDone(true);
          return prev;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [lines.length, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  const handleTap = useCallback(async () => {
    lightImpact();
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.setPositionAsync(0);
          await soundRef.current.playAsync();
        }
      }
    } catch (err) {
      console.warn('[SongActivity] Pop sound playback failed:', err);
    }

    Animated.sequence([
      Animated.timing(tapFlash, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(tapFlash, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();

    Animated.sequence([
      Animated.spring(noteScale, { toValue: 1.4, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(noteScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [tapFlash, noteScale]);

  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const flashBg = tapFlash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 230, 109, 0)', 'rgba(255, 230, 109, 0.4)'],
  });

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View style={[styles.container, { backgroundColor: flashBg }]}>
        <Animated.View
          style={[
            styles.noteContainer,
            { transform: [{ translateY: bounce }, { rotate: rotateInterp }, { scale: noteScale }] },
          ]}
        >
          <Text style={styles.noteIcon}>🎵</Text>
        </Animated.View>

        <ScrollView style={styles.lyricsScroll} contentContainerStyle={styles.lyricsContainer} bounces={false}>
          {lines.map((line, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.lyricLine,
                i === currentLine && styles.lyricLineActive,
                i < currentLine && styles.lyricLinePast,
              ]}
            >
              {line}
            </Animated.Text>
          ))}
        </ScrollView>

        <View style={styles.rhythmRow}>
          <Text style={styles.rhythmLabel}>{isFast ? '🏃💨' : '🐢✨'}</Text>
        </View>

        {songDone && (
          <TouchableOpacity style={styles.doneButton} onPress={onComplete} activeOpacity={0.7}>
            <Text style={styles.doneIcon}>✅</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  noteContainer: {
    marginBottom: Spacing.xl,
  },
  noteIcon: {
    fontSize: 64,
  },
  lyricsScroll: {
    flex: 1,
    width: '100%',
  },
  lyricsContainer: {
    justifyContent: 'center',
    flexGrow: 1,
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  lyricLine: {
    fontSize: FontSizes.xl,
    color: Colors.child.text,
    textAlign: 'center',
    opacity: 0.25,
    fontWeight: '500',
    lineHeight: 32,
  },
  lyricLineActive: {
    opacity: 1,
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.child.primary,
  },
  lyricLinePast: {
    opacity: 0.45,
    color: Colors.child.secondary,
  },
  rhythmRow: {
    marginBottom: Spacing.md,
  },
  rhythmLabel: {
    fontSize: 36,
  },
  doneButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.child.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  doneIcon: {
    fontSize: 36,
  },
});
