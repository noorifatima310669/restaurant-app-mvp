import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({
  icon = 'restaurant-outline', title, message, actionLabel, onAction,
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Text style={[styles.buttonText, { color: colors.background }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 20, padding: 28, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  iconWrap: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { marginTop: 20, minHeight: 46, paddingHorizontal: 22, borderRadius: 14, justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8 },
});
