import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  FlatList, SafeAreaView, StyleSheet, Text, View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import OrderStatusStep from '../components/OrderStatusStep';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';
import { ORDER_STATUSES } from '../reducers/ordersReducer';

const STATUS_COPY = {
  Pending: 'We have received your order and the kitchen is reviewing it.',
  Preparing: 'The kitchen is preparing every item with care.',
  Ready: 'Everything is ready and waiting for its final handoff.',
  Served: 'Order complete. We hope every bite was worth the wait.',
  Cancelled: 'This order was cancelled and will not progress further.',
};

function formatElapsed(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function OrderCard({ order, now, colors }) {
  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const elapsed = Math.max(0, Math.floor((now - new Date(order.timestamp).getTime()) / 1000));
  const cancelled = order.status === 'Cancelled';
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.orderLabel, { color: colors.textSecondary }]}>ORDER NUMBER</Text>
          <Text style={[styles.orderNumber, { color: colors.text }]}>{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cancelled ? colors.danger : colors.primary }]}>
          <Text style={[styles.statusText, { color: colors.background }]}>{order.status}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name={order.type === 'Dine-in' ? 'restaurant-outline' : 'bag-handle-outline'} size={17} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{order.type}{order.tableName ? ` · ${order.tableName}` : ` · ${order.pickupTime}`}</Text>
        </View>
        <Text style={[styles.total, { color: colors.text }]}>PKR {order.total.toLocaleString()}</Text>
      </View>
      <View style={[styles.timer, { backgroundColor: colors.muted }]}>
        <Ionicons name="time-outline" size={19} color={colors.primary} />
        <View>
          <Text style={[styles.timerValue, { color: colors.text }]}>{formatElapsed(elapsed)}</Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>elapsed since placement</Text>
        </View>
      </View>
      {!cancelled ? (
        <View style={styles.steps}>
          {ORDER_STATUSES.map((status, index) => (
            <OrderStatusStep
              key={status}
              label={status}
              isComplete={index < currentIndex}
              isCurrent={index === currentIndex}
              isLast={index === ORDER_STATUSES.length - 1}
            />
          ))}
        </View>
      ) : null}
      <Text style={[styles.statusCopy, { color: colors.textSecondary }]}>{STATUS_COPY[order.status]}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[styles.itemsTitle, { color: colors.text }]}>Order items</Text>
      {order.items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={[styles.itemName, { color: colors.textSecondary }]}>{item.quantity} × {item.name}</Text>
          <Text style={[styles.itemPrice, { color: colors.text }]}>PKR {(item.price * item.quantity).toLocaleString()}</Text>
        </View>
      ))}
      <Text style={[styles.placed, { color: colors.textSecondary }]}>
        Placed {new Date(order.timestamp).toLocaleString()}
      </Text>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { orders, now } = useOrders();
  const customerOrders = useMemo(
    () => orders.filter((order) => order.customer?.id === user.id || order.customer?.email === user.email),
    [orders, user.email, user.id],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={customerOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} now={now} colors={colors} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>LIVE FROM THE KITCHEN</Text>
            <Text style={[styles.title, { color: colors.text }]}>Track every plate.</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Order progress updates automatically while the app is open.</Text>
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            icon="receipt-outline"
            title="No orders to track"
            message="When you place an order, its live kitchen status will appear here."
            actionLabel="Explore menu"
            onAction={() => navigation.getParent()?.navigate('Menu')}
          />
        )}
        ListFooterComponent={<View style={styles.footer} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 18 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 29, fontWeight: '900', marginTop: 6 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  card: { marginHorizontal: 20, marginBottom: 17, padding: 18, borderRadius: 23, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  orderNumber: { fontSize: 21, fontWeight: '900', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '900' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaText: { fontSize: 12, fontWeight: '700' },
  total: { fontSize: 15, fontWeight: '900' },
  timer: { borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 15 },
  timerValue: { fontSize: 17, fontWeight: '900' },
  timerLabel: { fontSize: 10, marginTop: 1 },
  steps: { flexDirection: 'row', marginTop: 20 },
  statusCopy: { fontSize: 13, lineHeight: 19, marginTop: 15 },
  divider: { height: 1, marginVertical: 16 },
  itemsTitle: { fontSize: 14, fontWeight: '900', marginBottom: 9 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 7 },
  itemName: { flex: 1, fontSize: 12 },
  itemPrice: { fontSize: 12, fontWeight: '700' },
  placed: { fontSize: 10, marginTop: 11 },
  footer: { height: 110 },
});
