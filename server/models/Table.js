const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  seats: { type: Number, required: true, min: 1, max: 12, validate: Number.isInteger },
  area: { type: String, required: true },
}, { timestamps: true, collection: 'Tables' });
module.exports = mongoose.model('Table', schema);
