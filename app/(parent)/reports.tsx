import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChildProfile } from '@/hooks/useChildProfile';
import { useReports } from '@/hooks/useReports';
import { Card } from '@/components/shared/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import type { DevelopmentReport } from '@/types';

const SKILL_COLORS = [
  Colors.child.primary,
  Colors.child.secondary,
  Colors.child.purple,
  Colors.child.blue,
  Colors.child.green,
  Colors.child.orange,
];

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { selectedChild } = useChildProfile();
  const { reports, isLoading, isGenerating, fetchReports } = useReports();

  useEffect(() => {
    if (selectedChild) {
      fetchReports(selectedChild.id);
    }
  }, [selectedChild]);

  function formatDate(iso: string): string {
    const date = new Date(iso);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  function getEngagementLabel(level: string): string {
    switch (level) {
      case 'alto':
      case 'high':
        return t('parent.reports.engagementHigh');
      case 'medio':
      case 'medium':
        return t('parent.reports.engagementMedium');
      case 'baixo':
      case 'low':
        return t('parent.reports.engagementLow');
      default:
        return level;
    }
  }

  function getEngagementColor(level: string): string {
    switch (level) {
      case 'alto':
      case 'high':
        return Colors.parent.success;
      case 'medio':
      case 'medium':
        return Colors.parent.accent;
      case 'baixo':
      case 'low':
        return Colors.parent.error;
      default:
        return Colors.parent.textSecondary;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{t('parent.reports.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('parent.reports.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* No child selected */}
        {!selectedChild && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('parent.reports.selectChild')}</Text>
          </Card>
        )}

        {/* Loading */}
        {selectedChild && isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.parent.accent} />
          </View>
        )}

        {/* Generating indicator */}
        {selectedChild && !isLoading && isGenerating && (
          <Card style={styles.emptyCard}>
            <ActivityIndicator size="small" color={Colors.parent.accent} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.emptyTitle}>{t('parent.reports.generating')}</Text>
            <Text style={styles.emptyHint}>{t('parent.reports.generatingHint')}</Text>
          </Card>
        )}

        {/* Empty state */}
        {selectedChild && !isLoading && !isGenerating && reports.length === 0 && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>{t('parent.reports.noReports')}</Text>
            <Text style={styles.emptyHint}>{t('parent.reports.noReportsHint')}</Text>
          </Card>
        )}

        {/* Report cards */}
        {selectedChild && !isLoading && reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            formatDate={formatDate}
            getEngagementLabel={getEngagementLabel}
            getEngagementColor={getEngagementColor}
            t={t}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ReportCardProps {
  report: DevelopmentReport;
  formatDate: (iso: string) => string;
  getEngagementLabel: (level: string) => string;
  getEngagementColor: (level: string) => string;
  t: (key: string) => string;
}

function ReportCard({ report, formatDate, getEngagementLabel, getEngagementColor, t }: ReportCardProps) {
  const highlights = report.highlights as {
    best_activity?: string;
    engagement_level?: string;
    recommendation?: string;
  };

  return (
    <Card style={styles.reportCard}>
      {/* Date */}
      <Text style={styles.reportDate}>{formatDate(report.createdAt)}</Text>

      {/* Summary */}
      <Text style={styles.reportSummary}>{report.summary}</Text>

      {/* Skills */}
      {report.skillsPracticed.length > 0 && (
        <View style={styles.skillsSection}>
          <Text style={styles.sectionLabel}>{t('parent.reports.skills')}</Text>
          <View style={styles.skillsRow}>
            {report.skillsPracticed.map((skill, i) => (
              <View
                key={i}
                style={[
                  styles.skillTag,
                  { backgroundColor: SKILL_COLORS[i % SKILL_COLORS.length] },
                ]}
              >
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Highlights */}
      {highlights && (
        <View style={styles.highlightsSection}>
          {highlights.best_activity && (
            <View style={styles.highlightRow}>
              <Text style={styles.highlightIcon}>⭐</Text>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>{t('parent.reports.bestActivity')}</Text>
                <Text style={styles.highlightValue}>{highlights.best_activity}</Text>
              </View>
            </View>
          )}

          {highlights.engagement_level && (
            <View style={styles.highlightRow}>
              <Text style={styles.highlightIcon}>📈</Text>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>{t('parent.reports.engagement')}</Text>
                <Text
                  style={[
                    styles.highlightValue,
                    { color: getEngagementColor(highlights.engagement_level) },
                  ]}
                >
                  {getEngagementLabel(highlights.engagement_level)}
                </Text>
              </View>
            </View>
          )}

          {highlights.recommendation && (
            <View style={styles.highlightRow}>
              <Text style={styles.highlightIcon}>💡</Text>
              <View style={styles.highlightContent}>
                <Text style={styles.highlightLabel}>{t('parent.reports.recommendation')}</Text>
                <Text style={styles.highlightValue}>{highlights.recommendation}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
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
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.parent.text,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.parent.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textLight,
    textAlign: 'center',
  },
  // Report card
  reportCard: {
    marginBottom: Spacing.md,
  },
  reportDate: {
    fontSize: FontSizes.xs,
    color: Colors.parent.textLight,
    marginBottom: Spacing.sm,
  },
  reportSummary: {
    fontSize: FontSizes.md,
    color: Colors.parent.text,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  // Skills
  skillsSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.parent.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  skillTag: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  skillTagText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Highlights
  highlightsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.parent.border,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  highlightIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  highlightContent: {
    flex: 1,
  },
  highlightLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.parent.textSecondary,
    marginBottom: 2,
  },
  highlightValue: {
    fontSize: FontSizes.sm,
    color: Colors.parent.text,
    lineHeight: 20,
  },
});
