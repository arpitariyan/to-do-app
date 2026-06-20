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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import ColorPicker, { Panel1, Swatches, Preview, HueSlider } from 'reanimated-color-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { getTasks, createTask } from '@/src/lib/api/tasks';
import { getNotes, createNote } from '@/src/lib/api/notes';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { useAppLockStore } from '@/src/stores/appLockStore';
import { Screen } from '@/src/components/layout/Screen';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii, accentPresets } from '@/src/theme/tokens';
import type { AccentColor } from '@/src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// ─── Custom UI Components ─────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.md }}>
      <Text style={[
        textStyles.labelSm,
        { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.xs }
      ]}>
        {title}
      </Text>
      <GlassCard intensity={30} style={[styles.sectionCard, { borderColor: colors.glassBorder }]}>
        {children}
      </GlassCard>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  right,
  danger,
  isLast,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.glassBorder }
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.errorSoft : colors.accentSoft }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[textStyles.bodyMd, { color: danger ? colors.error : colors.textPrimary, fontWeight: '500' }]}>{label}</Text>
        {value && <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: 2 }]}>{value}</Text>}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
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
  const insets = useSafeAreaInsets();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay} experimentalBlurMethod="dimezisBlurView">
          <GlassCard intensity={40} style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 24), borderColor: colors.glassBorder }]}>
            <View style={[styles.bsHandle, { backgroundColor: colors.glassBorder }]} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="lock-closed" size={24} color={colors.accent} />
              </View>
              <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginTop: 16 }]}>
                {step === 'enter' ? 'Set App PIN' : 'Confirm PIN'}
              </Text>
              <Text style={[textStyles.bodySm, { color: colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                {step === 'enter' ? 'Create a 4-digit PIN to secure your data.' : 'Please enter the PIN again to verify.'}
              </Text>
            </View>

            <TextInput
              style={[
                styles.pinInput,
                { backgroundColor: colors.bg2, color: colors.textPrimary, borderColor: err ? colors.error : colors.border }
              ]}
              value={input}
              onChangeText={(t) => { setInput(t.replace(/\D/g, '').slice(0, 4)); setErr(''); }}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="····"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            {!!err && <Text style={[textStyles.bodySm, { color: colors.error, textAlign: 'center', marginTop: 8 }]}>{err}</Text>}

            <View style={styles.modalBtns}>
              <Button label="Cancel" variant="ghost" onPress={() => { reset(); onClose(); }} style={{ flex: 1 }} />
              <Button label={step === 'enter' ? 'Next' : 'Confirm'} onPress={handleNext} style={{ flex: 1 }} />
            </View>
          </GlassCard>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { colors, mode, accentColor, setMode, setAccentColor } = useTheme();
  const { user, signOut } = useAuthStore();
  const { lockEnabled, biometricEnabled, enableLock, disableLock, toggleBiometrics } = useAppLockStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [showDisableLockSheet, setShowDisableLockSheet] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);

  // Custom Color Picker State
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customHex, setCustomHex] = useState(accentColor);

  const handleLockToggle = (val: boolean) => {
    if (val) {
      setPinModalVisible(true);
    } else {
      setShowDisableLockSheet(true);
    }
  };

  const handleBiometricToggle = async (val: boolean) => {
    if (!lockEnabled) return; // Need lock enabled first

    if (val) {
      // Trying to enable biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Not Available', 'Biometrics are not set up or not available on this device.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable Biometric Unlock',
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        toggleBiometrics(true);
      }
    } else {
      // Disable biometrics
      toggleBiometrics(false);
    }
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
          await createTask({ title: t.title, description: t.description, status: t.status, priority: t.priority, dueAt: t.dueAt, taskType: t.taskType, repeatType: t.repeatType, startTime: t.startTime }).catch(() => null);
          restoredCount++;
        }
      }
      if (backupData.notes && Array.isArray(backupData.notes)) {
        for (const n of backupData.notes) {
          await createNote({ title: n.title, content: n.content, attachments: n.attachments }).catch(() => null);
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

  const handleApplyCustomColor = () => {
    // Basic hex validation
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (hexRegex.test(customHex)) {
      setAccentColor(customHex);
      setShowColorPicker(false);
    } else {
      Alert.alert('Invalid Color', 'Please enter a valid hex color code (e.g., #FF5555)');
    }
  };

  const isCustomColorActive = !accentPresets.some(p => p.value === accentColor);

  return (
    <Screen withBottomPad>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.pageHeader}>
          <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>Settings</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.md }}>
          <View style={[styles.profileCard, { backgroundColor: colors.bg1, borderColor: colors.borderLight }]}>
            <View style={[styles.profileAvatar, { backgroundColor: colors.accent }]}>
              <Text style={[textStyles.headingLg, { color: '#FFFFFF', fontWeight: '800' }]}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>{user?.name ?? 'User'}</Text>
              <Text style={[textStyles.bodySm, { color: colors.textSecondary }]}>{user?.email ?? ''}</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                <Badge label="Personal Account" color="accent" />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Appearance */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Section title="Appearance">
            <View style={[styles.themeRow, { borderBottomColor: colors.glassBorder }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="moon" size={20} color={colors.accent} />
              </View>
              <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '500' }]}>Theme</Text>
              <View style={styles.themePills}>
                {themeOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setMode(opt.value)}
                    style={[
                      styles.themePill,
                      {
                        backgroundColor: mode === opt.value ? colors.accent : colors.bg2,
                        borderColor: mode === opt.value ? colors.accent : colors.borderLight,
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

            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="color-palette" size={20} color={colors.accent} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '500' }]}>Accent Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accentSwatches}>
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
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                  {/* Custom Color Swatch */}
                  <TouchableOpacity
                    onPress={() => setShowColorPicker(true)}
                    style={[
                      styles.swatch,
                      { backgroundColor: isCustomColorActive ? accentColor : colors.bg3, borderWidth: 1, borderColor: isCustomColorActive ? accentColor : colors.border },
                      isCustomColorActive && styles.swatchActive,
                    ]}
                  >
                    {isCustomColorActive ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : (
                      <Ionicons name="add" size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Section>
        </Animated.View>

        {/* Security */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)}>
          <Section title="Security">
            <SettingsRow
              icon="lock-closed"
              label="App Lock"
              value={lockEnabled ? 'PIN is active' : 'Disabled'}
              right={
                <Switch
                  value={lockEnabled}
                  onValueChange={handleLockToggle}
                  trackColor={{ false: colors.bg3, true: colors.accentMid }}
                  thumbColor={lockEnabled ? colors.accent : colors.textMuted}
                />
              }
            />
            {lockEnabled && (
              <SettingsRow
                icon="finger-print"
                label="Biometric Unlock"
                value="Use Face ID or Fingerprint"
                isLast
                right={
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.bg3, true: colors.accentMid }}
                    thumbColor={biometricEnabled ? colors.accent : colors.textMuted}
                  />
                }
              />
            )}
          </Section>
        </Animated.View>

        {/* Data */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)}>
          <Section title="Data Management">
            <SettingsRow icon="cloud-upload" label="Backup & Export" value="Save tasks & notes" onPress={handleBackup} />
            <SettingsRow icon="cloud-download" label="Import / Restore" value="Load from backup" onPress={handleRestore} isLast />
          </Section>
        </Animated.View>

        {/* About */}
        <Animated.View entering={FadeInDown.delay(360).duration(500)}>
          <Section title="About">
            <SettingsRow icon="document-text" label="Privacy Policy" onPress={() => router.push('/settings/privacy')} />
            <SettingsRow icon="document" label="Terms & Conditions" onPress={() => router.push('/settings/terms')} />
            <SettingsRow icon="help-buoy" label="Help & Support" onPress={() => setShowSupportSheet(true)} isLast />
          </Section>
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Section title="Account">
            <SettingsRow
              icon="log-out"
              label="Sign Out"
              onPress={() => setShowSignOutSheet(true)}
              danger
              isLast
            />
          </Section>
        </Animated.View>

        {/* Version */}
        <Animated.View entering={FadeInDown.delay(480).duration(500)} style={styles.version}>
          <Ionicons name="planet" size={24} color={colors.accentSoft} style={{ marginBottom: 8 }} />
          <Text style={[textStyles.labelMd, { color: colors.textMuted }]}>Astra v1.2.0</Text>
          <Text style={[textStyles.caption, { color: colors.textDisabled }]}>Premium Phase 1</Text>
        </Animated.View>
      </ScrollView>

      {/* ── Modals & Bottom Sheets ── */}

      <PinSetupModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onConfirm={(pin) => { enableLock(pin, biometricEnabled); setPinModalVisible(false); }}
      />

      {/* Sign Out Bottom Sheet */}
      <Modal visible={showSignOutSheet} animationType="slide" transparent onRequestClose={() => setShowSignOutSheet(false)}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSignOutSheet(false)}>
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <GlassCard intensity={60} style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24), borderColor: colors.glassBorder }]}>
                <View style={[styles.bsHandle, { backgroundColor: colors.glassBorder }]} />
                <View style={[styles.modalIconWrap, { backgroundColor: colors.errorSoft, marginBottom: 16 }]}>
                  <Ionicons name="log-out" size={28} color={colors.error} />
                </View>
                <Text style={[textStyles.headingLg, { color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }]}>Sign Out?</Text>
                <Text style={[textStyles.bodyMd, { color: colors.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 }]}>
                  You will need to sign in again to access your tasks, notes, and AI conversations.
                </Text>
                <View style={styles.sheetActions}>
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.glassSoft, borderWidth: 1, borderColor: colors.glassBorder }]} onPress={() => setShowSignOutSheet(false)}>
                    <Text style={[textStyles.labelLg, { color: colors.textPrimary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.error }]} onPress={() => { setShowSignOutSheet(false); signOut(); }}>
                    <Text style={[textStyles.labelLg, { color: '#fff' }]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {/* Disable Lock Bottom Sheet */}
      <Modal visible={showDisableLockSheet} animationType="slide" transparent onRequestClose={() => setShowDisableLockSheet(false)}>
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay} experimentalBlurMethod="dimezisBlurView">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowDisableLockSheet(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <GlassCard intensity={60} style={[styles.bottomSheet, { width: '100%', paddingBottom: Math.max(insets.bottom, 24), borderColor: colors.glassBorder }]}>
              <View style={[styles.bsHandle, { backgroundColor: colors.glassBorder }]} />
              
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconWrap, { backgroundColor: colors.errorSoft }]}>
                  <Ionicons name="lock-open" size={26} color={colors.error} />
                </View>
                <Text style={[textStyles.headingLg, { color: colors.textPrimary, marginTop: 16 }]}>
                  Disable App Lock?
                </Text>
                <Text style={[textStyles.bodySm, { color: colors.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }]}>
                  This will remove your PIN and disable biometric unlock.
                </Text>
              </View>

              <View style={styles.modalBtns}>
                <Button label="Cancel" variant="ghost" onPress={() => setShowDisableLockSheet(false)} style={{ flex: 1 }} />
                <Button label="Disable" onPress={() => { setShowDisableLockSheet(false); disableLock(); }} style={{ flex: 1, backgroundColor: colors.error }} />
              </View>
            </GlassCard>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* Help & Support Bottom Sheet */}
      <Modal visible={showSupportSheet} animationType="slide" transparent onRequestClose={() => setShowSupportSheet(false)}>
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay} experimentalBlurMethod="dimezisBlurView">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSupportSheet(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <GlassCard intensity={60} style={[styles.bottomSheet, { width: '100%', paddingBottom: Math.max(insets.bottom, 24), borderColor: colors.glassBorder }]}>
              <View style={[styles.bsHandle, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="help-buoy" size={26} color={colors.accent} />
                </View>
                <Text style={[textStyles.headingLg, { color: colors.textPrimary, marginTop: 16 }]}>
                  Help & Support
                </Text>
                <Text style={[textStyles.bodyMd, { color: colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }]}>
                  Need assistance or have feedback? Reach out to our primary developer and support contact:
                </Text>
                
                <View style={{ backgroundColor: colors.bg2, borderRadius: radii.xl, padding: spacing.lg, width: '100%', marginTop: spacing.lg, borderWidth: 1, borderColor: colors.borderLight }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={20} color={colors.accent} />
                    </View>
                    <View>
                      <Text style={[textStyles.labelSm, { color: colors.textMuted }]}>Developer</Text>
                      <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '600' }]}>Arpit Ariyan Maharana</Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="mail" size={20} color={colors.accent} />
                    </View>
                    <View>
                      <Text style={[textStyles.labelSm, { color: colors.textMuted }]}>Contact Email</Text>
                      <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '500' }]}>arpitariyanm@zohomail.in</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.modalBtns}>
                <Button label="Close" onPress={() => setShowSupportSheet(false)} style={{ flex: 1 }} />
              </View>
            </GlassCard>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>

      {/* Custom Color Picker Bottom Sheet */}
      <Modal visible={showColorPicker} animationType="slide" transparent onRequestClose={() => setShowColorPicker(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView">
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowColorPicker(false)}>
                <GlassCard intensity={60} style={[styles.bottomSheet, { width: '100%', paddingBottom: Math.max(insets.bottom, 24), borderColor: colors.glassBorder }]} onStartShouldSetResponder={() => true}>
                  <View style={[styles.bsHandle, { backgroundColor: colors.glassBorder }]} />
                  <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginBottom: 16, textAlign: 'center' }]}>Custom Accent Color</Text>

                  <View style={{ width: '100%', marginBottom: 24 }}>
                    <ColorPicker
                      style={{ width: '100%', gap: 16 }}
                      value={customHex}
                      onComplete={(colorInfo: any) => setCustomHex(colorInfo.hex)}
                      thumbSize={24}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                        <Preview hideText={true} hideInitialColor={true} style={{ width: 48, height: 48, borderRadius: 12, borderWidth: 2, borderColor: colors.glassBorder }} />
                        <TextInput
                          style={[styles.hexInput, { backgroundColor: colors.glassSoft, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                          value={customHex}
                          onChangeText={(text) => setCustomHex(text.toUpperCase())}
                          placeholder="#HEXCODE"
                          placeholderTextColor={colors.textMuted}
                          maxLength={7}
                          autoCapitalize="characters"
                        />
                      </View>
                      <Panel1 style={{ borderRadius: 12 }} />
                      <HueSlider style={{ borderRadius: 12 }} />
                      <Swatches style={{ marginTop: 8 }} />
                    </ColorPicker>
                  </View>

                  <View style={styles.sheetActions}>
                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.glassSoft, borderWidth: 1, borderColor: colors.glassBorder }]} onPress={() => setShowColorPicker(false)}>
                      <Text style={[textStyles.labelLg, { color: colors.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sheetBtn, { backgroundColor: colors.accent }]} onPress={handleApplyCustomColor}>
                      <Text style={[textStyles.labelLg, { color: '#fff' }]}>Apply Color</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </BlurView>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>

    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
  },
  sectionCard: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  themePills: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  themePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  accentSwatches: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  version: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingBottom: spacing['3xl'],
  },

  // Modals & Bottom Sheets
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
  },
  bsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: spacing.xl,
    alignSelf: 'center',
  },
  modalCard: {
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinInput: {
    borderWidth: 1.5,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: 'center',
    letterSpacing: 20,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  sheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  colorPreviewBlock: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff30',
  },
  hexInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
