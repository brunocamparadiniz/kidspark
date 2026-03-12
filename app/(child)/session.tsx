import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/hooks/useSession';
import { useChildProfile } from '@/hooks/useChildProfile';
import { ACTIVITY_TYPES } from '@/constants/activity-types';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import { StoryActivity } from '@/components/child/StoryActivity';
import { SongActivity } from '@/components/child/SongActivity';
import { QuestionActivity } from '@/components/child/QuestionActivity';
import { DrawingActivity } from '@/components/child/DrawingActivity';
import { speak, stop } from '@/lib/speech';
import { lightImpact, successNotification } from '@/lib/haptics';
import type { Activity, ActivityType } from '@/types';

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  story: Colors.child.purple,
  song: Colors.child.blue,
  minigame: Colors.child.green,
  question: Colors.child.orange,
  drawing: Colors.child.primary,
};

export default function SessionScreen() {
  const { t } = useTranslation();
  const { currentSession, completeActivity, completeSession } = useSession();
  const { selectedChild } = useChildProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const celebrationScale = useRef(new Animated.Value(0)).current;

  const activities = currentSession?.activities ?? [];
  const sorted = [...activities].sort((a, b) => a.orderIndex - b.orderIndex);
  const current = sorted[currentIndex];
  const total = sorted.length;

  // Session greeting
  useEffect(() => {
    if (total === 0) {
      setGreetingDone(true);
      return;
    }
    const childName = selectedChild?.name ?? '';
    const greeting = t('child.session.greeting', { name: childName });
    speak(greeting, () => setGreetingDone(true));

    return () => stop();
  }, []);

  // Celebration animation
  useEffect(() => {
    if (finished) {
      successNotification();
      const celebText = t('child.session.allDone');
      speak(celebText);
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [finished, celebrationScale]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  if (!currentSession || total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>😕</Text>
        <Text style={styles.emptyText}>{t('child.session.noActivities')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(parent)')}>
          <Text style={styles.backButtonText}>{t('child.session.backToParent')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleActivityComplete() {
    if (!current) return;

    lightImpact();
    stop();
    await completeActivity(current.id);

    if (currentIndex >= total - 1) {
      await completeSession();
      setFinished(true);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex((i) => i + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }

  if (finished) {
    return (
      <View style={styles.celebrationContainer}>
        <Animated.View style={{ transform: [{ scale: celebrationScale }] }}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
        </Animated.View>
        <Text style={styles.celebrationTitle}>{t('child.session.allDone')}</Text>
        <Text style={styles.celebrationSubtitle}>{t('child.session.greatJob')}</Text>

        <View style={styles.starsRow}>
          {sorted.map((_, i) => (
            <Text key={i} style={styles.star}>⭐</Text>
          ))}
        </View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={() => { stop(); router.replace('/(parent)'); }}
          activeOpacity={0.7}
        >
          <Text style={styles.finishButtonIcon}>🏠</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Greeting screen
  if (!greetingDone) {
    const childName = selectedChild?.name ?? '';
    return (
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingEmoji}>👋</Text>
        <Text style={styles.greetingText}>
          {t('child.session.greeting', { name: childName })}
        </Text>
        <Text style={styles.speakingIndicator}>🔊</Text>
      </View>
    );
  }

  const activityConfig = ACTIVITY_TYPES[current.type];
  const bgColor = ACTIVITY_COLORS[current.type];

  return (
    <View style={[styles.container, { backgroundColor: Colors.child.background }]}>
      <View style={styles.progressRow}>
        {sorted.map((act, i) => (
          <View
            key={act.id}
            style={[
              styles.progressDot,
              { backgroundColor: i < currentIndex ? Colors.child.secondary : i === currentIndex ? bgColor : '#E0E0E0' },
            ]}
          >
            <Text style={styles.progressDotText}>
              {i < currentIndex ? '⭐' : i === currentIndex ? activityConfig?.icon ?? '▶' : '○'}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.titleBar, { backgroundColor: bgColor }]}>
        <Text style={styles.titleIcon}>{activityConfig?.icon ?? '🎯'}</Text>
        <Text style={styles.titleText}>{current.title}</Text>
      </View>

      <Animated.View style={[styles.activityArea, { opacity: fadeAnim }]}>
        {renderActivity(current, handleActivityComplete)}
      </Animated.View>
    </View>
  );
}

function renderActivity(activity: Activity, onComplete: () => void) {
  const content = activity.content as Record<string, unknown>;
  const title = activity.title;

  switch (activity.type) {
    case 'story':
      return <StoryActivity content={content} onComplete={onComplete} activityTitle={title} />;
    case 'song':
      return <SongActivity content={content} onComplete={onComplete} activityTitle={title} />;
    case 'question':
      return <QuestionActivity content={content} onComplete={onComplete} activityTitle={title} />;
    case 'drawing':
      return <DrawingActivity content={content} onComplete={onComplete} activityTitle={title} />;
    case 'minigame':
      return (
        <QuestionActivity
          content={{
            question: (content.instructions as string) ?? (content.question as string) ?? '',
            hint: (content.hint as string) ?? '',
            elements: content.elements as string[] | undefined,
            options: content.options as string[] | undefined,
            answer: content.answer as string | undefined,
          }}
          onComplete={onComplete}
          activityTitle={title}
        />
      );
    default:
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24 }}>🎯</Text>
          <TouchableOpacity
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.child.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}
            onPress={onComplete}
          >
            <Text style={{ fontSize: 36 }}>✅</Text>
          </TouchableOpacity>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotText: {
    fontSize: 18,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  titleIcon: {
    fontSize: 28,
  },
  titleText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  activityArea: {
    flex: 1,
    paddingBottom: Spacing.xxl,
  },
  // Greeting
  greetingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.child.background,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  greetingEmoji: {
    fontSize: 80,
  },
  greetingText: {
    fontSize: FontSizes.title,
    fontWeight: '800',
    color: Colors.child.primary,
    textAlign: 'center',
  },
  speakingIndicator: {
    fontSize: 32,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.child.background,
    padding: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.xl,
    color: Colors.child.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  backButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.child.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backButtonText: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Celebration
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.child.background,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 96,
  },
  celebrationTitle: {
    fontSize: FontSizes.title,
    fontWeight: '800',
    color: Colors.child.primary,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '600',
    color: Colors.child.text,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  star: {
    fontSize: 36,
  },
  finishButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.child.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  finishButtonIcon: {
    fontSize: 48,
  },
});
