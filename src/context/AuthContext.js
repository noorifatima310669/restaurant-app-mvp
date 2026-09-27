import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { mockUsers } from '../data/users';

const AuthContext = createContext(null);

function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const sessionUsers = useRef([...mockUsers]);

  const login = useCallback((email, password) => {
    const match = sessionUsers.current.find(
      (entry) => entry.email.toLowerCase() === email.trim().toLowerCase() && entry.password === password,
    );
    if (!match) return null;
    const authenticatedUser = publicUser(match);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const signup = useCallback((details) => {
    const exists = sessionUsers.current.some(
      (entry) => entry.email.toLowerCase() === details.email.trim().toLowerCase(),
    );
    if (exists) return null;
    const created = {
      id: `session-${Date.now()}`,
      name: details.fullName.trim(),
      email: details.email.trim().toLowerCase(),
      password: details.password,
      role: details.role,
    };
    sessionUsers.current.push(created);
    const authenticatedUser = publicUser(created);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const logout = useCallback(() => setUser(null), []);
  const value = useMemo(() => ({ user, login, signup, logout }), [login, logout, signup, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside an AuthProvider.');
  return value;
}
