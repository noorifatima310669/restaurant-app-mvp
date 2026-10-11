import { useCallback, useEffect, useMemo, useState } from 'react';
import { reservationTimeSlots } from '../data/tables';
import { api } from '../api/client';
import { normalizeTable } from '../api/normalize';
import { useApi } from './useApi';
import { useAuth } from '../context/AuthContext';
import { useRestaurant } from '../context/RestaurantContext';

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useReservation() {
  const { user } = useAuth();
  const {
    tables, reservations, refreshTables, refreshReservations, addReservation, cancelReservation: cancelStoredReservation,
  } = useRestaurant();
  const [selectedDate, setSelectedDateState] = useState(localDateString());
  const [selectedTime, setSelectedTimeState] = useState('');
  const [partySize, setPartySizeState] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [contactName, setContactNameState] = useState(user?.name || '');
  const [phone, setPhoneState] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadReservations = useCallback(async () => {
    const [, , slots] = await Promise.all([
      refreshTables(), refreshReservations(),
      Promise.all(reservationTimeSlots.map(async time => {
        const query = `?date=${selectedDate}&time=${time}&partySize=${partySize}`;
        return [time, (await api.request(`/tables/availability${query}`)).map(normalizeTable)];
      })),
    ]);
    return { date: selectedDate, partySize, availableByTime: Object.fromEntries(slots) };
  }, [partySize, refreshReservations, refreshTables, selectedDate]);
  const { data, loading, error, refetch } = useApi(loadReservations);
  useEffect(() => {
    const interval = setInterval(refetch, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  const clearError = useCallback((field) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const setSelectedDate = useCallback((value) => {
    setSelectedDateState(value);
    clearError('date');
  }, [clearError]);

  const setSelectedTime = useCallback((value) => {
    setSelectedTimeState(value);
    setSelectedTableId('');
    clearError('time');
  }, [clearError]);

  const setPartySize = useCallback((value) => {
    setPartySizeState(Math.max(1, Math.min(12, value)));
    setSelectedTableId('');
    clearError('partySize');
  }, [clearError]);

  const setContactName = useCallback((value) => {
    setContactNameState(value);
    clearError('contactName');
  }, [clearError]);

  const setPhone = useCallback((value) => {
    setPhoneState(value);
    clearError('phone');
  }, [clearError]);

  const getAvailableTables = useCallback(time => {
    if (data?.date !== selectedDate || data?.partySize !== partySize) return [];
    return data.availableByTime[time] || [];
  }, [data, partySize, selectedDate]);

  const isTimeAtLeastOneHourAhead = useCallback((time) => {
    if (!selectedDate || !time) return false;
    const booking = new Date(`${selectedDate}T${time}:00`);
    return booking.getTime() >= Date.now() + 60 * 60 * 1000;
  }, [selectedDate]);

  const availability = useMemo(() => reservationTimeSlots.map((time) => ({
    time,
    isAvailable: getAvailableTables(time).length > 0 && isTimeAtLeastOneHourAhead(time),
  })), [getAvailableTables, isTimeAtLeastOneHourAhead]);

  const availableTables = useMemo(
    () => getAvailableTables(selectedTime),
    [getAvailableTables, selectedTime],
  );
  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) || null,
    [selectedTableId, tables],
  );

  useEffect(() => {
    if (selectedTableId && !availableTables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId('');
    }
  }, [availableTables, selectedTableId]);

  const validateReservation = useCallback(() => {
    const next = {};
    const today = localDateString();
    if (!selectedDate) next.date = 'Choose a reservation date.';
    else if (selectedDate < today) next.date = 'Reservation date cannot be in the past.';
    if (partySize < 1 || partySize > 12) next.partySize = 'Party size must be between 1 and 12.';
    if (!selectedTime) next.time = 'Choose an available time.';
    else if (!isTimeAtLeastOneHourAhead(selectedTime)) next.time = 'Please book at least one hour ahead.';
    else if (getAvailableTables(selectedTime).length === 0) next.time = 'No suitable table is available at this time.';
    if (!selectedTableId) next.table = 'Choose a table for your party.';
    else if (!availableTables.some((table) => table.id === selectedTableId)) next.table = 'That table is no longer available.';
    if (!contactName.trim()) next.contactName = 'Enter the booking name.';
    if (!/^03\d{2}-\d{7}$/.test(phone)) next.phone = 'Use Pakistan mobile format 03XX-XXXXXXX.';
    setErrors(next);
    return next;
  }, [
    availableTables, contactName, getAvailableTables, isTimeAtLeastOneHourAhead,
    partySize, phone, selectedDate, selectedTableId, selectedTime,
  ]);

  const createReservation = useCallback(async () => {
    if (isSubmitting) return { ok: false, errors: {} };
    const validationErrors = validateReservation();
    if (Object.keys(validationErrors).length > 0) {
      return { ok: false, errors: validationErrors };
    }
    setIsSubmitting(true);
    try {
      const created = await addReservation({ date: selectedDate, time: selectedTime, partySize,
        tableId: selectedTable.id, contactName: contactName.trim(), phone });
      setSelectedTimeState(''); setSelectedTableId(''); setErrors({});
      await refetch();
      return { ok: true, reservation: created };
    } catch (failure) {
      if (failure.status === 409) await refetch();
      setErrors({ server: failure.message });
      return { ok: false, errors: { server: failure.message } };
    } finally { setIsSubmitting(false); }
  }, [addReservation, contactName, isSubmitting, partySize, phone, refetch, selectedDate, selectedTable,
    selectedTime, validateReservation]);

  const cancelReservation = useCallback(
    (id) => cancelStoredReservation(id),
    [cancelStoredReservation],
  );

  const selectTable = useCallback((id) => {
    setSelectedTableId(id);
    clearError('table');
  }, [clearError]);

  return {
    loading, error, refetch, isSubmitting,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    partySize,
    setPartySize,
    selectedTable,
    selectedTableId,
    selectTable,
    contactName,
    setContactName,
    phone,
    setPhone,
    availability,
    availableTables,
    reservations,
    errors,
    validateReservation,
    createReservation,
    cancelReservation,
  };
}
