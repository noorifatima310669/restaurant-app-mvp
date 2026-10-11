const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');
const React = require('react');
const { act, create } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const values = new Map();
const storage = { getItem: async key => values.get(key) || null,
  setItem: async (key, value) => { values.set(key, value); }, removeItem: async key => { values.delete(key); } };
const originalLoad = Module._load;
Module._load = function(id, parent, isMain) {
  if (id === '@react-native-async-storage/async-storage') return { __esModule: true, default: storage };
  if (id === 'react-native') return new Proxy({ StyleSheet: { create: styles => styles }, Platform: { OS: 'android' }, Alert: { alert() {} } }, { get: (obj, key) => key in obj ? obj[key] : String(key) });
  if (id === '@expo/vector-icons') return { Ionicons: 'Ionicons' };
  if (id.endsWith('/ThemeContext')) return { useTheme: () => ({ colors: {}, isDark: false }) };
  return originalLoad.call(this, id, parent, isMain);
};
require.extensions['.png'] = module => { module.exports = 1; };
const originalJs = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
  if (!filename.startsWith(path.resolve('src') + path.sep)) return originalJs(module, filename);
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-modules-commonjs', ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
  });
  module._compile(code, filename);
};
const { api, createApiClient } = require('../src/api/client');
const { createSessionStore, SESSION_KEY } = require('../src/api/session');
const { AuthProvider, useAuth } = require('../src/context/AuthContext');
const { RestaurantProvider, useRestaurant } = require('../src/context/RestaurantContext');
const { OrdersProvider, useOrders } = require('../src/context/OrdersContext');
const { CartProvider, useCart } = require('../src/context/CartContext');
const { useApi } = require('../src/hooks/useApi');
const OrdersScreen = require('../src/screens/OrdersScreen').default;
const { ordersReducer } = require('../src/reducers/ordersReducer');
const { cartReducer, initialCartState } = require('../src/reducers/cartReducer');
const user = { _id: '507f1f77bcf86cd799439011', name: 'Ayaan', email: 'customer@urbanfork.com', role: 'customer' };
const session = { token: 'test-token-only', user };
const liveMenu = [{ _id: '507f1f77bcf86cd799439012', name: 'Server Dish', price: 700, description: 'Server description', category: 'Mains', isAvailable: true }];
let observed, renderer;
const realRequest = api.request;
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => data === undefined ? '' : JSON.stringify(data) });
function Capture() { observed = { auth: useAuth(), restaurant: useRestaurant(), orders: useOrders(), cart: useCart() }; return null; }
async function mount(child = null) {
  await act(async () => {
    renderer = create(React.createElement(AuthProvider, null,
      React.createElement(RestaurantProvider, null,
        React.createElement(OrdersProvider, null,
          React.createElement(CartProvider, null, React.createElement(Capture), child)))));
  });
}
async function unmount() { if (renderer) { await act(async () => renderer.unmount()); renderer = null; } }
beforeEach(async () => { await unmount(); values.clear(); api.setToken(null); api.request = realRequest; observed = null; });

