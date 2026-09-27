import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import EmptyState from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { useReservation } from '../hooks/useReservation';

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReservationScreen() {
  const { colors } = useTheme();
  const reservation = useReservation();
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const dateOptions = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      value: toLocalDateString(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  }), []);

  const requestConfirmation = () => {
    const errors = reservation.validateReservation();
    if (Object.keys(errors).length === 0) setConfirmationVisible(true);
  };

  const confirmReservation = () => {
    const result = reservation.createReservation();
    if (result.ok) {
      setConfirmationVisible(false);
      Alert.alert('Table requested', `${result.reservation.id} has been sent to the restaurant for confirmation.`);
    }
  };

  const confirmCancellation = (item) => {
    Alert.alert(
      'Cancel this reservation?',
      `${item.date} at ${item.time} · ${item.tableName}`,
      [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel reservation', style: 'destructive', onPress: () => reservation.cancelReservation(item.id) },
      ],
    );
  };

  const activeReservations = reservation.reservations.filter((item) => item.status !== 'Cancelled');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={88}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { backgroundColor: colors.primary }]}>
            <Ionicons name="calendar-outline" size={27} color={colors.accent} />
            <Text style={[styles.heroTitle, { color: colors.background }]}>Your table, your time.</Text>
            <Text style={[styles.heroCopy, { color: colors.background }]}>Choose a moment that works. We will take care of everything else.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={[styles.number, { backgroundColor: colors.accent }]}>
                <Text style={styles.numberText}>1</Text>
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pick a date</Text>
                <Text style={[styles.sectionCopy, { color: colors.textSecondary }]}>Reservations are open for the next seven days.</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dateOptions.map((option) => {
                const selected = reservation.selectedDate === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => reservation.setSelectedDate(option.value)}
                    style={[styles.dateCard, {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    }]}
                  >
                    <Text style={[styles.dateDay, { color: selected ? colors.background : colors.textSecondary }]}>{option.day}</Text>
                    <Text style={[styles.dateNumber, { color: selected ? colors.background : colors.text }]}>{option.date}</Text>
                    <Text style={[styles.dateMonth, { color: selected ? colors.background : colors.textSecondary }]}>{option.month}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {reservation.errors.date ? <Text style={[styles.error, { color: colors.danger }]}>{reservation.errors.date}</Text> : null}
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeading}>
              <View style={[styles.number, { backgroundColor: colors.accent }]}><Text style={styles.numberText}>2</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Party size</Text>
                <Text style={[styles.sectionCopy, { color: colors.textSecondary }]}>From an intimate lunch to a table of twelve.</Text>
              </View>
            </View>
            <View style={styles.partyRow}>
              <Pressable onPress={() => reservation.setPartySize(reservation.partySize - 1)} style={[styles.partyButton, { backgroundColor: colors.muted }]}>
                <Ionicons name="remove" size={22} color={colors.text} />
              </Pressable>
              <View style={styles.partyCount}>
                <Text style={[styles.partyNumber, { color: colors.text }]}>{reservation.partySize}</Text>
                <Text style={[styles.partyLabel, { color: colors.textSecondary }]}>{reservation.partySize === 1 ? 'guest' : 'guests'}</Text>
              </View>
              <Pressable onPress={() => reservation.setPartySize(reservation.partySize + 1)} style={[styles.partyButton, { backgroundColor: colors.muted }]}>
                <Ionicons name="add" size={22} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={[styles.number, { backgroundColor: colors.accent }]}><Text style={styles.numberText}>3</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a time</Text>
                <Text style={[styles.sectionCopy, { color: colors.textSecondary }]}>Unavailable times are softly muted.</Text>
              </View>
            </View>
            <View style={styles.timeGrid}>
              {reservation.availability.map(({ time, isAvailable }) => {
                const selected = reservation.selectedTime === time;
                return (
                  <Pressable
                    key={time}
                    disabled={!isAvailable}
                    onPress={() => reservation.setSelectedTime(time)}
                    style={[styles.timeChip, {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: isAvailable ? 1 : 0.38,
                    }]}
                  >
                    <Text style={[styles.timeText, { color: selected ? colors.background : colors.text }]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
            {reservation.errors.time ? <Text style={[styles.error, { color: colors.danger }]}>{reservation.errors.time}</Text> : null}
          </View>

          {reservation.selectedTime ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Available tables</Text>
              <View style={styles.tableGrid}>
                {reservation.availableTables.map((table) => {
                  const selected = reservation.selectedTableId === table.id;
                  return (
                    <Pressable
                      key={table.id}
                      onPress={() => reservation.selectTable(table.id)}
                      style={[styles.tableCard, {
                        backgroundColor: selected ? colors.muted : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      }]}
                    >
                      <Ionicons name="restaurant-outline" size={20} color={selected ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.tableName, { color: colors.text }]}>{table.name}</Text>
                      <Text style={[styles.tableMeta, { color: colors.textSecondary }]}>{table.seats} seats · {table.area}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {reservation.errors.table ? <Text style={[styles.error, { color: colors.danger }]}>{reservation.errors.table}</Text> : null}
            </View>
          ) : null}

          <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact details</Text>
            <Text style={[styles.sectionCopy, { color: colors.textSecondary }]}>We will use these details only for this booking.</Text>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Booking name</Text>
            <View style={[styles.inputWrap, { borderColor: reservation.errors.contactName ? colors.danger : colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="person-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={reservation.contactName}
                onChangeText={reservation.setContactName}
                placeholder="Full name"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
            {reservation.errors.contactName ? <Text style={[styles.error, { color: colors.danger }]}>{reservation.errors.contactName}</Text> : null}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Pakistan mobile</Text>
            <View style={[styles.inputWrap, { borderColor: reservation.errors.phone ? colors.danger : colors.border, backgroundColor: colors.background }]}>
              <Ionicons name="call-outline" size={19} color={colors.textSecondary} />
              <TextInput
                value={reservation.phone}
                onChangeText={reservation.setPhone}
                placeholder="03XX-XXXXXXX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={12}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
            {reservation.errors.phone ? <Text style={[styles.error, { color: colors.danger }]}>{reservation.errors.phone}</Text> : null}
          </View>

          {reservation.selectedTable ? (
            <View style={[styles.selectedSummary, { backgroundColor: colors.muted }]}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <View style={styles.selectedCopy}>
                <Text style={[styles.selectedTitle, { color: colors.text }]}>{reservation.selectedTable.name}</Text>
                <Text style={[styles.selectedMeta, { color: colors.textSecondary }]}>{reservation.selectedDate} · {reservation.selectedTime} · {reservation.partySize} guests</Text>
              </View>
            </View>
          ) : null}

          <Pressable onPress={requestConfirmation} style={({ pressed }) => [styles.reserveButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
            <Text style={[styles.reserveText, { color: colors.background }]}>Review reservation</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </Pressable>

          <View style={styles.reservationsHeader}>
            <Text style={[styles.reservationsTitle, { color: colors.text }]}>My reservations</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{activeReservations.length} active</Text>
          </View>
          {activeReservations.length ? activeReservations.map((item) => (
            <View key={item.id} style={[styles.reservationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.reservationTop}>
                <View style={[styles.calendarIcon, { backgroundColor: colors.muted }]}>
                  <Ionicons name="calendar" size={21} color={colors.primary} />
                </View>
                <View style={styles.selectedCopy}>
                  <Text style={[styles.reservationDate, { color: colors.text }]}>{item.date} at {item.time}</Text>
                  <Text style={[styles.reservationMeta, { color: colors.textSecondary }]}>{item.tableName} · {item.partySize} guests</Text>
                </View>
                <View style={[styles.status, { backgroundColor: item.status === 'Accepted' ? colors.success : colors.warning }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              <View style={styles.reservationBottom}>
                <Text style={[styles.reservationId, { color: colors.textSecondary }]}>{item.id}</Text>
                {['Pending', 'Accepted'].includes(item.status) ? (
                  <Pressable onPress={() => confirmCancellation(item)}>
                    <Text style={[styles.cancelText, { color: colors.danger }]}>Cancel</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )) : (
            <EmptyState icon="calendar-clear-outline" title="No reservations yet" message="Your confirmed table requests will stay organised here." />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={confirmationVisible} onRequestClose={() => setConfirmationVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalIcon, { backgroundColor: colors.muted }]}>
              <Ionicons name="restaurant" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm your table</Text>
            <Text style={[styles.modalCopy, { color: colors.textSecondary }]}>Please check the booking details before we save it.</Text>
            {[
              ['Date', reservation.selectedDate],
              ['Time', reservation.selectedTime],
              ['Party', `${reservation.partySize} guests`],
              ['Table', reservation.selectedTable?.name],
              ['Phone', reservation.phone],
            ].map(([label, value]) => (
              <View key={label} style={styles.modalRow}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{label}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{value}</Text>
              </View>
            ))}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setConfirmationVisible(false)} style={[styles.modalSecondary, { borderColor: colors.border }]}>
                <Text style={[styles.modalSecondaryText, { color: colors.text }]}>Edit</Text>
              </Pressable>
              <Pressable onPress={confirmReservation} style={[styles.modalPrimary, { backgroundColor: colors.primary }]}>
                <Text style={[styles.modalPrimaryText, { color: colors.background }]}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 120 },
  hero: { minHeight: 184, borderRadius: 27, padding: 23, justifyContent: 'flex-end', marginBottom: 27 },
  heroTitle: { fontSize: 29, fontWeight: '900', marginTop: 12 },
  heroCopy: { fontSize: 14, lineHeight: 21, marginTop: 7, opacity: 0.82 },
  section: { marginBottom: 27 },
  sectionCard: { borderWidth: 1, borderRadius: 23, padding: 18, marginBottom: 27 },
  sectionHeading: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 15 },
  number: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#35172F', fontSize: 13, fontWeight: '900' },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionCopy: { fontSize: 12, marginTop: 3 },
  dateCard: { width: 72, minHeight: 92, borderRadius: 18, borderWidth: 1, marginRight: 9, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 11, fontWeight: '800' },
  dateNumber: { fontSize: 24, fontWeight: '900', marginVertical: 2 },
  dateMonth: { fontSize: 11, fontWeight: '700' },
  partyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 23 },
  partyButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  partyCount: { alignItems: 'center', minWidth: 70 },
  partyNumber: { fontSize: 30, fontWeight: '900' },
  partyLabel: { fontSize: 12, marginTop: -2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  timeChip: { width: '22.8%', minHeight: 43, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeText: { fontSize: 13, fontWeight: '800' },
  tableGrid: { gap: 10 },
  tableCard: { borderWidth: 1, borderRadius: 17, padding: 14 },
  tableName: { fontSize: 15, fontWeight: '900', marginTop: 7 },
  tableMeta: { fontSize: 12, marginTop: 3 },
  contactCard: { borderWidth: 1, borderRadius: 23, padding: 18, marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '800', marginTop: 17, marginBottom: 7 },
  inputWrap: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 15, marginLeft: 9, paddingVertical: 11 },
  error: { fontSize: 12, fontWeight: '600', lineHeight: 17, marginTop: 7 },
  selectedSummary: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  selectedCopy: { flex: 1, marginLeft: 11 },
  selectedTitle: { fontSize: 15, fontWeight: '900' },
  selectedMeta: { fontSize: 12, marginTop: 4 },
  reserveButton: { minHeight: 57, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  reserveText: { fontSize: 16, fontWeight: '900' },
  reservationsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 34, marginBottom: 14 },
  reservationsTitle: { fontSize: 22, fontWeight: '900' },
  count: { fontSize: 12, fontWeight: '700' },
  reservationCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 },
  reservationTop: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reservationDate: { fontSize: 14, fontWeight: '900' },
  reservationMeta: { fontSize: 12, marginTop: 4 },
  status: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  cardDivider: { height: 1, marginVertical: 13 },
  reservationBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  reservationId: { fontSize: 11, fontWeight: '700' },
  cancelText: { fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.8 },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 26, padding: 23 },
  modalIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 23, fontWeight: '900', marginTop: 17 },
  modalCopy: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 17 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, gap: 20 },
  modalLabel: { fontSize: 13 },
  modalValue: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 13 },
  modalSecondary: { flex: 1, minHeight: 50, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalPrimary: { flex: 1, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { fontSize: 14, fontWeight: '800' },
  modalPrimaryText: { fontSize: 14, fontWeight: '900' },
});
