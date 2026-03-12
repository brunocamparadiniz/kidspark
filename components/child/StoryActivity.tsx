import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import { speak, stop } from '@/lib/speech';

interface StoryContent {
  text?: string;
  pages?: unknown[];
}

interface StoryActivityProps {
  content: StoryContent;
  onComplete: () => void;
  activityTitle?: string;
}

function normalizePage(page: unknown): string {
  if (typeof page === 'string') return page;
  if (page && typeof page === 'object') {
    const obj = page as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.page === 'string') return obj.page;
    return JSON.stringify(obj);
  }
  return String(page);
}

export function StoryActivity({ content, onComplete, activityTitle }: StoryActivityProps) {
  const rawPages = content.pages ?? (content.text ? [content.text] : (activityTitle ? [activityTitle] : []));
  const pages = rawPages.map(normalizePage).filter((p) => p.trim());
  const [pageIndex, setPageIndex] = useState(0);
  const [autoMode, setAutoMode] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const isLastPage = pageIndex >= pages.length - 1;

  const countdown = useRef(new Animated.Value(0)).current;
  const countdownAnim = useRef<Animated.CompositeAnimation | null>(null);
  const pageFade = useRef(new Animated.Value(1)).current;

  // Speak current page text
  useEffect(() => {
    if (pages.length === 0) return;
    const text = pages[pageIndex];
    if (!text) return;

    setSpeaking(true);
    speak(text, () => setSpeaking(false));

    return () => stop();
  }, [pageIndex, pages]);

  const advancePage = useCallback(() => {
    stop();
    if (isLastPage) {
      onComplete();
      return;
    }

    Animated.timing(pageFade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPageIndex((i) => i + 1);
      Animated.timing(pageFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [isLastPage, onComplete, pageFade]);

  // Auto-advance: wait for speech to finish, then start countdown
  useEffect(() => {
    if (!autoMode || speaking) {
      countdownAnim.current?.stop();
      countdown.setValue(0);
      return;
    }

    countdown.setValue(0);
    const anim = Animated.timing(countdown, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    });
    countdownAnim.current = anim;
    anim.start(({ finished }) => {
      if (finished) advancePage();
    });

    return () => anim.stop();
  }, [autoMode, speaking, pageIndex, countdown, advancePage]);

  function handleNext() {
    countdownAnim.current?.stop();
    countdown.setValue(0);
    advancePage();
  }

  const ringWidth = countdown.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  if (pages.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.storyText}>{content.text ?? ''}</Text>
        <TouchableOpacity style={styles.nextArea} onPress={onComplete} activeOpacity={0.7}>
          <Text style={styles.nextIcon}>✅</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pages.length > 1 && (
        <View style={styles.topRow}>
          <View style={styles.dotsRow}>
            {pages.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === pageIndex && styles.dotActive, i < pageIndex && styles.dotDone]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.autoButton, autoMode && styles.autoButtonActive]}
            onPress={() => setAutoMode((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.autoIcon}>{autoMode ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {autoMode && (
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: ringWidth }]} />
        </View>
      )}

      {speaking && <Text style={styles.speakingIndicator}>🔊</Text>}

      <TouchableOpacity style={styles.textArea} onPress={handleNext} activeOpacity={0.8}>
        <Animated.Text style={[styles.storyText, { opacity: pageFade }]}>
          {pages[pageIndex]}
        </Animated.Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.nextArea} onPress={handleNext} activeOpacity={0.7}>
        <Text style={styles.nextIcon}>{isLastPage ? '✅' : '👉'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.child.accent,
    opacity: 0.3,
  },
  dotActive: {
    opacity: 1,
    transform: [{ scale: 1.3 }],
  },
  dotDone: {
    opacity: 0.6,
    backgroundColor: Colors.child.secondary,
  },
  autoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoButtonActive: {
    backgroundColor: Colors.child.secondary,
  },
  autoIcon: {
    fontSize: 18,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.child.secondary,
    borderRadius: 3,
  },
  speakingIndicator: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  textArea: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: Spacing.md,
  },
  storyText: {
    fontSize: FontSizes.xxl,
    color: Colors.child.text,
    textAlign: 'center',
    lineHeight: 44,
    fontWeight: '600',
  },
  nextArea: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.child.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  nextIcon: {
    fontSize: 36,
  },
});
