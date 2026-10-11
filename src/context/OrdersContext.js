import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { api } from '../api/client';
import { normalizeOrder } from '../api/normalize';
import { ordersReducer } from '../reducers/ordersReducer';
import { useAuth } from './AuthContext';
const OrdersContext = createContext(null);
export function OrdersProvider({ children }) {
  const { token, user } = useAuth();
  const identity = useRef(token); identity.current = token;
  const [orders, dispatch] = useReducer(ordersReducer, []);
  useEffect(() => { dispatch({ type: 'LOAD_ORDERS', payload: [] }); }, [token]);
  const refreshOrders = useCallback(async () => {
    if (!token) return [];
    const data = (await api.request(user.role === 'manager' ? '/orders' : '/orders/my')).map(normalizeOrder);
    if (identity.current === token) dispatch({ type: 'LOAD_ORDERS', payload: data });
    return data;
  }, [token, user?.role]);
  const createOrder = useCallback(async details => {
    const created = normalizeOrder(await api.request('/orders', { method: 'POST', body: {
      items: details.items.map(item => ({ menuItem: item.id, quantity: item.quantity, note: item.note || '' })),
      type: details.type, tableId: details.tableId, pickupTime: details.pickupTime, promoCode: details.promoCode,
    } }));
    if (identity.current === token) dispatch({ type: 'CREATE_ORDER', payload: created });
    return created;
  }, [token]);
  const updateStatus = useCallback(async (id, status) => {
    await api.request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }); await refreshOrders();
  }, [refreshOrders]);
  const value = useMemo(() => ({ orders, refreshOrders, createOrder, updateStatus, isHydrated: true }),
    [orders, refreshOrders, createOrder, updateStatus]);
  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
export function useOrders() {
  const value = useContext(OrdersContext);
  if (!value) throw new Error('useOrders must be used inside an OrdersProvider.');
  return value;
}
