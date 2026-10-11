require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const MenuItem = require('./models/MenuItem');
const Table = require('./models/Table');
const Reservation = require('./models/Reservation');
const Order = require('./models/Order');
const seedData = require('./data/a1-seed.json');
async function seed() {
  await Promise.all([User.init(), MenuItem.init(), Table.init(), Reservation.init(), Order.init()]);
  for (const input of seedData.users) {
    if (!await User.exists({ email: input.email })) await User.create({ ...input, password: await bcrypt.hash(input.password, 12) });
  }
  for (const { id, ...input } of seedData.menu) {
    await MenuItem.updateOne({ legacyId: id }, { $setOnInsert: { ...input, legacyId: id } }, { upsert: true, runValidators: true });
  }
  for (const { id, ...input } of seedData.tables) {
    await Table.updateOne({ code: id }, { $setOnInsert: input }, { upsert: true, runValidators: true });
  }
  console.log('Seed complete: A1 demo users, 20 menu items and 7 tables (existing data preserved).');
}
if (require.main === module) {
  (async () => { await connectDB(); await seed(); await mongoose.disconnect(); })().catch(async () => {
    console.error('Seed failed. Check database access and schema/index configuration.'); await mongoose.disconnect(); process.exit(1);
  });
}
module.exports = { seed, seedData };
