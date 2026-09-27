import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState,
} from 'react';
import { ordersReducer } from '../reducers/ordersReducer';

const ORDERS_KEY = '@urbanfork_orders';
const OrdersContext = createContext(null);

function automaticStatus(elapsedSeconds) {
  if (elapsedSeconds >= 30) return 'Served';
  if (elapsedSeconds >= 20) return 'Ready';
  if (elapsedSeconds >= 10) return 'Preparing';
  return 'Pending';
}

export function OrdersProvider({ children }) {
  const [orders, dispatch] = useReducer(ordersReducer, []);
  const [isHydrated, setIsHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(ORDERS_KEY);
        if (!active) return;
        let parsed = [];
        try {
          if (stored) parsed = JSON.parse(stored);
        } catch {
          parsed = [];
        }
        dispatch({ type: 'LOAD_ORDERS', payload: Array.isArray(parsed) ? parsed : [] });
      } catch {
        if (active) dispatch({ type: 'LOAD_ORDERS', payload: [] });
      } finally {
        if (active) setIsHydrated(true);
      }
    }
    hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders)).catch(() => {});
  }, [isHydrated, orders]);

  useEffect(() => {
    if (!isHydrated) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    orders.forEach((order) => {
      if (order.status === 'Cancelled' || order.status === 'Served') return;
      const elapsed = Math.max(0, Math.floor((now - new Date(order.timestamp).getTime()) / 1000));
      dispatch({
        type: 'UPDATE_STATUS',
        payload: { id: order.id, status: automaticStatus(elapsed), manual: false },
      });
    });
  }, [isHydrated, now, orders]);

  const createOrder = useCallback((details) => {
    const timestamp = new Date().toISOString();
    const created = {
      ...details,
      id: `UF-${Date.now().toString().slice(-7)}`,
      status: 'Pending',
      timestamp,
    };
    dispatch({ type: 'CREATE_ORDER', payload: created });
    return created;
  }, []);

  const updateStatus = useCallback((id, status, manual = true) => {
    dispatch({ type: 'UPDATE_STATUS', payload: { id, status, manual } });
  }, []);

  const value = useMemo(() => ({
    orders, createOrder, updateStatus, isHydrated, now,
  }), [createOrder, isHydrated, now, orders, updateStatus]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const value = useContext(OrdersContext);
  if (!value) throw new Error('useOrders must be used inside an OrdersProvider.');
  return value;
}
