import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { normalizeMenu, normalizeReservation, normalizeTable } from '../api/normalize';
import { useAuth } from './AuthContext';
const RestaurantContext = createContext(null);
export function RestaurantProvider({ children }) {
  const { token, user } = useAuth();
  const identity = useRef(token); identity.current = token;
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  useEffect(() => { setMenuItems([]); setTables([]); setReservations([]); }, [token]);
  const refreshMenu = useCallback(async () => {
    const current = identity.current;
    const items = (await api.request('/menu')).map(normalizeMenu);
    if (identity.current === current) setMenuItems(items);
    return items;
  }, []);
  const refreshTables = useCallback(async () => {
    const current = identity.current;
    const items = (await api.request('/tables')).map(normalizeTable);
    if (identity.current === current) setTables(items);
    return items;
  }, []);
  const refreshReservations = useCallback(async () => {
    if (!token) return [];
    const items = (await api.request(user.role === 'manager' ? '/reservations' : '/reservations/my')).map(normalizeReservation);
    if (identity.current === token) setReservations(items);
    return items;
  }, [token, user?.role]);
  const updateMenuItem = useCallback(async (id, changes) => {
    const item = await api.request(`/menu/${id}`, { method: 'PUT', body: changes });
    await refreshMenu(); return normalizeMenu(item);
  }, [refreshMenu]);
  const addMenuItem = useCallback(async item => {
    const created = await api.request('/menu', { method: 'POST', body: item });
    await refreshMenu(); return normalizeMenu(created);
  }, [refreshMenu]);
  const addReservation = useCallback(async details => {
    const created = normalizeReservation(await api.request('/reservations', { method: 'POST', body: details }));
    if (identity.current === token) setReservations(current => [created, ...current]);
    return created;
  }, [token]);
  const cancelReservation = useCallback(async id => {
    await api.request(`/reservations/${id}/cancel`, { method: 'PATCH' }); await refreshReservations();
  }, [refreshReservations]);
  const updateReservationStatus = useCallback(async (id, status) => {
    await api.request(`/reservations/${id}`, { method: 'PATCH', body: { status } }); await refreshReservations();
  }, [refreshReservations]);
  const value = useMemo(() => ({ menuItems, tables, reservations, isHydrated: true, refreshMenu, refreshTables,
    refreshReservations, updateMenuItem, addMenuItem, addReservation, cancelReservation, updateReservationStatus }),
  [menuItems, tables, reservations, refreshMenu, refreshTables, refreshReservations, updateMenuItem, addMenuItem,
    addReservation, cancelReservation, updateReservationStatus]);
  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}
export function useRestaurant() {
  const value = useContext(RestaurantContext);
  if (!value) throw new Error('useRestaurant must be used inside a RestaurantProvider.');
  return value;
}