test('Q6 API sends JSON and Bearer token', async () => {
  let captured; const client = createApiClient(async (url, options) => { captured = { url, options }; return response({ ok: true }); });
  client.setToken('test-token'); await client.request('/menu', { method: 'POST', body: { name: 'Dish' } });
  assert.ok(captured.url.endsWith('/api/menu')); assert.equal(captured.options.headers.Authorization, 'Bearer test-token');
  assert.equal(captured.options.headers['Content-Type'], 'application/json'); assert.deepEqual(JSON.parse(captured.options.body), { name: 'Dish' });
});
test('Q6 public auth does not send previous token', async () => { let headers; const client = createApiClient(async (_url, options) => { headers = options.headers; return response({}); }); client.setToken('old'); await client.request('/auth/login', { auth: false }); assert.equal(headers.Authorization, undefined); });
test('Q6 API throws server message and HTTP status', async () => { const client = createApiClient(async () => response({ message: 'Table occupied' }, 409)); await assert.rejects(client.request('/reservations'), error => error.message === 'Table occupied' && error.status === 409); });
test('Q6 API safely rejects malformed responses', async () => { const client = createApiClient(async () => ({ ok: true, status: 200, text: async () => '<html>Bad response</html>' })); await assert.rejects(client.request('/menu'), /invalid response/); });
test('Q6 API accepts empty successful response', async () => { const client = createApiClient(async () => response(undefined, 204)); assert.equal(await client.request('/menu'), null); });
test('Q6 API reports network failure clearly', async () => { const client = createApiClient(async () => { throw new TypeError('Failed to fetch'); }); await assert.rejects(client.request('/menu'), /Cannot reach the restaurant server/); });
test('Q6 API handles cancellation', async () => { const client = createApiClient(async () => { const error = new Error(); error.name = 'AbortError'; throw error; }); await assert.rejects(client.request('/menu'), /timed out or was cancelled/); });
test('Q6 session store persists user and token', async () => { const store = createSessionStore(storage); await store.save(session); assert.deepEqual(await store.restore(), session); });
test('Q6 session store clears persisted credentials', async () => { const store = createSessionStore(storage); await store.save(session); await store.clear(); assert.equal(await store.restore(), null); assert.equal(values.size, 0); });
test('Q6 malformed stored session is discarded', async () => { values.set(SESSION_KEY, '{bad'); assert.equal(await createSessionStore(storage).restore(), null); assert.equal(values.size, 0); });
test('Q6 missing or invalid stored user is discarded', async () => { values.set(SESSION_KEY, JSON.stringify({ token: 'x', user: { role: 'admin' } })); assert.equal(await createSessionStore(storage).restore(), null); });
test('Q6 AuthContext login calls API, persists and exposes normalized user', async () => {
  let call; api.request = async (endpoint, options) => { call = { endpoint, options }; return session; };
  await mount(); await act(async () => { await observed.auth.login(' customer@urbanfork.com ', 'Urban123'); });
  assert.equal(call.endpoint, '/auth/login'); assert.equal(call.options.body.email, user.email);
  assert.equal(observed.auth.user.id, user._id); assert.equal(observed.auth.token, session.token); assert.equal(api.getToken(), session.token);
  assert.deepEqual(JSON.parse(values.get(SESSION_KEY)), session); await unmount();
});
test('Q6 AuthContext restores session on app startup', async () => {
  values.set(SESSION_KEY, JSON.stringify(session)); api.request = async endpoint => { assert.equal(endpoint, '/auth/me'); return { user }; };
  await mount(); assert.equal(observed.auth.user.id, user._id); assert.equal(observed.auth.isHydrated, true); assert.equal(api.getToken(), session.token); await unmount();
});
test('Q6 expired stored session is cleared', async () => {
  values.set(SESSION_KEY, JSON.stringify(session)); api.request = async () => { const error = new Error('expired'); error.status = 401; throw error; };
  await mount(); assert.equal(observed.auth.user, null); assert.equal(api.getToken(), null); assert.equal(values.size, 0); await unmount();
});
test('Q6 logout clears memory, Bearer token and storage', async () => {
  api.request = async () => session; await mount(); await act(async () => { await observed.auth.login(user.email, 'Urban123'); });
  await act(async () => { await observed.auth.logout(); }); assert.equal(observed.auth.user, null); assert.equal(observed.auth.token, null); assert.equal(api.getToken(), null); assert.equal(values.size, 0); await unmount();
});
test('Q6 signup always sends customer registration fields', async () => {
  let sent; api.request = async (endpoint, options) => { assert.equal(endpoint, '/auth/register'); sent = options.body; return session; };
  await mount(); await act(async () => { await observed.auth.signup({ fullName: ' New User ', email: 'new@example.com', password: 'Password123', role: 'manager' }); });
  assert.deepEqual(sent, { name: 'New User', email: 'new@example.com', password: 'Password123' }); await unmount();
});
test('Q6 failed authentication does not persist a session', async () => {
  api.request = async () => { throw new Error('Incorrect password'); }; await mount();
  await assert.rejects(observed.auth.login(user.email, 'Wrong1234'), /Incorrect password/); assert.equal(values.size, 0); assert.equal(observed.auth.user, null); await unmount();
});
test('Q6 menu context loads server records, ignoring old AsyncStorage menu', async () => {
  values.set('@urbanfork_menu', JSON.stringify([{ name: 'Old local menu', price: 1 }])); api.request = async endpoint => { assert.equal(endpoint, '/menu'); return liveMenu; };
  await mount(); await act(async () => { await observed.restaurant.refreshMenu(); });
  assert.equal(observed.restaurant.menuItems.length, 1); assert.equal(observed.restaurant.menuItems[0].price, 700);
  assert.equal(observed.restaurant.menuItems[0].name, 'Server Dish'); await unmount();
});
test('Q6 manager menu mutation refetches server data', async () => {
  const calls = []; api.request = async (endpoint, options) => { calls.push([endpoint, options?.method]); return endpoint === '/menu' ? [{ ...liveMenu[0], price: 800 }] : { ...liveMenu[0], price: 800 }; };
  await mount(); await act(async () => { await observed.restaurant.updateMenuItem(liveMenu[0]._id, { price: 800 }); });
  assert.deepEqual(calls.map(row => row[0]), [`/menu/${liveMenu[0]._id}`, '/menu']); assert.equal(observed.restaurant.menuItems[0].price, 800); await unmount();
});
test('Q6 useApi exposes error, retry and recovered data', async () => {
  let hook, fail = true; const loader = async () => { if (fail) throw new Error('Network offline'); return liveMenu; };
  function Screen() { hook = useApi(loader); return null; }
  await act(async () => { renderer = create(React.createElement(Screen)); }); assert.equal(hook.error, 'Network offline'); assert.equal(hook.loading, false);
  fail = false; await act(async () => { await hook.refetch(); }); assert.deepEqual(hook.data, liveMenu); assert.equal(hook.error, null); await unmount();
});
test('Q6 useApi ignores stale overlapping responses', async () => {
  let hook, resolveFirst, call = 0; const loader = () => ++call === 1 ? new Promise(resolve => { resolveFirst = resolve; }) : Promise.resolve('latest');
  function Screen() { hook = useApi(loader, { enabled: false }); return null; }
  await act(async () => { renderer = create(React.createElement(Screen)); }); let first;
  await act(async () => { first = hook.refetch(); }); await act(async () => { await hook.refetch(); });
  await act(async () => { resolveFirst('stale'); await first; }); assert.equal(hook.data, 'latest'); await unmount();
});
test('Q7 createOrder posts item ids, not client prices or total', async () => {
  let sent; const order = { _id: 'order-id', customer: user, items: [{ menuItem: liveMenu[0]._id, name: 'Server Dish', price: 700, quantity: 2 }], total: 1691, status: 'Pending', createdAt: new Date().toISOString() };
  api.request = async (endpoint, options) => endpoint === '/auth/login' ? session : (sent = { endpoint, options }, order);
  await mount(); await act(async () => { await observed.auth.login(user.email, 'Urban123'); });
  await act(async () => { await observed.orders.createOrder({ items: [{ id: liveMenu[0]._id, price: 1, quantity: 2 }], total: 1, type: 'Takeaway', pickupTime: 'In 20 minutes' }); });
  assert.equal(sent.endpoint, '/orders'); assert.equal(sent.options.body.total, undefined); assert.equal(sent.options.body.items[0].price, undefined); assert.equal(observed.orders.orders[0].total, 1691); await unmount();
});
test('Q7 failed order leaves orders unchanged', async () => {
  api.request = async endpoint => { if (endpoint === '/auth/login') return session; throw new Error('Unavailable item'); };
  await mount(); await act(async () => { await observed.auth.login(user.email, 'Urban123'); });
  await assert.rejects(observed.orders.createOrder({ items: [], type: 'Takeaway' }), /Unavailable item/); assert.deepEqual(observed.orders.orders, []); await unmount();
});
test('Q7 OrdersScreen fetches immediately, polls exactly 10000ms and cleans up', async () => {
  values.set(SESSION_KEY, JSON.stringify(session)); let fetches = 0, status = 'Pending';
  api.request = async endpoint => endpoint === '/auth/me' ? { user } : (fetches++, [{ _id: 'order-id', customer: user,
    items: [], total: 10, type: 'Takeaway', pickupTime: 'In 20 minutes', status, createdAt: new Date().toISOString() }]);
  const savedSet = global.setInterval, savedClear = global.clearInterval; let callback, delay, cleared;
  global.setInterval = (fn, ms) => { callback = fn; delay = ms; return 98765; };
  global.clearInterval = id => { cleared = id; };
  function AuthenticatedOrders() { return useAuth().user ? React.createElement(OrdersScreen, { navigation: {} }) : null; }
  try {
    await mount(React.createElement(AuthenticatedOrders)); assert.equal(delay, 10000); assert.equal(fetches, 1); assert.equal(observed.orders.orders[0].status, 'Pending');
    status = 'Preparing'; await act(async () => { callback(); }); assert.equal(fetches, 2); assert.equal(observed.orders.orders[0].status, 'Preparing');
    await unmount(); assert.equal(cleared, 98765);
  } finally { global.setInterval = savedSet; global.clearInterval = savedClear; }
});
test('A1 cart reducer preserves quantities, notes and promos', () => {
  let state = cartReducer(initialCartState, { type: 'ADD_ITEM', payload: { id: 'a', name: 'Dish', price: 10 } });
  state = cartReducer(state, { type: 'ADD_ITEM', payload: { id: 'a', name: 'Dish', price: 10 } }); assert.equal(state.items[0].quantity, 2);
  state = cartReducer(state, { type: 'UPDATE_NOTE', payload: { id: 'a', note: 'Less spicy' } }); assert.equal(state.items[0].note, 'Less spicy');
  state = cartReducer(state, { type: 'APPLY_PROMO', payload: { code: 'URBAN10', percent: 10 } }); assert.equal(state.discountPercent, 10);
  assert.deepEqual(cartReducer(state, { type: 'CLEAR_CART' }), initialCartState);
});
test('A1 order reducer still loads authoritative server results', () => { const rows = [{ id: 'a', status: 'Preparing' }]; assert.deepEqual(ordersReducer([], { type: 'LOAD_ORDERS', payload: rows }), rows); });

