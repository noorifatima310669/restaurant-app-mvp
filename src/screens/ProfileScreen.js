import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  const confirmLogout = () => {
    Alert.alert('Sign out of Urban Fork?', 'You can sign back in at any time.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR URBAN FORK</Text>
          <Text style={[styles.title, { color: colors.text }]}>Profile & preferences</Text>
        </View>
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.background }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.background }]}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primaryDark }]}>
            <Ionicons name={user.role === 'manager' ? 'briefcase-outline' : 'person-outline'} size={14} color={colors.background} />
            <Text style={[styles.roleText, { color: colors.background }]}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={[styles.settingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color={colors.primary} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Dark theme</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>Switch the entire app to a softer evening palette.</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? colors.accent : colors.surface}
          />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoHeader}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="restaurant-outline" size={21} color={colors.background} />
            </View>
            <View>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Urban Fork</Text>
              <Text style={[styles.version, { color: colors.textSecondary }]}>Restaurant App MVP · Fall 2026</Text>
            </View>
          </View>
          <Text style={[styles.infoCopy, { color: colors.textSecondary }]}>
            A frontend-only Expo experience for browsing, ordering, live tracking, reservations, and restaurant operations.
          </Text>
          <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.localNote, { color: colors.olive }]}>Orders, reservations and menu edits are stored locally on this device.</Text>
        </View>

        <Pressable onPress={confirmLogout} style={({ pressed }) => [styles.logout, { borderColor: colors.danger }, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={21} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110 },
  header: { marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 29, fontWeight: '900', marginTop: 6 },
  profileCard: { borderRadius: 27, padding: 25, alignItems: 'center' },
  avatar: { width: 82, height: 82, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#35172F', fontSize: 26, fontWeight: '900' },
  name: { fontSize: 24, fontWeight: '900', marginTop: 16 },
  email: { fontSize: 14, opacity: 0.8, marginTop: 5 },
  roleBadge: { flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 13, marginTop: 14 },
  roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  settingCard: { borderWidth: 1, borderRadius: 21, padding: 17, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, marginHorizontal: 12 },
  settingTitle: { fontSize: 15, fontWeight: '900' },
  settingDescription: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  infoCard: { borderWidth: 1, borderRadius: 21, padding: 18, marginTop: 16 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 17, fontWeight: '900' },
  version: { fontSize: 11, marginTop: 3 },
  infoCopy: { fontSize: 13, lineHeight: 19, marginTop: 15 },
  infoDivider: { height: 1, marginVertical: 14 },
  localNote: { fontSize: 11, fontWeight: '700', lineHeight: 16 },
  logout: { minHeight: 54, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18 },
  logoutText: { fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.78 },
});
