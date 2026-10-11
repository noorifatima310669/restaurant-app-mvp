import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoadingScreen from './src/components/LoadingScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { OrdersProvider, useOrders } from './src/context/OrdersContext';
import { RestaurantProvider, useRestaurant } from './src/context/RestaurantContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function HydratedApp() {
  const { isHydrated: authReady, token } = useAuth();
  const { isHydrated: restaurantReady } = useRestaurant();
  const { isHydrated: ordersReady } = useOrders();
  const { isDark, colors } = useTheme();
  if (!authReady || !restaurantReady || !ordersReady) return <LoadingScreen message="Restoring your Urban Fork experience…" />;
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <CartProvider key={token || 'guest'}>
        <AppNavigator />
      </CartProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RestaurantProvider>
            <OrdersProvider>
              <HydratedApp />
            </OrdersProvider>
          </RestaurantProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