function pressableWithText(label) {
  let node = renderer.root.findAllByType('Text').find(entry => entry.props.children === label);
  assert.ok(node, `Text control exists: ${label}`);
  while (node && node.type !== 'Pressable') node = node.parent;
  assert.ok(node); return node;
}
async function setupCheckout(fail) {
  values.set(SESSION_KEY, JSON.stringify(session));
  api.request = async endpoint => {
    if (endpoint === '/auth/me') return { user };
    if (endpoint === '/tables') return [];
    assert.equal(endpoint, '/orders');
    if (fail) throw new Error('Menu item is unavailable');
    return { _id: 'server-order', customer: user, items: [{ menuItem: liveMenu[0]._id, name: 'Server Dish', price: 700, quantity: 1 }], total: 845, status: 'Pending', createdAt: new Date().toISOString() };
  };
  const Summary = require('../src/screens/OrderSummaryScreen').default;
  function Checkout() { return useAuth().user ? React.createElement(Summary, { navigation: {} }) : null; }
  await mount(React.createElement(Checkout));
  await act(async () => { observed.cart.dispatch({ type: 'ADD_ITEM', payload: { id: liveMenu[0]._id, name: 'Dish', price: 1 } }); });
  await act(async () => { pressableWithText('Takeaway').props.onPress(); });
  await act(async () => { pressableWithText('In 20 minutes').props.onPress(); });
}
test('Q7 existing checkout UI retains cart on server failure', async () => {
  await setupCheckout(true);
  const button = renderer.root.findAllByType('Pressable').find(node => node.props.onPress?.name === 'placeOrder');
  await act(async () => { await button.props.onPress(); });
  assert.equal(observed.cart.state.items.length, 1); assert.deepEqual(observed.orders.orders, []); await unmount();
});
test('Q7 existing checkout UI clears cart only after server success', async () => {
  await setupCheckout(false);
  const button = renderer.root.findAllByType('Pressable').find(node => node.props.onPress?.name === 'placeOrder');
  await act(async () => { await button.props.onPress(); });
  assert.equal(observed.cart.state.items.length, 0); assert.equal(observed.orders.orders[0].total, 845); await unmount();
});
test('Q7 useReservation preserves frontend validation and posts server booking', async () => {
  const { useReservation } = require('../src/hooks/useReservation'); let reservation, sent;
  const table = { _id: '507f1f77bcf86cd799439013', name: 'Window Two', seats: 2, code: 'T01', area: 'Window' };
  const date = new Date(Date.now() + 2*86400000).toISOString().slice(0,10);
  values.set(SESSION_KEY, JSON.stringify(session));
  api.request = async (endpoint, options) => {
    if (endpoint === '/auth/me') return { user };
    if (endpoint.startsWith('/tables')) return [table];
    if (endpoint === '/reservations/my') return [];
    assert.equal(endpoint, '/reservations'); sent = options.body;
    return { _id: 'booking-id', ...sent, table: table._id, tableName: table.name, customer: user._id, status: 'Pending' };
  };
  function Booking() { reservation = useReservation(); return null; }
  function AuthenticatedBooking() { return useAuth().user ? React.createElement(Booking) : null; }
  await mount(React.createElement(AuthenticatedBooking));
  await act(async () => { reservation.setSelectedDate(date); });
  await act(async () => { reservation.setSelectedTime('19:00'); reservation.setContactName('Ayaan'); });
  await act(async () => { reservation.selectTable(table._id); reservation.setPhone('invalid'); });
  let errors; await act(async () => { errors = reservation.validateReservation(); }); assert.match(errors.phone, /03XX/);
  await act(async () => { reservation.setPhone('0300-1234567'); });
  let result; await act(async () => { result = await reservation.createReservation(); });
  assert.equal(result.ok, true); assert.equal(sent.tableId, table._id); assert.equal(sent.date, date); assert.equal(sent.customerId, undefined); await unmount();
});
