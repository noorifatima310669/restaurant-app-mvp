import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function OrderStatusStep({ label, isComplete, isCurrent, isLast }) {
  const { colors } = useTheme();
  const active = isComplete || isCurrent;
  return (
    <View style={styles.container}>
      <View style={styles.rail}>
        <View style={[styles.dot, {
          backgroundColor: active ? colors.primary : colors.muted,
          borderColor: active ? colors.primary : colors.border,
        }]}>
          {isComplete ? <Ionicons name="checkmark" size={14} color={colors.background} /> : null}
        </View>
        {!isLast ? <View style={[styles.line, { backgroundColor: isComplete ? colors.primary : colors.border }]} /> : null}
      </View>
      <Text style={[styles.label, { color: isCurrent ? colors.primary : colors.textSecondary }, isCurrent && styles.current]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  rail: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 7, alignSelf: 'flex-start' },
  current: { fontWeight: '900' },
});
