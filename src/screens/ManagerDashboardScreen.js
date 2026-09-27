import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useTheme } from '../context/ThemeContext';

const SEGMENTS = ['Incoming Orders', 'Reservations', 'Menu Management'];
const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'];
const CATEGORIES = ['Starters', 'Mains', 'Desserts', 'Drinks'];

function SummaryCard({ icon, value, label, colors }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.summaryIcon, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

export default function ManagerDashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { orders, updateStatus } = useOrders();
  const {
    menuItems, reservations, updateMenuItem, addMenuItem, updateReservationStatus,
  } = useRestaurant();
  const [segment, setSegment] = useState('Incoming Orders');
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: 'Mains',
  });

  const activeOrders = useMemo(
    () => orders.filter((order) => !['Served', 'Cancelled'].includes(order.status)),
    [orders],
  );
  const pendingReservations = useMemo(
    () => reservations.filter((item) => item.status === 'Pending'),
    [reservations],
  );
  const activeReservations = useMemo(
    () => reservations.filter((item) => ['Pending', 'Accepted'].includes(item.status)),
    [reservations],
  );
  const availableCount = useMemo(
    () => menuItems.filter((item) => item.isAvailable).length,
    [menuItems],
  );

  const setOrderStatus = (order, status) => {
    if (status === 'Cancelled') {
      Alert.alert('Cancel this order?', `${order.id} will stop progressing.`, [
        { text: 'Keep order', style: 'cancel' },
        { text: 'Cancel order', style: 'destructive', onPress: () => updateStatus(order.id, status, true) },
      ]);
      return;
    }
    updateStatus(order.id, status, true);
  };

  const declineReservation = (item) => {
    Alert.alert('Decline reservation?', `${item.contactName}'s table request will be marked declined.`, [
      { text: 'Keep pending', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => updateReservationStatus(item.id, 'Declined') },
    ]);
  };

  const toggleAvailability = (item) => {
    if (item.isAvailable) {
      Alert.alert('Mark item unavailable?', `${item.name} will be muted on the customer menu.`, [
        { text: 'Keep available', style: 'cancel' },
        { text: 'Mark unavailable', style: 'destructive', onPress: () => updateMenuItem(item.id, { isAvailable: false }) },
      ]);
    } else {
      updateMenuItem(item.id, { isAvailable: true });
    }
  };

  const savePrice = (item, text) => {
    const price = Number(text);
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Invalid price', 'Enter a positive amount in PKR.');
      return;
    }
    updateMenuItem(item.id, { price: Math.round(price) });
  };

  const submitNewItem = () => {
    const price = Number(newItem.price);
    if (newItem.name.trim().length < 2 || newItem.description.trim().length < 8 || !Number.isFinite(price) || price <= 0) {
      Alert.alert('Complete the item details', 'Add a name, a useful description, and a positive PKR price.');
      return;
    }
    addMenuItem({
      name: newItem.name.trim(),
      description: newItem.description.trim(),
      price: Math.round(price),
      category: newItem.category,
    });
    setNewItem({ name: '', description: '', price: '', category: 'Mains' });
    Alert.alert('Menu item added', 'The new item is immediately available on the customer menu.');
  };

  const renderOrders = () => activeOrders.length ? activeOrders.map((order) => (
    <View key={order.id} style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View>
          <Text style={[styles.cardEyebrow, { color: colors.textSecondary }]}>{order.id}</Text>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{order.customer?.name || 'Guest customer'}</Text>
          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{order.type}{order.tableName ? ` · ${order.tableName}` : ` · ${order.pickupTime}`}</Text>
        </View>
        <View style={styles.alignRight}>
          <Text style={[styles.orderTotal, { color: colors.text }]}>PKR {order.total.toLocaleString()}</Text>
          <Text style={[styles.currentStatus, { color: colors.primary }]}>{order.status}</Text>
        </View>
      </View>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>UPDATE STATUS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {ORDER_STATUSES.map((status) => (
          <Pressable
            key={status}
            onPress={() => setOrderStatus(order, status)}
            style={[styles.statusChip, {
              backgroundColor: order.status === status ? colors.primary : colors.muted,
            }]}
          >
            <Text style={[styles.statusChipText, { color: order.status === status ? colors.background : colors.text }]}>{status}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )) : (
    <EmptyState icon="checkmark-done-outline" title="Kitchen is all caught up" message="New customer orders will appear here the moment they are placed." />
  );

  const renderReservations = () => pendingReservations.length ? pendingReservations.map((item) => (
    <View key={item.id} style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <View style={styles.reservationIdentity}>
          <View style={[styles.personIcon, { backgroundColor: colors.muted }]}>
            <Ionicons name="people-outline" size={21} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.contactName}</Text>
            <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.pendingBadge, { backgroundColor: colors.warning }]}>
          <Text style={styles.pendingText}>PENDING</Text>
        </View>
      </View>
      <View style={[styles.bookingDetails, { backgroundColor: colors.muted }]}>
        <Text style={[styles.bookingMain, { color: colors.text }]}>{item.date} · {item.time}</Text>
        <Text style={[styles.bookingMeta, { color: colors.textSecondary }]}>{item.tableName} · {item.partySize} guests</Text>
      </View>
      <View style={styles.reservationActions}>
        <Pressable onPress={() => declineReservation(item)} style={[styles.declineButton, { borderColor: colors.danger }]}>
          <Text style={[styles.declineText, { color: colors.danger }]}>Decline</Text>
        </Pressable>
        <Pressable onPress={() => updateReservationStatus(item.id, 'Accepted')} style={[styles.acceptButton, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  )) : (
    <EmptyState icon="calendar-outline" title="No pending reservations" message="New table requests will be ready for review here." />
  );

  const renderMenuManagement = () => (
    <View>
      <View style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.addTitle, { color: colors.text }]}>Add a menu item</Text>
        <Text style={[styles.addCopy, { color: colors.textSecondary }]}>New dishes use the house image until a dedicated photo is added.</Text>
        <TextInput
          value={newItem.name}
          onChangeText={(name) => setNewItem((current) => ({ ...current, name }))}
          placeholder="Item name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.managerInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
        />
        <TextInput
          value={newItem.description}
          onChangeText={(description) => setNewItem((current) => ({ ...current, description }))}
          placeholder="Short menu description"
          placeholderTextColor={colors.textSecondary}
          multiline
          style={[styles.managerInput, styles.descriptionInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
        />
        <TextInput
          value={newItem.price}
          onChangeText={(price) => setNewItem((current) => ({ ...current, price }))}
          placeholder="Price in PKR"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          style={[styles.managerInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((category) => (
            <Pressable
              key={category}
              onPress={() => setNewItem((current) => ({ ...current, category }))}
              style={[styles.categoryChip, { backgroundColor: newItem.category === category ? colors.primary : colors.muted }]}
            >
              <Text style={[styles.categoryText, { color: newItem.category === category ? colors.background : colors.text }]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={submitNewItem} style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add-circle-outline" size={20} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>Add to menu</Text>
        </Pressable>
      </View>

      <Text style={[styles.listTitle, { color: colors.text }]}>Current menu · {menuItems.length} items</Text>
      {menuItems.map((item) => (
        <View key={item.id} style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.menuRowHeader}>
            <View style={styles.menuNameWrap}>
              <Text style={[styles.menuName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.menuCategory, { color: colors.textSecondary }]}>{item.category}</Text>
            </View>
            <Pressable onPress={() => toggleAvailability(item)} style={[styles.availability, { backgroundColor: item.isAvailable ? colors.success : colors.muted }]}>
              <View style={[styles.availabilityDot, { backgroundColor: item.isAvailable ? '#FFFFFF' : colors.textSecondary }]} />
              <Text style={[styles.availabilityText, { color: item.isAvailable ? '#FFFFFF' : colors.textSecondary }]}>{item.isAvailable ? 'Available' : 'Unavailable'}</Text>
            </Pressable>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.currency, { color: colors.textSecondary }]}>PKR</Text>
            <TextInput
              defaultValue={String(item.price)}
              keyboardType="number-pad"
              onEndEditing={(event) => savePrice(item, event.nativeEvent.text)}
              style={[styles.priceInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            />
            <Text style={[styles.editHint, { color: colors.textSecondary }]}>Tap to edit price</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>URBAN FORK OPERATIONS</Text>
          <Text style={[styles.title, { color: colors.text }]}>Good evening, {user.name.split(' ')[0]}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Here's what needs your attention.</Text>
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard icon="receipt-outline" value={activeOrders.length} label="Incoming orders" colors={colors} />
          <SummaryCard icon="calendar-outline" value={activeReservations.length} label="Active reservations" colors={colors} />
          <SummaryCard icon="restaurant-outline" value={availableCount} label="Available items" colors={colors} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segments}>
          {SEGMENTS.map((entry) => (
            <Pressable key={entry} onPress={() => setSegment(entry)} style={[styles.segment, { backgroundColor: segment === entry ? colors.primary : colors.surface, borderColor: segment === entry ? colors.primary : colors.border }]}>
              <Text style={[styles.segmentText, { color: segment === entry ? colors.background : colors.textSecondary }]}>{entry}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.contentHeading}>
          <Text style={[styles.contentTitle, { color: colors.text }]}>{segment}</Text>
          <Text style={[styles.contentHint, { color: colors.textSecondary }]}>
            {segment === 'Incoming Orders' ? `${activeOrders.length} active` : segment === 'Reservations' ? `${pendingReservations.length} awaiting review` : 'Changes save instantly'}
          </Text>
        </View>
        {segment === 'Incoming Orders' ? renderOrders() : segment === 'Reservations' ? renderReservations() : renderMenuManagement()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 110 },
  header: { marginBottom: 19 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 29, fontWeight: '900', marginTop: 6 },
  subtitle: { fontSize: 14, marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: 9 },
  summaryCard: { flex: 1, minHeight: 132, borderWidth: 1, borderRadius: 19, padding: 13 },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '900', marginTop: 11 },
  summaryLabel: { fontSize: 10, lineHeight: 14, fontWeight: '700', marginTop: 2 },
  segments: { paddingVertical: 20, paddingRight: 5 },
  segment: { minHeight: 43, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  segmentText: { fontSize: 13, fontWeight: '900' },
  contentHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  contentTitle: { fontSize: 21, fontWeight: '900' },
  contentHint: { fontSize: 11, fontWeight: '700' },
  contentCard: { borderWidth: 1, borderRadius: 21, padding: 16, marginBottom: 13 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  cardTitle: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  cardMeta: { fontSize: 12, marginTop: 4 },
  alignRight: { alignItems: 'flex-end' },
  orderTotal: { fontSize: 15, fontWeight: '900' },
  currentStatus: { fontSize: 11, fontWeight: '900', marginTop: 5 },
  line: { height: 1, marginVertical: 14 },
  actionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.9, marginBottom: 9 },
  statusChip: { minHeight: 35, borderRadius: 13, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  statusChipText: { fontSize: 11, fontWeight: '800' },
  reservationIdentity: { flexDirection: 'row', alignItems: 'center' },
  personIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pendingBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  pendingText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  bookingDetails: { borderRadius: 14, padding: 13, marginTop: 15 },
  bookingMain: { fontSize: 14, fontWeight: '900' },
  bookingMeta: { fontSize: 12, marginTop: 4 },
  reservationActions: { flexDirection: 'row', gap: 9, marginTop: 13 },
  declineButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  acceptButton: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  declineText: { fontSize: 13, fontWeight: '900' },
  acceptText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  addCard: { borderWidth: 1, borderRadius: 22, padding: 17, marginBottom: 24 },
  addTitle: { fontSize: 18, fontWeight: '900' },
  addCopy: { fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 13 },
  managerInput: { minHeight: 49, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, marginBottom: 10 },
  descriptionInput: { minHeight: 76, paddingTop: 12, textAlignVertical: 'top' },
  categoryScroll: { marginBottom: 13 },
  categoryChip: { minHeight: 36, borderRadius: 13, paddingHorizontal: 12, justifyContent: 'center', marginRight: 7 },
  categoryText: { fontSize: 11, fontWeight: '800' },
  addButton: { minHeight: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  addButtonText: { fontSize: 14, fontWeight: '900' },
  listTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  menuRow: { borderWidth: 1, borderRadius: 19, padding: 15, marginBottom: 11 },
  menuRowHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  menuNameWrap: { flex: 1 },
  menuName: { fontSize: 15, fontWeight: '900' },
  menuCategory: { fontSize: 11, marginTop: 3 },
  availability: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  availabilityDot: { width: 6, height: 6, borderRadius: 3 },
  availabilityText: { fontSize: 9, fontWeight: '900' },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  currency: { fontSize: 12, fontWeight: '800', marginRight: 7 },
  priceInput: { width: 100, minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, fontSize: 14, fontWeight: '900' },
  editHint: { fontSize: 10, marginLeft: 9 },
});
