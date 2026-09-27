import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable,
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from '../hooks/useForm';

const INITIAL_VALUES = {
  fullName: '', email: '', password: '', confirmPassword: '', role: 'customer',
};

function FormField({
  label, icon, error, secure, visible, onToggleVisible, colors, ...inputProps
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <TextInput
          {...inputProps}
          secureTextEntry={secure && !visible}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }]}
        />
        {secure ? (
          <Pressable accessibilityLabel={visible ? 'Hide password' : 'Show password'} onPress={onToggleVisible} hitSlop={10}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((values) => {
    const errors = {};
    if (mode === 'signup' && values.fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
    if (values.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    else if (!/\d/.test(values.password)) errors.password = 'Password must include at least one digit.';
    if (mode === 'signup' && values.confirmPassword !== values.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  }, [mode]);

  const {
    values, errors, handleChange, handleSubmit, reset,
  } = useForm(INITIAL_VALUES, validate);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    reset(INITIAL_VALUES);
    setPasswordVisible(false);
    setConfirmVisible(false);
  };

  const submit = handleSubmit(async (formValues) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = mode === 'login'
      ? login(formValues.email, formValues.password)
      : signup(formValues);
    if (!result) {
      setIsSubmitting(false);
      Alert.alert(
        mode === 'login' ? 'Unable to sign in' : 'Account already exists',
        mode === 'login'
          ? 'The email or password is incorrect. Please check your details and try again.'
          : 'An account already uses this email. Try signing in instead.',
      );
    }
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant-outline" size={29} color={colors.background} />
            </View>
            <Text style={[styles.wordmark, { color: colors.primary }]}>URBAN FORK</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === 'login' ? 'Welcome back' : 'Join the table'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {mode === 'login'
                ? 'Good food, right on time. Sign in to continue.'
                : 'Create your account for effortless dining and reservations.'}
            </Text>
          </View>

          <View style={[styles.switcher, { backgroundColor: colors.muted }]}>
            {[
              ['login', 'Login'],
              ['signup', 'Create account'],
            ].map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => switchMode(value)}
                style={[styles.switchButton, mode === value && { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.switchText, { color: mode === value ? colors.primary : colors.textSecondary }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {mode === 'signup' ? (
              <FormField
                label="Full name"
                icon="person-outline"
                value={values.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
                placeholder="Your full name"
                autoCapitalize="words"
                error={errors.fullName}
                colors={colors}
              />
            ) : null}
            <FormField
              label="Email"
              icon="mail-outline"
              value={values.email}
              onChangeText={(text) => handleChange('email', text)}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              error={errors.email}
              colors={colors}
            />
            <FormField
              label="Password"
              icon="lock-closed-outline"
              value={values.password}
              onChangeText={(text) => handleChange('password', text)}
              placeholder="Minimum 8 characters"
              autoCapitalize="none"
              secure
              visible={passwordVisible}
              onToggleVisible={() => setPasswordVisible((current) => !current)}
              error={errors.password}
              colors={colors}
            />
            {mode === 'signup' ? (
              <>
                <FormField
                  label="Confirm password"
                  icon="shield-checkmark-outline"
                  value={values.confirmPassword}
                  onChangeText={(text) => handleChange('confirmPassword', text)}
                  placeholder="Repeat your password"
                  autoCapitalize="none"
                  secure
                  visible={confirmVisible}
                  onToggleVisible={() => setConfirmVisible((current) => !current)}
                  error={errors.confirmPassword}
                  colors={colors}
                />
                <Text style={[styles.label, { color: colors.text }]}>Account role</Text>
                <View style={styles.roleRow}>
                  {[
                    ['customer', 'Customer', 'person-outline'],
                    ['manager', 'Manager', 'briefcase-outline'],
                  ].map(([role, label, icon]) => {
                    const selected = values.role === role;
                    return (
                      <Pressable
                        key={role}
                        onPress={() => handleChange('role', role)}
                        style={[
                          styles.roleCard,
                          { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.muted : colors.surface },
                        ]}
                      >
                        <Ionicons name={icon} size={21} color={selected ? colors.primary : colors.textSecondary} />
                        <Text style={[styles.roleText, { color: selected ? colors.primary : colors.textSecondary }]}>{label}</Text>
                        {selected ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
            <Pressable
              disabled={isSubmitting}
              onPress={submit}
              style={({ pressed }) => [
                styles.submit, { backgroundColor: colors.primary },
                (pressed || isSubmitting) && styles.pressed,
              ]}
            >
              {isSubmitting
                ? <ActivityIndicator color={colors.background} />
                : <Text style={[styles.submitText, { color: colors.background }]}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </Pressable>
          </View>
          <Text style={[styles.footnote, { color: colors.textSecondary }]}>One table. Great food. Zero waiting.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 34 },
  hero: { alignItems: 'center', marginBottom: 24 },
  brandMark: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  wordmark: { fontSize: 14, fontWeight: '900', letterSpacing: 3.2 },
  title: { fontSize: 31, fontWeight: '900', marginTop: 14 },
  subtitle: { maxWidth: 320, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  switcher: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: 16 },
  switchButton: { flex: 1, minHeight: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontSize: 14, fontWeight: '800' },
  formCard: { borderRadius: 24, borderWidth: 1, padding: 19 },
  fieldGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  inputWrap: { minHeight: 52, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, marginLeft: 10 },
  error: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 6 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  roleCard: { flex: 1, minHeight: 53, borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  roleText: { flex: 1, fontSize: 13, fontWeight: '800' },
  submit: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  submitText: { fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.78 },
  footnote: { fontSize: 13, textAlign: 'center', marginTop: 22 },
});
