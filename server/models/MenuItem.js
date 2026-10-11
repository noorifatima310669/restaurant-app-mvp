const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, enum: ['Starters', 'Mains', 'Desserts', 'Drinks'] },
  imageKey: { type: String, default: 'truffle-parmesan-fries' },
  legacyId: { type: String, unique: true, sparse: true },
  isSpecial: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true, collection: 'MenuItems' });
module.exports = mongoose.model('MenuItem', schema);
