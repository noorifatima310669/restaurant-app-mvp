import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { normalizeUser } from '../api/normalize';
import { createSessionStore } from '../api/session';
const AuthContext = createContext(null);
const store = createSessionStore(AsyncStorage);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await store.restore();
        if (!stored || !active) return;
        api.setToken(stored.token);
        let restoredUser = stored.user;
        try { restoredUser = (await api.request('/auth/me')).user; }
        catch (error) {
          if (error.status === 401) { api.setToken(null); await store.clear(); return; }
          // Retain saved session when offline; live screens still show network errors.
        }
        if (active) { setToken(stored.token); setUser(normalizeUser(restoredUser)); }
      } catch { api.setToken(null); }
      finally { if (active) setIsHydrated(true); }
    })();
    return () => { active = false; };
  }, []);
  const establish = useCallback(async session => {
    await store.save(session);
    api.setToken(session.token); setToken(session.token);
    const authenticated = normalizeUser(session.user); setUser(authenticated); return authenticated;
  }, []);
  const login = useCallback(async (email, password) => establish(await api.request('/auth/login', {
    method: 'POST', body: { email: email.trim(), password }, auth: false,
  })), [establish]);
  const signup = useCallback(async details => establish(await api.request('/auth/register', {
    method: 'POST', body: { name: details.fullName.trim(), email: details.email.trim(), password: details.password }, auth: false,
  })), [establish]);
  const logout = useCallback(async () => {
    // Remove persisted session before returning to Login, so restart cannot restore a logged-out user.
    await store.clear(); api.setToken(null); setToken(null); setUser(null);
  }, []);
  const value = useMemo(() => ({ user, token, isHydrated, login, signup, logout }), [user, token, isHydrated, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider.');
  return value;
}
