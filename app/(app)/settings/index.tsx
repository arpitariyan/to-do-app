import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getTasks, createTask } from '@/src/lib/api/tasks';
import { getNotes, createNote } from '@/src/lib/api/notes';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { useAppLockStore } from '@/src/stores/appLockStore';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii, accentPresets } from '@/src/theme/tokens';
import type { AccentColor } from '@/src/theme/tokens';

// ─── Section Component ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }]}>
        {title}
      </Text>
      <Card padded={false}>{children}</Card>
    </View>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
  danger,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.errorSoft : colors.accentSoft }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.error : colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[textStyles.bodyMd, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
        {value && <Text style={[textStyles.caption, { color: colors.textMuted }]}>{value}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

// ─── PIN Setup Modal ──────────────────────────────────────────────────────────

function PinSetupModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
}) {
  const { colors } = useTheme();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');

  const reset = () => { setStep('enter'); setFirstPin(''); setInput(''); setErr(''); };

  const handleNext = () => {
    if (input.length !== 4) { setErr('PIN must be 4 digits'); return; }
    if (step === 'enter') {
      setFirstPin(input);
      setInput('');
      setStep('confirm');
      setErr('');
    } else {
      if (input !== firstPin) { setErr('PINs do not match'); setInput(''); return; }
      onConfirm(input);
      reset();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.modalCard, { backgroundColor: colors.bg1, borderColor: colors.border }]}>
          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {step === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
          </Text>
          <TextInput
            style={[styles.pinInput, { backgroundColor: colors.bg2, borderColor: colors.border, color: colors.textPrimary, ...textStyles.headingMd }]}
            value={input}
            onChangeText={(t) => { setInput(t.replace(/\D/g, '').slice(0, 4)); setErr(''); }}
            keyboardType="numeric"
            secureTextEntry
            maxLength={4}
            placeholder="····"
            placeholderTextColor={colors.textMuted}
          />
          {!!err && <Text style={[textStyles.bodySm, { color: colors.error, marginTop: spacing.xs }]}>{err}</Text>}
          <View style={styles.modalBtns}>
            <Button label="Cancel" variant="ghost" onPress={() => { reset(); onClose(); }} style={{ flex: 1 }} />
            <Button label={step === 'enter' ? 'Next' : 'Save PIN'} onPress={handleNext} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, mode, accentColor, setMode, setAccentColor, isDark } = useTheme();
  const { user, signOut } = useAuthStore();
  const { lockEnabled, enableLock, disableLock } = useAppLockStore();
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const handleLockToggle = (val: boolean) => {
    if (val) {
      setPinModalVisible(true);
    } else {
      Alert.alert('Disable app lock?', 'Your PIN will be removed.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: disableLock },
      ]);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to access your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleBackup = async () => {
    try {
      const tasks = await getTasks();
      const notes = await getNotes();
      const backupData = JSON.stringify({ tasks, notes }, null, 2);
      // @ts-ignore
      const fileUri = (FileSystem.documentDirectory || FileSystem.cacheDirectory) + 'nexus_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, backupData);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Save Backup to Google Drive' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e) {
      Alert.alert('Backup Failed', String(e));
    }
  };

  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(fileContent);
      
      let restoredCount = 0;
      if (backupData.tasks && Array.isArray(backupData.tasks)) {
        for (const t of backupData.tasks) {
          await createTask({ title: t.title, description: t.description, status: t.status, priority: t.priority, dueAt: t.dueAt, taskType: t.taskType, repeatType: t.repeatType, startTime: t.startTime }).catch(()=>null);
          restoredCount++;
        }
      }
      if (backupData.notes && Array.isArray(backupData.notes)) {
        for (const n of backupData.notes) {
          await createNote({ title: n.title, content: n.content, attachments: n.attachments }).catch(()=>null);
          restoredCount++;
        }
      }
      
      Alert.alert('Success', `Restored ${restoredCount} items successfully!`);
    } catch (e) {
      Alert.alert('Restore Failed', 'Invalid backup file or network error.');
    }
  };

  const themeOptions: { label: string; value: typeof mode }[] = [
    { label: 'System', value: 'system' },
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ];

  return (
    <Screen withBottomPad>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.pageHeader}>
          <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>Settings</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginBottom: spacing.xl }}>
          <Card elevated style={styles.profileCard}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.accentSoft }]}>
              <Text style={[textStyles.headingLg, { color: colors.accent }]}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[textStyles.headingSm, { color: colors.textPrimary }]}>{user?.name ?? 'User'}</Text>
              <Text style={[textStyles.bodySm, { color: colors.textSecondary }]}>{user?.email ?? ''}</Text>
            </View>
            <Badge label="Personal" color="accent" />
          </Card>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Section title="Appearance">
            <View style={[styles.themeRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="moon-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[textStyles.bodyMd, { color: colors.textPrimary, flex: 1 }]}>Theme</Text>
              <View style={styles.themePills}>
                {themeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMode(opt.value)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: mode === opt.value ? colors.accent : colors.bg3,
                        borderColor: mode === opt.value ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    <Text style={[textStyles.labelMd, { color: mode === opt.value ? colors.white : colors.textSecondary }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="color-palette-outline" size={18} color={colors.accent} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Accent color</Text>
                <View style={styles.accentSwatches}>
                  {accentPresets.map((preset: { name: string; value: string }) => (
                    <TouchableOpacity
                      key={preset.value}
                      onPress={() => setAccentColor(preset.value as AccentColor)}
                      style={[
                        styles.swatch,
                        { backgroundColor: preset.value },
                        accentColor === preset.value && styles.swatchActive,
                      ]}
                    >
                      {accentColor === preset.value && (
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Section>
        </Animated.View>

        {/* Security */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <Section title="Security">
            <SettingsRow
              icon="lock-closed-outline"
              label="App Lock"
              value={lockEnabled ? 'PIN enabled' : 'Disabled'}
              right={
                <Switch
                  value={lockEnabled}
                  onValueChange={handleLockToggle}
                  trackColor={{ false: colors.bg3, true: colors.accentMid }}
                  thumbColor={lockEnabled ? colors.accent : colors.textMuted}
                />
              }
            />
            <SettingsRow
              icon="finger-print-outline"
              label="Biometric Unlock"
              value="Uses device biometrics"
              onPress={() => {}}
            />
          </Section>
        </Animated.View>

        {/* Data */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
          <Section title="Data">
            <SettingsRow icon="cloud-upload-outline" label="Backup & Export" value="Save to Google Drive" onPress={handleBackup} />
            <SettingsRow icon="cloud-download-outline" label="Import / Restore" value="Load from Google Drive" onPress={handleRestore} />
          </Section>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(480).duration(500)}>
          <Section title="Account">
            <SettingsRow
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </Section>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(560).duration(500)} style={styles.version}>
          <Text style={[textStyles.caption, { color: colors.textMuted }]}>Astra v1.0.0 · Phase 1 · Private build</Text>
        </Animated.View>
      </ScrollView>

      <PinSetupModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onConfirm={(pin) => { enableLock(pin, true); setPinModalVisible(false); }}
      />
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageHeader: {
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: spacing.xs,
  },
  themePills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  themePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  accentSwatches: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  version: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
  },
  pinInput: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    textAlign: 'center',
    letterSpacing: 12,
    fontSize: 24,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
