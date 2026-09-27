import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function CategoryChip({ label, selected, onPress, disabled = false }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: selected ? colors.background : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 42, paddingHorizontal: 17, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  label: { fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.78 },
});
