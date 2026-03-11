import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useChildProfile } from '@/hooks/useChildProfile';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const { children, selectedChild, addChild, selectChild } = useChildProfile();

  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  function buildIsoDate(): string | null {
    const d = parseInt(birthDay, 10);
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);

    if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) {
      return null;
    }

    const date = new Date(y, m - 1, d);
    if (date.getDate() !== d || date.getMonth() !== m - 1 || date.getFullYear() !== y) {
      return null;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  async function handleAddChild() {
    if (!childName.trim()) {
      setAddError(t('parent.addChild.fillFields'));
      return;
    }

    const isoDate = buildIsoDate();
    if (!isoDate) {
      setAddError(t('parent.addChild.invalidDate'));
      return;
    }

    setAddError('');
    setAddLoading(true);

    const { error } = await addChild(childName.trim(), isoDate);

    if (error) {
      setAddError(error);
      setAddLoading(false);
      return;
    }

    setChildName('');
    setBirthDay('');
    setBirthMonth('');
    setBirthYear('');
    setShowAddChild(false);
    setAddLoading(false);
  }

  function getAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths < 12) return t('parent.dashboard.ageMonths', { months: totalMonths });
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    if (m > 0) return t('parent.dashboard.ageYearsAndMonths', { years: y, months: m });
    return y > 1
      ? t('parent.dashboard.ageYearsPlural', { years: y })
      : t('parent.dashboard.ageYears', { years: y });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('parent.dashboard.greeting', { name: profile?.fullName?.split(' ')[0] ?? 'Pai' })}
            </Text>
            <Text style={styles.headerSubtitle}>{t('parent.dashboard.subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(parent)/settings')}>
            <Text style={styles.settingsText}>&#9881;</Text>
          </TouchableOpacity>
        </View>

        {/* Children section */}
        <Text style={styles.sectionTitle}>{t('parent.dashboard.children')}</Text>

        {children.length === 0 && !showAddChild ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('parent.dashboard.noChildren')}
            </Text>
            <Button
              title={t('parent.dashboard.addChild')}
              onPress={() => setShowAddChild(true)}
              variant="secondary"
              size="sm"
              style={styles.addButton}
            />
          </Card>
        ) : (
          <>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => selectChild(child)}
              >
                <Card
                  style={StyleSheet.flatten([
                    styles.childCard,
                    selectedChild?.id === child.id ? styles.childCardSelected : undefined,
                  ])}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>
                      {child.name[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childAge}>{getAge(child.birthDate)}</Text>
                  </View>
                  {selectedChild?.id === child.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>{t('parent.dashboard.active')}</Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}

            {!showAddChild && (
              <TouchableOpacity
                style={styles.addChildLink}
                onPress={() => setShowAddChild(true)}
              >
                <Text style={styles.addChildLinkText}>{t('parent.dashboard.addChildLink')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Add child form */}
        {showAddChild && (
          <Card style={styles.addChildForm}>
            <Text style={styles.formTitle}>{t('parent.addChild.title')}</Text>

            <Text style={styles.inputLabel}>{t('parent.addChild.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('parent.addChild.namePlaceholder')}
              placeholderTextColor={Colors.parent.textLight}
              value={childName}
              onChangeText={setChildName}
            />

            <Text style={styles.inputLabel}>{t('parent.addChild.birthDate')}</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="DD"
                placeholderTextColor={Colors.parent.textLight}
                value={birthDay}
                onChangeText={(text) => setBirthDay(text.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="MM"
                placeholderTextColor={Colors.parent.textLight}
                value={birthMonth}
                onChangeText={(text) => setBirthMonth(text.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={[styles.input, styles.dateInputYear]}
                placeholder="AAAA"
                placeholderTextColor={Colors.parent.textLight}
                value={birthYear}
                onChangeText={(text) => setBirthYear(text.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            {addError ? <Text style={styles.error}>{addError}</Text> : null}

            <View style={styles.formButtons}>
              <Button
                title={t('parent.addChild.cancel')}
                onPress={() => {
                  setShowAddChild(false);
                  setAddError('');
                }}
                variant="outline"
                size="sm"
              />
              <Button
                title={t('parent.addChild.add')}
                onPress={handleAddChild}
                loading={addLoading}
                size="sm"
              />
            </View>
          </Card>
        )}

        {/* New session button */}
        {selectedChild && (
          <View style={styles.sessionSection}>
            <Text style={styles.sectionTitle}>{t('parent.dashboard.session')}</Text>
            <Button
              title={t('parent.dashboard.newSession', { name: selectedChild.name })}
              onPress={() => router.push('/(parent)/setup-session')}
              variant="secondary"
              size="lg"
            />
          </View>
        )}

        {/* Reports button */}
        {selectedChild && (
          <View style={styles.reportsSection}>
            <Text style={styles.sectionTitle}>{t('parent.dashboard.reports')}</Text>
            <Button
              title={t('parent.dashboard.viewReports', { name: selectedChild.name })}
              onPress={() => router.push('/(parent)/reports')}
              variant="outline"
              size="lg"
            />
          </View>
        )}
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
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.parent.primary,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textSecondary,
    marginTop: 2,
  },
  settingsText: {
    fontSize: FontSizes.xl,
    color: Colors.parent.textSecondary,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.parent.primary,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.parent.textSecondary,
    marginBottom: Spacing.md,
  },
  addButton: {
    minWidth: 180,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  childCardSelected: {
    borderWidth: 2,
    borderColor: Colors.parent.accent,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.parent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  childAvatarText: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.parent.white,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.parent.text,
  },
  childAge: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textSecondary,
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: Colors.parent.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  selectedBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.parent.white,
  },
  addChildLink: {
    paddingVertical: Spacing.sm,
  },
  addChildLinkText: {
    fontSize: FontSizes.sm,
    color: Colors.parent.accent,
    fontWeight: '600',
  },
  addChildForm: {
    marginTop: Spacing.md,
  },
  formTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.parent.primary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.parent.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.parent.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.parent.text,
    backgroundColor: Colors.parent.white,
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    textAlign: 'center',
    marginBottom: 0,
  },
  dateInputYear: {
    flex: 1.5,
    textAlign: 'center',
    marginBottom: 0,
  },
  dateSeparator: {
    fontSize: FontSizes.lg,
    color: Colors.parent.textSecondary,
    marginHorizontal: Spacing.xs,
  },
  error: {
    color: Colors.parent.error,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  sessionSection: {
    marginTop: Spacing.xl,
  },
  reportsSection: {
    marginTop: Spacing.lg,
  },
});
