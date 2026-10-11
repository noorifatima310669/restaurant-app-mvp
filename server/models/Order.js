const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 99, validate: Number.isInteger },
  note: { type: String, default: '', maxlength: 500 },
}, { _id: false });
const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [itemSchema], required: true, validate: v => v.length > 0 },
  type: { type: String, required: true, enum: ['Dine-in', 'Takeaway'] },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  tableName: { type: String, default: '' },
  pickupTime: { type: String, default: '' },
  promoCode: { type: String, default: null },
  subtotal: { type: Number, required: true, min: 0 },
  serviceCharge: { type: Number, required: true, min: 0 },
  promoDiscount: { type: Number, required: true, min: 0 },
  salesTax: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, required: true, enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'], default: 'Pending' },
}, { timestamps: true, collection: 'Orders' });
module.exports = mongoose.model('Order', schema);
