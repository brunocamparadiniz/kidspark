import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Colors, Spacing, FontSizes } from '@/constants/themes';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError(t('auth.register.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.register.passwordTooShort'));
      return;
    }

    setError('');
    setLoading(true);

    const { error: authError } = await signUp(email.trim(), password, fullName.trim());

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace('/(parent)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.register.fullName')}
            placeholder={t('auth.register.fullNamePlaceholder')}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Input
            label={t('auth.register.email')}
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label={t('auth.register.password')}
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title={t('auth.register.button')}
            onPress={handleSignUp}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.register.hasAccount')}</Text>
            <Link href="/(auth)/login" style={styles.link}>
              {t('auth.register.signIn')}
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.parent.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.title,
    fontWeight: 'bold',
    color: Colors.parent.primary,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    color: Colors.parent.textSecondary,
    marginTop: Spacing.sm,
  },
  form: {
    width: '100%',
  },
  error: {
    color: Colors.parent.error,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  button: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Colors.parent.textSecondary,
  },
  link: {
    fontSize: FontSizes.sm,
    color: Colors.parent.accent,
    fontWeight: '600',
  },
});
