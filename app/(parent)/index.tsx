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
import { useAuth } from '@/hooks/useAuth';
import { useChildProfile } from '@/hooks/useChildProfile';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/themes';

export default function ParentDashboard() {
  const { profile, signOut } = useAuth();
  const { children, selectedChild, addChild, selectChild } = useChildProfile();

  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  async function handleAddChild() {
    if (!childName.trim() || !childBirthDate.trim()) {
      setAddError('Preencha nome e data de nascimento');
      return;
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(childBirthDate.trim())) {
      setAddError('Data deve estar no formato AAAA-MM-DD');
      return;
    }

    setAddError('');
    setAddLoading(true);

    const { error } = await addChild(childName.trim(), childBirthDate.trim());

    if (error) {
      setAddError(error);
      setAddLoading(false);
      return;
    }

    setChildName('');
    setChildBirthDate('');
    setShowAddChild(false);
    setAddLoading(false);
  }

  function getAge(birthDate: string): string {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths < 12) return `${totalMonths} meses`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y} ano${y > 1 ? 's' : ''} e ${m} mes${m > 1 ? 'es' : ''}` : `${y} ano${y > 1 ? 's' : ''}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá, {profile?.fullName?.split(' ')[0] ?? 'Pai'}!
            </Text>
            <Text style={styles.headerSubtitle}>Painel dos pais</Text>
          </View>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Children section */}
        <Text style={styles.sectionTitle}>Crianças</Text>

        {children.length === 0 && !showAddChild ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhuma criança cadastrada ainda.
            </Text>
            <Button
              title="Adicionar criança"
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
                      <Text style={styles.selectedBadgeText}>Ativo</Text>
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
                <Text style={styles.addChildLinkText}>+ Adicionar criança</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Add child form */}
        {showAddChild && (
          <Card style={styles.addChildForm}>
            <Text style={styles.formTitle}>Nova criança</Text>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da criança"
              placeholderTextColor={Colors.parent.textLight}
              value={childName}
              onChangeText={setChildName}
            />

            <Text style={styles.inputLabel}>Data de nascimento</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={Colors.parent.textLight}
              value={childBirthDate}
              onChangeText={setChildBirthDate}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />

            {addError ? <Text style={styles.error}>{addError}</Text> : null}

            <View style={styles.formButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowAddChild(false);
                  setAddError('');
                }}
                variant="outline"
                size="sm"
              />
              <Button
                title="Adicionar"
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
            <Text style={styles.sectionTitle}>Sessão</Text>
            <Button
              title={`Nova sessão para ${selectedChild.name}`}
              onPress={() => router.push('/(parent)/setup-session')}
              variant="secondary"
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
  logoutText: {
    fontSize: FontSizes.sm,
    color: Colors.parent.error,
    fontWeight: '600',
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
});
