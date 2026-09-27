import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  SafeAreaView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import CartItemRow from '../components/CartItemRow';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { promoCodes } from '../data/promoCodes';

export default function CartScreen({ navigation }) {
  const { colors } = useTheme();
  const { state, dispatch, totalItems, subtotal } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    const percent = promoCodes[code];
    if (!percent) {
      setPromoError('That code is not recognised. Check the spelling and try again.');
      return;
    }
    dispatch({ type: 'APPLY_PROMO', payload: { code, percent } });
    setPromoInput('');
    setPromoError('');
  };

  const confirmClear = () => {
    Alert.alert('Clear your cart?', 'This will remove every dish and its special instructions.', [
      { text: 'Keep items', style: 'cancel' },
      { text: 'Clear cart', style: 'destructive', onPress: () => dispatch({ type: 'CLEAR_CART' }) },
    ]);
  };

  if (!state.items.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="basket-outline"
            title="Your cart is ready for a craving"
            message="Add a few Urban Fork favourites and they will appear here."
            actionLabel="Browse menu"
            onAction={() => navigation.getParent()?.navigate('Menu')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.headerLine}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR ORDER</Text>
          <Text style={[styles.title, { color: colors.text }]}>A delicious start.</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</Text>
        </View>
        <Pressable onPress={confirmClear} style={[styles.clearButton, { borderColor: colors.border }]}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <Text style={[styles.clearText, { color: colors.danger }]}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );

  const listFooter = (
    <View style={styles.footer}>
      <View style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.promoTitleRow}>
          <Ionicons name="ticket-outline" size={21} color={colors.primary} />
          <Text style={[styles.promoTitle, { color: colors.text }]}>Have a promo code?</Text>
        </View>
        {state.promoCode ? (
          <View style={[styles.applied, { backgroundColor: colors.muted }]}>
            <View>
              <Text style={[styles.appliedCode, { color: colors.success }]}>{state.promoCode} APPLIED</Text>
              <Text style={[styles.appliedCopy, { color: colors.textSecondary }]}>{state.discountPercent}% off your food subtotal</Text>
            </View>
            <Pressable onPress={() => dispatch({ type: 'REMOVE_PROMO' })}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.promoRow}>
            <TextInput
              value={promoInput}
              onChangeText={(text) => {
                setPromoInput(text);
                setPromoError('');
              }}
              autoCapitalize="characters"
              placeholder="Enter code"
              placeholderTextColor={colors.textSecondary}
              style={[styles.promoInput, { color: colors.text, backgroundColor: colors.background, borderColor: promoError ? colors.danger : colors.border }]}
            />
            <Pressable onPress={applyPromo} style={[styles.applyButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.applyText, { color: colors.background }]}>Apply</Text>
            </Pressable>
          </View>
        )}
        {promoError ? <Text style={[styles.error, { color: colors.danger }]}>{promoError}</Text> : null}
      </View>
      <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.background }]}>Food subtotal</Text>
          <Text style={[styles.totalHint, { color: colors.background }]}>Taxes and service calculated next</Text>
        </View>
        <Text style={[styles.totalValue, { color: colors.background }]}>PKR {subtotal.toLocaleString()}</Text>
      </View>
      <Pressable
        onPress={() => navigation.navigate('OrderSummary')}
        style={({ pressed }) => [styles.continueButton, { backgroundColor: colors.accent }, pressed && styles.pressed]}
      >
        <Text style={[styles.continueText, { color: colors.primaryDark }]}>Continue to summary</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.primaryDark} />
      </Pressable>
      <Text style={[styles.reassurance, { color: colors.textSecondary }]}>Your order is in good hands.</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          data={state.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CartItemRow item={item} dispatch={dispatch} />}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  headerLine: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 28, fontWeight: '900', marginTop: 6 },
  subtitle: { fontSize: 14, marginTop: 5 },
  clearButton: { minHeight: 40, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  clearText: { fontSize: 13, fontWeight: '800' },
  footer: { paddingHorizontal: 20, paddingBottom: 110 },
  promoCard: { padding: 17, borderRadius: 20, borderWidth: 1, marginTop: 2 },
  promoTitleRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 13 },
  promoTitle: { fontSize: 16, fontWeight: '900' },
  promoRow: { flexDirection: 'row', gap: 9 },
  promoInput: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontWeight: '700' },
  applyButton: { minWidth: 84, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  applyText: { fontSize: 14, fontWeight: '900' },
  applied: { padding: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appliedCode: { fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },
  appliedCopy: { fontSize: 12, marginTop: 3 },
  error: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  totalCard: { borderRadius: 20, marginTop: 15, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, fontWeight: '800' },
  totalHint: { fontSize: 11, marginTop: 4, opacity: 0.72 },
  totalValue: { fontSize: 20, fontWeight: '900' },
  continueButton: { minHeight: 56, borderRadius: 17, marginTop: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  continueText: { fontSize: 16, fontWeight: '900' },
  reassurance: { textAlign: 'center', fontSize: 12, marginTop: 12 },
  pressed: { opacity: 0.8 },
});
