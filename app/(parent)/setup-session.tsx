import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildProfile } from '@/hooks/useChildProfile';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import { DURATION_OPTIONS, MOOD_OPTIONS, GOAL_OPTIONS } from '@/constants/activity-types';
import type { Mood, Goal } from '@/types';

export default function SetupSessionScreen() {
  const { t } = useTranslation();
  const { children, selectedChild, selectChild } = useChildProfile();
  const { createSession, isLoading } = useSession();

  const [duration, setDuration] = useState<15 | 30 | 45 | 60>(30);
  const [mood, setMood] = useState<Mood>('calm');
  const [goals, setGoals] = useState<Goal[]>([]);

  function toggleGoal(goal: Goal) {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  }

  async function handleStart() {
    if (!selectedChild) {
      Alert.alert(t('parent.setupSession.selectChild'));
      return;
    }

    if (goals.length === 0) {
      Alert.alert(t('parent.setupSession.selectGoal'));
      return;
    }

    const { error } = await createSession({
      childId: selectedChild.id,
      durationMinutes: duration,
      mood,
      goals,
    });

    if (error) {
      Alert.alert(t('parent.setupSession.error'), error);
      return;
    }

    router.replace('/(child)/session');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{t('parent.setupSession.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('parent.setupSession.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Child selector */}
        <Text style={styles.sectionTitle}>{t('parent.setupSession.child')}</Text>
        <View style={styles.optionRow}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              onPress={() => selectChild(child)}
              style={[
                styles.optionPill,
                selectedChild?.id === child.id && styles.optionPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionPillText,
                  selectedChild?.id === child.id && styles.optionPillTextSelected,
                ]}
              >
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.sectionTitle}>{t('parent.setupSession.duration')}</Text>
        <View style={styles.optionRow}>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setDuration(opt.value)}
              style={[
                styles.optionPill,
                duration === opt.value && styles.optionPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionPillText,
                  duration === opt.value && styles.optionPillTextSelected,
                ]}
              >
                {t(`durations.${opt.value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mood */}
        <Text style={styles.sectionTitle}>{t('parent.setupSession.mood')}</Text>
        <View style={styles.optionRow}>
          {MOOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setMood(opt.value)}
              style={[
                styles.moodCard,
                mood === opt.value && styles.moodCardSelected,
              ]}
            >
              <Text style={styles.moodIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  mood === opt.value && styles.moodLabelSelected,
                ]}
              >
                {t(`moods.${opt.value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Goals */}
        <Text style={styles.sectionTitle}>{t('parent.setupSession.goals')}</Text>
        <Text style={styles.sectionHint}>{t('parent.setupSession.goalsHint')}</Text>
        <View style={styles.goalsGrid}>
          {GOAL_OPTIONS.map((opt) => {
            const isSelected = goals.includes(opt.value as Goal);
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => toggleGoal(opt.value as Goal)}
                style={[
                  styles.goalChip,
                  isSelected && styles.goalChipSelected,
                ]}
              >
                <Text style={styles.goalIcon}>{opt.icon}</Text>
                <Text
                  style={[
                    styles.goalLabel,
                    isSelected && styles.goalLabelSelected,
                  ]}
                >
                  {t(`goals.${opt.value}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        {selectedChild && goals.length > 0 && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t('parent.setupSession.summary')}</Text>
            <Text style={styles.summaryText}>
              {selectedChild.name} - {t(`durations.${duration}`)} - {t(`moods.${mood}`)}
            </Text>
            <Text style={styles.summaryText}>
              {t('parent.setupSession.goals')}: {goals.map((g) => t(`goals.${g}`)).join(', ')}
            </Text>
          </Card>
        )}

        {/* Start button */}
        <Button
          title={t('parent.setupSession.start')}
          onPress={handleStart}
          loading={isLoading}
          variant="secondary"
          size="lg"
          disabled={!selectedChild || goals.length === 0}
          style={styles.startButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.parent.surface,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  backText: {
    fontSize: FontSizes.md,
    color: Colors.parent.accent,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.parent.primary,
  },
  headerSpacer: {
    width: 50,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.parent.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionHint: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textSecondary,
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.parent.border,
    backgroundColor: Colors.parent.white,
  },
  optionPillSelected: {
    borderColor: Colors.parent.accent,
    backgroundColor: Colors.parent.accent,
  },
  optionPillText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.parent.text,
  },
  optionPillTextSelected: {
    color: Colors.parent.white,
  },
  moodCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.parent.border,
    backgroundColor: Colors.parent.white,
  },
  moodCardSelected: {
    borderColor: Colors.parent.accent,
    backgroundColor: '#FFF5ED',
  },
  moodIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.parent.text,
  },
  moodLabelSelected: {
    color: Colors.parent.accent,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.parent.border,
    backgroundColor: Colors.parent.white,
    gap: Spacing.xs,
  },
  goalChipSelected: {
    borderColor: Colors.parent.primary,
    backgroundColor: Colors.parent.primary,
  },
  goalIcon: {
    fontSize: 16,
  },
  goalLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.parent.text,
  },
  goalLabelSelected: {
    color: Colors.parent.white,
  },
  summaryCard: {
    marginTop: Spacing.xl,
    backgroundColor: '#FFF5ED',
  },
  summaryTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.parent.primary,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textSecondary,
    lineHeight: 20,
  },
  startButton: {
    marginTop: Spacing.xl,
  },
});
