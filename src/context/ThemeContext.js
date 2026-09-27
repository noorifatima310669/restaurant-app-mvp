import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkColors, lightColors } from '../theme/colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const value = useMemo(() => ({
    isDark,
    colors: isDark ? darkColors : lightColors,
    toggleTheme: () => setIsDark((current) => !current),
  }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside a ThemeProvider.');
  return value;
}
