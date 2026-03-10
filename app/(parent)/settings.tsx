import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/shared/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();

  const currentLang = i18n.language;

  function changeLanguage(lang: string) {
    i18n.changeLanguage(lang);
  }

  function handleLogout() {
    Alert.alert(
      t('parent.settings.logout'),
      t('parent.settings.logoutConfirm'),
      [
        { text: t('parent.settings.cancel'), style: 'cancel' },
        {
          text: t('parent.settings.logoutConfirmButton'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{t('parent.settings.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('parent.settings.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Language */}
        <Text style={styles.sectionTitle}>{t('parent.settings.language')}</Text>
        <Card style={styles.card}>
          <TouchableOpacity
            style={[styles.langOption, currentLang === 'pt-BR' && styles.langOptionSelected]}
            onPress={() => changeLanguage('pt-BR')}
          >
            <Text style={[styles.langText, currentLang === 'pt-BR' && styles.langTextSelected]}>
              {t('parent.settings.portuguese')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langOption, currentLang === 'en' && styles.langOptionSelected]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={[styles.langText, currentLang === 'en' && styles.langTextSelected]}>
              {t('parent.settings.english')}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Account */}
        <Text style={styles.sectionTitle}>{t('parent.settings.account')}</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('parent.settings.logout')}</Text>
          </TouchableOpacity>
        </Card>

        {/* Version */}
        <Text style={styles.version}>{t('parent.settings.version')} {appVersion}</Text>
      </View>
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
    padding: Spacing.lg,
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
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  langOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parent.border,
  },
  langOptionSelected: {
    backgroundColor: '#FFF5ED',
  },
  langText: {
    fontSize: FontSizes.md,
    color: Colors.parent.text,
  },
  langTextSelected: {
    color: Colors.parent.accent,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  logoutText: {
    fontSize: FontSizes.md,
    color: Colors.parent.error,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: Colors.parent.textLight,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xl,
  },
});
