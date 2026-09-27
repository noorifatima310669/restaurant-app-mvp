import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';
import { tables } from '../data/tables';

export const SERVICE_CHARGE_RATE = 0.05;
export const SALES_TAX_RATE = 0.15;
const PICKUP_TIMES = ['As soon as possible', 'In 20 minutes', 'In 35 minutes', 'In 50 minutes'];

function MoneyRow({ label, value, colors, strong = false, negative = false }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={[strong ? styles.grandLabel : styles.moneyLabel, { color: strong ? colors.text : colors.textSecondary }]}>{label}</Text>
      <Text style={[strong ? styles.grandValue : styles.moneyValue, { color: negative ? colors.success : colors.text }]}>
        {negative ? '− ' : ''}PKR {Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </Text>
    </View>
  );
}

export default function OrderSummaryScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { state, dispatch } = useCart();
  const { createOrder } = useOrders();
  const [orderType, setOrderType] = useState('Dine-in');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceCharge = subtotal * SERVICE_CHARGE_RATE;
    const promoDiscount = subtotal * (state.discountPercent / 100);
    const taxableAmount = Math.max(0, subtotal + serviceCharge - promoDiscount);
    const salesTax = taxableAmount * SALES_TAX_RATE;
    const grandTotal = taxableAmount + salesTax;
    return { subtotal, serviceCharge, promoDiscount, salesTax, grandTotal };
  }, [state.discountPercent, state.items]);

  if (!state.items.length) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.empty}>
          <EmptyState title="Nothing to summarise yet" message="Add your favourite dishes before placing an order." actionLabel="Back to menu" onAction={() => navigation.getParent()?.navigate('Menu')} />
        </View>
      </SafeAreaView>
    );
  }

  const placeOrder = () => {
    if (orderType === 'Dine-in' && !selectedTableId) {
      Alert.alert('Choose a table', 'Select where you would like to dine before placing the order.');
      return;
    }
    if (orderType === 'Takeaway' && !pickupTime) {
      Alert.alert('Choose a pickup time', 'Tell us when you would like your takeaway ready.');
      return;
    }
    const table = tables.find((entry) => entry.id === selectedTableId);
    const order = createOrder({
      items: state.items,
      total: Math.round(totals.grandTotal),
      type: orderType,
      ...(orderType === 'Dine-in' ? { tableId: table.id, tableName: table.name } : { pickupTime }),
      customer: { id: user.id, name: user.name, email: user.email },
      promoCode: state.promoCode,
    });
    dispatch({ type: 'CLEAR_CART' });
    Alert.alert(
      'Order placed',
      `${order.id} is confirmed. Follow its progress from Pending to Served in real time.`,
      [{ text: 'Track order', onPress: () => navigation.getParent()?.navigate('Orders') }],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>FINAL CHECK</Text>
          <Text style={[styles.title, { color: colors.text }]}>Everything looks delicious.</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Review your receipt and tell us how you would like to enjoy it.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order type</Text>
        <View style={styles.typeRow}>
          {[
            ['Dine-in', 'restaurant-outline', 'Enjoy it at Urban Fork'],
            ['Takeaway', 'bag-handle-outline', 'Pick it up when ready'],
          ].map(([type, icon, copy]) => {
            const selected = orderType === type;
            return (
              <Pressable
                key={type}
                onPress={() => {
                  setOrderType(type);
                  setSelectedTableId('');
                  setPickupTime('');
                }}
                style={[styles.typeCard, { backgroundColor: selected ? colors.muted : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
              >
                <Ionicons name={icon} size={24} color={selected ? colors.primary : colors.textSecondary} />
                <Text style={[styles.typeName, { color: colors.text }]}>{type}</Text>
                <Text style={[styles.typeCopy, { color: colors.textSecondary }]}>{copy}</Text>
                {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.check} /> : null}
              </Pressable>
            );
          })}
        </View>

        {orderType === 'Dine-in' ? (
          <View style={styles.selectionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose your table</Text>
            <View style={styles.choiceGrid}>
              {tables.map((table) => {
                const selected = selectedTableId === table.id;
                return (
                  <Pressable
                    key={table.id}
                    onPress={() => setSelectedTableId(table.id)}
                    style={[styles.choice, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.choiceName, { color: selected ? colors.background : colors.text }]}>{table.name}</Text>
                    <Text style={[styles.choiceMeta, { color: selected ? colors.background : colors.textSecondary }]}>{table.seats} seats · {table.area}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.selectionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup time</Text>
            <View style={styles.choiceGrid}>
              {PICKUP_TIMES.map((time) => {
                const selected = pickupTime === time;
                return (
                  <Pressable
                    key={time}
                    onPress={() => setPickupTime(time)}
                    style={[styles.choice, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}
                  >
                    <Text style={[styles.choiceName, { color: selected ? colors.background : colors.text }]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.receipt, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.receiptHeader}>
            <View>
              <Text style={[styles.receiptEyebrow, { color: colors.olive }]}>URBAN FORK RECEIPT</Text>
              <Text style={[styles.receiptTitle, { color: colors.text }]}>{state.items.length} selections</Text>
            </View>
            <Ionicons name="receipt-outline" size={26} color={colors.primary} />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {state.items.map((item) => (
            <View key={item.id} style={styles.itemLine}>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.quantity} × {item.name}</Text>
                {item.note ? <Text style={[styles.itemNote, { color: colors.textSecondary }]}>{item.note}</Text> : null}
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>PKR {(item.price * item.quantity).toLocaleString()}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MoneyRow label="Subtotal" value={totals.subtotal} colors={colors} />
          <MoneyRow label="Service charge (5%)" value={totals.serviceCharge} colors={colors} />
          <MoneyRow label="Sales tax (15%)" value={totals.salesTax} colors={colors} />
          {totals.promoDiscount > 0 ? <MoneyRow label={`Promo · ${state.promoCode}`} value={totals.promoDiscount} negative colors={colors} /> : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MoneyRow label="Grand total" value={totals.grandTotal} strong colors={colors} />
        </View>

        <Pressable onPress={placeOrder} style={({ pressed }) => [styles.placeButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Text style={[styles.placeText, { color: colors.background }]}>Place order · PKR {Math.round(totals.grandTotal).toLocaleString()}</Text>
          <Ionicons name="arrow-forward-circle" size={22} color={colors.background} />
        </Pressable>
        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
          <Text style={[styles.secureText, { color: colors.textSecondary }]}>Your selection is saved only on this device.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 50 },
  heading: { marginBottom: 25 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 340 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 11 },
  typeRow: { flexDirection: 'row', gap: 11, marginBottom: 24 },
  typeCard: { flex: 1, minHeight: 128, borderWidth: 1, borderRadius: 20, padding: 16 },
  typeName: { fontSize: 16, fontWeight: '900', marginTop: 12 },
  typeCopy: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  check: { position: 'absolute', top: 13, right: 13 },
  selectionSection: { marginBottom: 24 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  choice: { minWidth: '47%', flexGrow: 1, borderWidth: 1, borderRadius: 15, padding: 13 },
  choiceName: { fontSize: 13, fontWeight: '900' },
  choiceMeta: { fontSize: 11, marginTop: 4 },
  receipt: { borderWidth: 1, borderRadius: 24, padding: 19 },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  receiptEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  receiptTitle: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, gap: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '800' },
  itemNote: { fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  itemPrice: { fontSize: 13, fontWeight: '800' },
  moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  moneyLabel: { fontSize: 14 },
  moneyValue: { fontSize: 14, fontWeight: '700' },
  grandLabel: { fontSize: 18, fontWeight: '900' },
  grandValue: { fontSize: 20, fontWeight: '900' },
  placeButton: { minHeight: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 18 },
  placeText: { fontSize: 16, fontWeight: '900' },
  secureRow: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  secureText: { fontSize: 12 },
  pressed: { opacity: 0.8 },
});
