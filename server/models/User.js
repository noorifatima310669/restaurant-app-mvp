const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'manager'], default: 'customer', required: true },
}, { timestamps: true, collection: 'Users' });
schema.set('toJSON', { transform: (_doc, result) => { delete result.password; delete result.__v; return result; } });
module.exports = mongoose.model('User', schema);
