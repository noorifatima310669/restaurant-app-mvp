const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const { seed, seedData } = require('../seed');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
let mongo, customer, manager, second, item, table;
const missing = new mongoose.Types.ObjectId().toString();
const menuInput = { name: 'Test Soup', description: 'Fresh test soup', price: 500, category: 'Starters' };
const auth = (req, session) => req.set('Authorization', `Bearer ${session.token}`);
const get = (path, session) => session ? auth(request(app).get(path), session) : request(app).get(path);
const post = (path, body, session) => (session ? auth(request(app).post(path), session) : request(app).post(path)).send(body);
const patch = (path, body, session) => auth(request(app).patch(path), session).send(body);
const put = (id, body, session = manager) => auth(request(app).put(`/api/menu/${id}`), session).send(body);
const remove = (id, session = manager) => auth(request(app).delete(`/api/menu/${id}`), session);
const orderBody = (extra = {}) => ({ items: [{ menuItem: item.id, quantity: 2 }], type: 'Takeaway', pickupTime: 'In 20 minutes', ...extra });
const tomorrow = () => new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
const booking = (extra = {}) => ({ tableId: table.id, date: tomorrow(), time: '19:00', partySize: 2, contactName: 'Ayaan', phone: '0300-1234567', ...extra });
async function createOrder(extra) { return (await post('/api/orders', orderBody(extra), customer).expect(201)).body; }
async function createBooking(extra, session = customer) { return (await post('/api/reservations', booking(extra), session).expect(201)).body; }
before(async () => {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  mongo = await MongoMemoryServer.create({ binary: { version: process.env.MONGOMS_VERSION || '8.2.6' } });
  await mongoose.connect(mongo.getUri('urbanfork_tests'));
  await seed();
  customer = (await post('/api/auth/login', { email: 'customer@urbanfork.com', password: 'Urban123' }).expect(200)).body;
  manager = (await post('/api/auth/login', { email: 'manager@urbanfork.com', password: 'Manager123' }).expect(200)).body;
  second = (await post('/api/auth/register', { name: 'Other Customer', email: 'other@example.com', password: 'Customer123' }).expect(201)).body;
  item = await MenuItem.findOne({ legacyId: 'starter-1' });
  table = await Table.findOne({ code: 'T01' });
}, { timeout: 180000 });
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
beforeEach(async () => {
  await Promise.all([Order.deleteMany({}), Reservation.deleteMany({}), MenuItem.deleteMany({ legacyId: { $exists: false } })]);
  await MenuItem.updateOne({ _id: item._id }, { $set: { price: 895, isAvailable: true } });
});

