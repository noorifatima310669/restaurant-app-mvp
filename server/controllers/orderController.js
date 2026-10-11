const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Table = require('../models/Table');
const transitions = { Pending: ['Preparing', 'Cancelled'], Preparing: ['Ready'], Ready: ['Served'], Served: [], Cancelled: [] };
const promos = { URBAN10: 10, DINE15: 15, FEAST20: 20 };
async function create(req, res, next) {
  try {
    const body = req.body || {};
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100 || !['Dine-in', 'Takeaway'].includes(body.type)) {
      return res.status(400).json({ message: 'Order items and valid order type are required' });
    }
    const ids = body.items.map(item => item && (item.menuItem || item.id));
    if (ids.some(id => !mongoose.isObjectIdOrHexString(id)) || new Set(ids).size !== ids.length
      || body.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99
        || (item.note !== undefined && (typeof item.note !== 'string' || item.note.length > 500)))) {
      return res.status(400).json({ message: 'Invalid items, quantities or instructions' });
    }
    const menu = await MenuItem.find({ _id: { $in: ids } });
    if (menu.length !== ids.length) return res.status(400).json({ message: 'One or more menu items no longer exist' });
    if (menu.some(item => !item.isAvailable)) return res.status(400).json({ message: 'One or more items are unavailable' });
    let table = null;
    if (body.type === 'Dine-in') {
      if (!mongoose.isObjectIdOrHexString(body.tableId)) return res.status(400).json({ message: 'Choose a valid table' });
      table = await Table.findById(body.tableId);
      if (!table) return res.status(400).json({ message: 'Table not found' });
    } else if (!['As soon as possible', 'In 20 minutes', 'In 35 minutes', 'In 50 minutes'].includes(body.pickupTime)) {
      return res.status(400).json({ message: 'Choose a valid pickup time' });
    }
    if (body.promoCode && !Object.hasOwn(promos, body.promoCode)) return res.status(400).json({ message: 'Invalid promo code' });
    // Server recalculates prices from MongoDB: client totals/prices can be stale or tampered with.
    const items = body.items.map((input, index) => {
      const item = menu.find(entry => entry.id === ids[index]);
      return { menuItem: item._id, name: item.name, price: item.price, quantity: input.quantity, note: input.note || '' };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceCharge = subtotal * 0.05;
    const promoDiscount = subtotal * ((promos[body.promoCode] || 0) / 100);
    const salesTax = Math.max(0, subtotal + serviceCharge - promoDiscount) * 0.15;
    const order = await Order.create({ customer: req.user._id, items, type: body.type,
      table: table?._id || null, tableName: table?.name || '', pickupTime: body.type === 'Takeaway' ? body.pickupTime : '',
      promoCode: body.promoCode || null, subtotal, serviceCharge, promoDiscount, salesTax,
      total: Math.round(subtotal + serviceCharge - promoDiscount + salesTax) });
    return res.status(201).json(await order.populate('customer', 'name email role'));
  } catch (error) { return next(error); }
}
async function my(req, res, next) {
  try { return res.json(await Order.find({ customer: req.user._id }).populate('customer', 'name email role').sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
}
async function list(req, res, next) {
  try { return res.json(await Order.find().populate('customer', 'name email role').sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
}
async function status(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const target = req.body?.status;
    if (!transitions[order.status].includes(target)) return res.status(400).json({ message: `Illegal transition from ${order.status}` });
    // Compare-and-set prevents two managers overwriting a concurrent transition.
    const updated = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, { $set: { status: target } }, { returnDocument: 'after', runValidators: true }).populate('customer', 'name email role');
    if (!updated) return res.status(409).json({ message: 'Order changed; refresh and try again' });
    return res.json(updated);
  } catch (error) { return next(error); }
}
module.exports = { create, my, list, status };
