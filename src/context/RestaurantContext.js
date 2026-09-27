import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { menuItems as defaultMenu } from '../data/menu';

const MENU_KEY = '@urbanfork_menu';
const RESERVATIONS_KEY = '@urbanfork_reservations';
const RestaurantContext = createContext(null);
const fallbackImage = require('../../assets/menu/truffle-parmesan-fries.png');

function restoreMenuImages(items) {
  return items.map((item) => ({
    ...item,
    image: defaultMenu.find((entry) => entry.id === item.id)?.image || fallbackImage,
  }));
}

export function RestaurantProvider({ children }) {
  const [menuItems, setMenuItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const [storedMenu, storedReservations] = await Promise.all([
          AsyncStorage.getItem(MENU_KEY),
          AsyncStorage.getItem(RESERVATIONS_KEY),
        ]);
        if (!active) return;
        let parsedMenu = defaultMenu;
        let parsedReservations = [];
        try {
          if (storedMenu) parsedMenu = restoreMenuImages(JSON.parse(storedMenu));
        } catch {
          parsedMenu = defaultMenu;
        }
        try {
          if (storedReservations) parsedReservations = JSON.parse(storedReservations);
        } catch {
          parsedReservations = [];
        }
        setMenuItems(parsedMenu);
        setReservations(Array.isArray(parsedReservations) ? parsedReservations : []);
      } catch {
        if (active) {
          setMenuItems(defaultMenu);
          setReservations([]);
        }
      } finally {
        if (active) setIsHydrated(true);
      }
    }
    hydrate();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const serializableMenu = menuItems.map(({ image, ...item }) => item);
    AsyncStorage.setItem(MENU_KEY, JSON.stringify(serializableMenu)).catch(() => {});
  }, [isHydrated, menuItems]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations)).catch(() => {});
  }, [isHydrated, reservations]);

  const updateMenuItem = useCallback((id, changes) => {
    setMenuItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }, []);

  const addMenuItem = useCallback((item) => {
    setMenuItems((current) => [{
      ...item,
      id: `manager-${Date.now()}`,
      image: fallbackImage,
      isSpecial: false,
      isAvailable: true,
    }, ...current]);
  }, []);

  const addReservation = useCallback((reservation) => {
    const created = {
      ...reservation,
      id: `UF-R-${Date.now().toString().slice(-7)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setReservations((current) => [created, ...current]);
    return created;
  }, []);

  const cancelReservation = useCallback((id) => {
    setReservations((current) => current.map((item) => (
      item.id === id ? { ...item, status: 'Cancelled' } : item
    )));
  }, []);

  const updateReservationStatus = useCallback((id, status) => {
    setReservations((current) => current.map((item) => (
      item.id === id ? { ...item, status } : item
    )));
  }, []);

  const value = useMemo(() => ({
    menuItems,
    reservations,
    isHydrated,
    updateMenuItem,
    addMenuItem,
    addReservation,
    cancelReservation,
    updateReservationStatus,
  }), [
    addMenuItem, addReservation, cancelReservation, isHydrated, menuItems,
    reservations, updateMenuItem, updateReservationStatus,
  ]);

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const value = useContext(RestaurantContext);
  if (!value) throw new Error('useRestaurant must be used inside a RestaurantProvider.');
  return value;
}