test('Q2 health returns ok and current ISO time', async () => {
  const result = await get('/api/health').expect(200); assert.equal(result.body.status, 'ok');
  assert.ok(Math.abs(Date.now() - Date.parse(result.body.time)) < 10000);
});
test('Q2 unknown routes return exact JSON 404', async () => { assert.deepEqual((await get('/not-found').expect(404)).body, { message: 'Route not found' }); });
test('Q2 CORS headers allow Expo web', async () => { assert.equal((await get('/api/health').set('Origin', 'http://localhost:8081').expect(200)).headers['access-control-allow-origin'], '*'); });
test('Q2 malformed JSON returns JSON 400', async () => { await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{').expect(400); });
test('Q2 final handler hides unexpected error details', async () => {
  const { errorHandler } = require('../middleware/errors'); let code, body;
  const log = console.error; console.error = () => {};
  try { errorHandler(new Error('private detail'), {}, { status: n => { code = n; return { json: value => { body = value; } }; } }, () => {}); }
  finally { console.error = log; }
  assert.equal(code, 500); assert.deepEqual(body, { message: 'Internal server error' });
});
test('Q3 seed preserves all 20 menu items and 7 A1 tables', async () => { assert.equal(await MenuItem.countDocuments(), 20); assert.equal(await Table.countDocuments(), 7); });
test('Q3 seed is idempotent and preserves manager edits', async () => {
  await MenuItem.updateOne({ _id: item._id }, { $set: { price: 1234 } }); await seed();
  assert.equal((await MenuItem.findById(item.id)).price, 1234); assert.equal(await MenuItem.countDocuments(), seedData.menu.length);
});
test('Q3 seeded passwords are bcrypt hashes', async () => {
  const user = await User.findOne({ email: 'manager@urbanfork.com' }).select('+password');
  assert.notEqual(user.password, 'Manager123'); assert.ok(await bcrypt.compare('Manager123', user.password));
});
test('Q3 models reject invalid role, seats and order status', async () => {
  await assert.rejects(new User({ name: 'XX', email: 'a@b.c', password: 'hash', role: 'admin' }).validate());
  await assert.rejects(new Table({ code: 'bad', name: 'bad', seats: 0, area: 'bad' }).validate());
  await assert.rejects(new Order({ status: 'Unknown' }).validate());
});
test('Q4 public menu list loads MongoDB records', async () => { assert.equal((await get('/api/menu').expect(200)).body.length, 20); });
test('Q4 category filter', async () => { const rows = (await get('/api/menu?category=Drinks').expect(200)).body; assert.equal(rows.length, 5); assert.ok(rows.every(row => row.category === 'Drinks')); });
test('Q4 case-insensitive search', async () => { assert.equal((await get('/api/menu?search=mInT').expect(200)).body[0].name, 'Mint Citrus Cooler'); });
test('Q4 filters work together', async () => { assert.equal((await get('/api/menu?category=Drinks&search=mint').expect(200)).body.length, 1); assert.equal((await get('/api/menu?category=Mains&search=mint').expect(200)).body.length, 0); });
test('Q4 search treats regex characters literally', async () => { assert.equal((await get('/api/menu?search=%2E%2A').expect(200)).body.length, 0); });
test('Q4 repeated search query values rejected', async () => { await get('/api/menu?search=a&search=b').expect(400); });
test('Q4 get existing item', async () => { assert.equal((await get(`/api/menu/${item.id}`).expect(200)).body._id, item.id); });
for (const [label, id, code] of [['invalid', 'invalid', 400], ['missing', missing, 404]]) {
  test(`Q4 GET ${label} id`, async () => { await get(`/api/menu/${id}`).expect(code); });
  test(`Q4 PUT ${label} id`, async () => { await put(id, { price: 100 }).expect(code); });
  test(`Q4 DELETE ${label} id`, async () => { await remove(id).expect(code); });
}
test('Q4 manager CRUD round trip', async () => {
  const created = (await post('/api/menu', menuInput, manager).expect(201)).body;
  assert.equal((await put(created._id, { price: 600 }).expect(200)).body.price, 600);
  await remove(created._id).expect(200); await get(`/api/menu/${created._id}`).expect(404);
});
for (const [label, changes] of [['missing name', { name: undefined }], ['negative price', { price: -1 }], ['missing price', { price: undefined }], ['invalid category', { category: 'Unknown' }], ['numeric name', { name: 2 }], ['string boolean', { isAvailable: 'false' }]]) {
  test(`Q4 POST rejects ${label}`, async () => { await post('/api/menu', { ...menuInput, ...changes }, manager).expect(400); });
}
test('Q4 PUT validators reject negative price and invalid category', async () => { await put(item.id, { price: -1 }).expect(400); await put(item.id, { category: 'Unknown' }).expect(400); assert.equal((await MenuItem.findById(item.id)).price, 895); });
test('Q4 mass assignment cannot change database id', async () => { const result = (await put(item.id, { _id: missing, price: 800 }).expect(200)).body; assert.equal(result._id, item.id); });
test('Q5 signup creates customer, hashes password and hides hash', async () => {
  const body = { name: 'New User', email: 'new@example.com', password: 'Password123' };
  const created = (await post('/api/auth/register', body).expect(201)).body;
  assert.equal(created.user.role, 'customer'); assert.ok(created.token); assert.equal(created.user.password, undefined);
  const stored = await User.findById(created.user._id).select('+password'); assert.ok(await bcrypt.compare(body.password, stored.password));
});
test('Q5 duplicate normalized email returns 409', async () => { await post('/api/auth/register', { name: 'Dup User', email: ' CUSTOMER@urbanfork.com ', password: 'Password123' }).expect(409); });
test('Q5 public manager signup rejected', async () => { await post('/api/auth/register', { name: 'Bad Manager', email: 'bad@example.com', password: 'Password123', role: 'manager' }).expect(400); });
for (const body of [{}, { email: 'bad', password: 'Password123' }, { name: 'Test', email: 't@example.com', password: 'short' }, { name: 'Test', email: 't@example.com', password: 'nodigitsplease' }]) {
  test(`Q5 invalid register ${JSON.stringify(body)}`, async () => { await post('/api/auth/register', body).expect(400); });
}
test('Q5 successful login JWT expires in exactly 86400 seconds', async () => { const payload = jwt.verify(customer.token, process.env.JWT_SECRET); assert.equal(payload.exp - payload.iat, 86400); assert.equal(customer.user.password, undefined); });
test('Q5 incorrect credentials return 401', async () => { await post('/api/auth/login', { email: 'customer@urbanfork.com', password: 'Wrong1234' }).expect(401); await post('/api/auth/login', { email: 'absent@example.com', password: 'Wrong1234' }).expect(401); });
test('Q5 invalid login input returns 400', async () => { await post('/api/auth/login', {}).expect(400); await post('/api/auth/login', { email: {}, password: [] }).expect(400); });
test('Q5 no token returns 401', async () => { await post('/api/menu', menuInput).expect(401); });
test('Q5 customer menu mutation returns 403', async () => { await post('/api/menu', menuInput, customer).expect(403); await put(item.id, { price: 5 }, customer).expect(403); await remove(item.id, customer).expect(403); });
test('Q5 manager creation returns 201', async () => { await post('/api/menu', menuInput, manager).expect(201); });
test('Q5 invalid and expired tokens return 401', async () => {
  await get('/api/auth/me', { token: 'invalid' }).expect(401);
  const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: customer.user._id, expiresIn: -1 });
  await get('/api/auth/me', { token: expired }).expect(401);
});
test('Q5 token for deleted user returns 401', async () => { const token = jwt.sign({}, process.env.JWT_SECRET, { subject: missing }); await get('/api/auth/me', { token }).expect(401); });
test('Q5 me hides password', async () => { const result = (await get('/api/auth/me', customer).expect(200)).body; assert.equal(result.user._id, customer.user._id); assert.equal(result.user.password, undefined); });
test('Q7 order database prices override forged client totals', async () => {
  const order = await createOrder({ total: 1, subtotal: 1, status: 'Served', customer: manager.user._id, items: [{ menuItem: item.id, quantity: 2, price: 1, name: 'fake' }] });
  assert.equal(order.subtotal, 1790); assert.equal(order.total, Math.round(1790 * 1.05 * 1.15));
  assert.equal(order.items[0].price, 895); assert.equal(order.status, 'Pending'); assert.equal(order.customer._id, customer.user._id);
});
test('Q7 server promo matches A1 receipt policy', async () => { const order = await createOrder({ promoCode: 'URBAN10', discountPercent: 99 }); assert.equal(order.promoDiscount, 179); assert.equal(order.total, Math.round((1790 + 89.5 - 179) * 1.15)); });
test('Q7 server uses changed database price', async () => { await put(item.id, { price: 700 }).expect(200); assert.equal((await createOrder()).subtotal, 1400); });
test('Q7 unavailable item rejected', async () => { await put(item.id, { isAvailable: false }).expect(200); await post('/api/orders', orderBody(), customer).expect(400); assert.equal(await Order.countDocuments(), 0); });
for (const [label, input] of [['empty', { items: [] }], ['negative quantity', {}]]) {
  // This array is evaluated before setup, so dynamic ids are set inside the test below.
  test(`Q7 invalid ${label} rejected`, async () => { const extra = label === 'empty' ? input : { items: [{ menuItem: item.id, quantity: -1 }] }; await post('/api/orders', orderBody(extra), customer).expect(400); });
}
test('Q7 invalid, nonexistent, fractional and duplicate items rejected', async () => {
  for (const items of [[{ menuItem: 'bad', quantity: 1 }], [{ menuItem: missing, quantity: 1 }], [{ menuItem: item.id, quantity: 1.5 }], [{ menuItem: item.id, quantity: 1 }, { menuItem: item.id, quantity: 1 }]]) await post('/api/orders', orderBody({ items }), customer).expect(400);
});
test('Q7 invalid promo and order type rejected', async () => { await post('/api/orders', orderBody({ promoCode: 'FREE' }), customer).expect(400); await post('/api/orders', orderBody({ type: 'Delivery' }), customer).expect(400); });
test('Q7 dine-in validates database table', async () => { await post('/api/orders', orderBody({ type: 'Dine-in', tableId: missing }), customer).expect(400); const order = await createOrder({ type: 'Dine-in', tableId: table.id }); assert.equal(order.tableName, table.name); });
test('Q7 orders are customer-only and authentication required', async () => { await post('/api/orders', orderBody()).expect(401); await post('/api/orders', orderBody(), manager).expect(403); });
test('Q7 customer order ownership', async () => { const order = await createOrder(); assert.equal((await get('/api/orders/my', customer).expect(200)).body[0]._id, order._id); assert.deepEqual((await get('/api/orders/my', second).expect(200)).body, []); });
test('Q7 all orders and status mutations are manager-only', async () => { const order = await createOrder(); await get('/api/orders', customer).expect(403); await get('/api/orders', manager).expect(200); await patch(`/api/orders/${order._id}/status`, { status: 'Preparing' }, customer).expect(403); });
test('Q7 valid order transitions', async () => { const order = await createOrder(); for (const status of ['Preparing', 'Ready', 'Served']) assert.equal((await patch(`/api/orders/${order._id}/status`, { status }, manager).expect(200)).body.status, status); });
test('Q7 reject backward, skipped and terminal transitions', async () => {
  const order = await createOrder(); await patch(`/api/orders/${order._id}/status`, { status: 'Ready' }, manager).expect(400);
  await patch(`/api/orders/${order._id}/status`, { status: 'Preparing' }, manager).expect(200);
  for (const status of ['Pending', 'Served', 'Cancelled', 'Unknown']) await patch(`/api/orders/${order._id}/status`, { status }, manager).expect(400);
});
test('Q7 pending cancellation is terminal', async () => { const order = await createOrder(); await patch(`/api/orders/${order._id}/status`, { status: 'Cancelled' }, manager).expect(200); await patch(`/api/orders/${order._id}/status`, { status: 'Preparing' }, manager).expect(400); });
test('Q7 invalid and missing order ids', async () => { await patch('/api/orders/bad/status', { status: 'Preparing' }, manager).expect(400); await patch(`/api/orders/${missing}/status`, { status: 'Preparing' }, manager).expect(404); });
test('Q7 reservation persists timestamps and ignores forged owner/status', async () => { const row = await createBooking({ customer: manager.user._id, status: 'Accepted', active: false }); assert.equal(row.customer, customer.user._id); assert.equal(row.status, 'Pending'); assert.ok(row.createdAt && row.updatedAt); });
test('Q7 table existence and capacity checked', async () => { await post('/api/reservations', booking({ tableId: missing }), customer).expect(400); await post('/api/reservations', booking({ tableId: 'bad' }), customer).expect(400); await post('/api/reservations', booking({ partySize: 3 }), customer).expect(400); });
test('Q7 booking format, real date and lead time validated', async () => { for (const extra of [{ date: '2026-02-30' }, { date: '2000-01-01' }, { time: '23:00' }, { phone: 'bad' }, { partySize: 0 }, { partySize: 1.5 }, { contactName: '' }]) await post('/api/reservations', booking(extra), customer).expect(400); });
test('Q7 same table/date/time gives 409 across customers', async () => { await createBooking(); await post('/api/reservations', booking(), second).expect(409); });
test('Q7 simultaneous duplicate reservations are blocked by unique index', async () => { const rows = await Promise.all([post('/api/reservations', booking(), customer), post('/api/reservations', booking(), second)]); assert.deepEqual(rows.map(row => row.status).sort(), [201, 409]); assert.equal(await Reservation.countDocuments(), 1); });
test('Q7 different slots remain available', async () => { await createBooking(); await createBooking({ time: '20:00' }); });
test('Q7 reservation ownership and manager permissions', async () => { await createBooking(); assert.equal((await get('/api/reservations/my', customer).expect(200)).body.length, 1); assert.equal((await get('/api/reservations/my', second).expect(200)).body.length, 0); await get('/api/reservations', customer).expect(403); assert.equal((await get('/api/reservations', manager).expect(200)).body.length, 1); });
test('Q7 manager accepts pending booking and preserves occupancy', async () => { const row = await createBooking(); assert.equal((await patch(`/api/reservations/${row._id}`, { status: 'Accepted' }, manager).expect(200)).body.status, 'Accepted'); await post('/api/reservations', booking(), second).expect(409); });
test('Q7 manager declines booking and releases slot', async () => { const row = await createBooking(); await patch(`/api/reservations/${row._id}`, { status: 'Declined' }, manager).expect(200); await createBooking({}, second); });
test('Q7 reservation decisions require manager and legal status', async () => { const row = await createBooking(); await patch(`/api/reservations/${row._id}`, { status: 'Accepted' }, customer).expect(403); await patch(`/api/reservations/${row._id}`, { status: 'Served' }, manager).expect(400); });
test('Q7 closed reservations cannot be re-reviewed', async () => { const row = await createBooking(); await patch(`/api/reservations/${row._id}`, { status: 'Declined' }, manager).expect(200); await patch(`/api/reservations/${row._id}`, { status: 'Accepted' }, manager).expect(400); });
test('Q7 customer cancellation enforces ownership and releases slot', async () => { const row = await createBooking(); await patch(`/api/reservations/${row._id}/cancel`, {}, second).expect(404); await patch(`/api/reservations/${row._id}/cancel`, {}, customer).expect(200); await createBooking({}, second); });
test('Q7 availability excludes other customer bookings without exposing identities', async () => { await createBooking(); const rows = (await get(`/api/tables/availability?date=${tomorrow()}&time=19:00&partySize=2`).expect(200)).body; assert.ok(rows.every(row => row._id !== table.id && !row.customer && !row.phone)); });
test('Q7 tables list uses seven A1 layouts', async () => { const rows = (await get('/api/tables').expect(200)).body; assert.equal(rows.length, 7); assert.equal(rows[0].code, 'T01'); });

test('Q2 actual server startup binds 0.0.0.0 and serves health', async () => {
  process.env.MONGO_URI = mongo.getUri('urbanfork_tests'); process.env.PORT = '0';
  const originalSignals = new Map(['SIGINT', 'SIGTERM'].map(name => [name, new Set(process.listeners(name))]));
  const server = await require('../server').start();
  try {
    assert.equal(server.address().address, '0.0.0.0');
    const result = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    assert.equal(result.status, 200); assert.equal((await result.json()).status, 'ok');
  } finally {
    await new Promise(resolve => server.close(resolve));
    for (const name of ['SIGINT', 'SIGTERM']) for (const listener of process.listeners(name)) if (!originalSignals.get(name).has(listener)) process.removeListener(name, listener);
  }
});
test('Q2 missing JWT configuration fails startup cleanly', () => {
  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, ['server.js'], { cwd: require('path').resolve(__dirname, '..'), env: { ...process.env, JWT_SECRET: '' }, encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /Configure JWT_SECRET/); assert.ok(!result.stderr.includes(process.env.MONGO_URI));
});
test('Q3 missing Mongo configuration exits 1 without secrets', () => {
  const { spawnSync } = require('child_process');
  const result = spawnSync(process.execPath, ['-e', "require('./config/db')()"], { cwd: require('path').resolve(__dirname, '..'), env: { ...process.env, MONGO_URI: '' }, encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /MongoDB connection failed/);
});
test('Q3 unreachable MongoDB exits 1 with sanitized error', () => {
  const { spawnSync } = require('child_process');
  const uri = 'mongodb://127.0.0.1:1/test?serverSelectionTimeoutMS=1000';
  const result = spawnSync(process.execPath, ['-e', "require('./config/db')()"], { cwd: require('path').resolve(__dirname, '..'), env: { ...process.env, MONGO_URI: uri }, encoding: 'utf8' });
  assert.equal(result.status, 1); assert.match(result.stderr, /MongoDB connection failed/); assert.ok(!result.stderr.includes(uri));
});
