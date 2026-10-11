const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  tableName: { type: String, required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  time: { type: String, required: true, match: /^(1[2-9]|2[0-2]):00$/ },
  partySize: { type: Number, required: true, min: 1, max: 12, validate: Number.isInteger },
  contactName: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, match: /^03\d{2}-\d{7}$/ },
  status: { type: String, required: true, enum: ['Pending', 'Accepted', 'Declined', 'Cancelled'], default: 'Pending' },
  active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'Reservations' });
// Database-level locking also protects simultaneous bookings on different clients.
schema.index({ table: 1, date: 1, time: 1 }, { unique: true, partialFilterExpression: { active: true } });
module.exports = mongoose.model('Reservation', schema);
