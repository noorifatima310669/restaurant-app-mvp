require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errors');
const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('Configure JWT_SECRET with at least 32 random characters in server/.env.');
    process.exit(1);
  }
  await connectDB();
  const mongoose = require('mongoose');
  await Promise.all(mongoose.modelNames().map(name => mongoose.model(name).init()));
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
      console.log(`Urban Fork API listening on port ${listener.address().port}`);
      resolve(listener);
    });
    listener.once('error', reject);
  });
  const shutdown = () => server.close(async () => { await require('mongoose').disconnect(); process.exit(0); });
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return server;
}
if (require.main === module) start().catch(() => { console.error('Server startup failed'); process.exit(1); });
module.exports = { app, start };
