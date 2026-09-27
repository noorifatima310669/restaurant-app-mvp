import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import CartScreen from '../screens/CartScreen';
import LoginScreen from '../screens/LoginScreen';
import ManagerDashboardScreen from '../screens/ManagerDashboardScreen';
import MenuScreen from '../screens/MenuScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReservationScreen from '../screens/ReservationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function stackOptions(colors) {
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '800' },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

function MenuStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(colors)}>
      <Stack.Screen name="MenuHome" component={MenuScreen} options={{ title: 'Menu' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(colors)}>
      <Stack.Screen name="CartHome" component={CartScreen} options={{ title: 'Your cart' }} />
      <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ title: 'Order summary' }} />
    </Stack.Navigator>
  );
}

function ReservationStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(colors)}>
      <Stack.Screen name="ReservationHome" component={ReservationScreen} options={{ title: 'Reserve a table' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(colors)}>
      <Stack.Screen name="OrdersHome" component={OrdersScreen} options={{ title: 'Your orders' }} />
    </Stack.Navigator>
  );
}

const TAB_ICONS = {
  Menu: ['restaurant', 'restaurant-outline'],
  Cart: ['basket', 'basket-outline'],
  Reserve: ['calendar', 'calendar-outline'],
  Orders: ['receipt', 'receipt-outline'],
  Dashboard: ['grid', 'grid-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

function CustomerTabs() {
  const { colors } = useTheme();
  const { totalItems } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Menu" component={MenuStack} />
      <Tab.Screen name="Cart" component={CartStack} options={{ tabBarBadge: totalItems || undefined, tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.primaryDark, fontWeight: '900' } }} />
      <Tab.Screen name="Reserve" component={ReservationStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function ManagerTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 7,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={ManagerDashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      {!user ? <LoginScreen /> : user.role === 'manager' ? <ManagerTabs /> : <CustomerTabs />}
    </NavigationContainer>
  );
}
