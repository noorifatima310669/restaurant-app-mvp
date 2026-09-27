import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function CartItemRow({ item, dispatch }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <Image source={item.image} style={styles.image} />
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>PKR {item.price.toLocaleString()} each</Text>
          <Text style={[styles.linePrice, { color: colors.primary }]}>PKR {(item.price * item.quantity).toLocaleString()}</Text>
        </View>
        <Pressable
          accessibilityLabel={`Remove ${item.name}`}
          onPress={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })}
          style={styles.remove}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>Quantity</Text>
        <View style={[styles.stepper, { backgroundColor: colors.muted }]}>
          <Pressable onPress={() => dispatch({ type: 'DECREMENT', payload: item.id })} style={styles.stepButton}>
            <Ionicons name="remove" size={19} color={colors.text} />
          </Pressable>
          <Text style={[styles.quantity, { color: colors.text }]}>{item.quantity}</Text>
          <Pressable onPress={() => dispatch({ type: 'INCREMENT', payload: item.id })} style={styles.stepButton}>
            <Ionicons name="add" size={19} color={colors.text} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.noteWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
        <TextInput
          value={item.note}
          onChangeText={(note) => dispatch({ type: 'UPDATE_NOTE', payload: { id: item.id, note } })}
          placeholder="Special instructions, e.g. No onions"
          placeholderTextColor={colors.textSecondary}
          style={[styles.note, { color: colors.text }]}
          maxLength={100}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 22, borderWidth: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start' },
  image: { width: 82, height: 82, borderRadius: 17 },
  details: { flex: 1, marginLeft: 14 },
  name: { fontSize: 17, lineHeight: 22, fontWeight: '800' },
  unitPrice: { fontSize: 13, marginTop: 5 },
  linePrice: { fontSize: 15, fontWeight: '900', marginTop: 6 },
  remove: { padding: 5 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
  quantityLabel: { fontSize: 13, fontWeight: '700' },
  stepper: { flexDirection: 'row', borderRadius: 14, alignItems: 'center' },
  stepButton: { width: 39, height: 36, alignItems: 'center', justifyContent: 'center' },
  quantity: { width: 28, textAlign: 'center', fontSize: 15, fontWeight: '900' },
  noteWrap: { minHeight: 46, marginTop: 14, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  note: { flex: 1, fontSize: 14, marginLeft: 8, paddingVertical: 10 },
});
