// Disposable development database only. Atlas is still required for final evidence.
const { randomBytes } = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const mongo = await MongoMemoryServer.create({ binary: { version: process.env.MONGOMS_VERSION || '8.2.6' } });
  process.env.MONGO_URI = mongo.getUri('urbanfork_demo');
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const { start } = require('../server');
  const server = await start();
  await require('../seed').seed();
  console.log('Disposable demo database active. All data is lost when this process stops.');
  const close = () => server.close(async () => { await require('mongoose').disconnect(); await mongo.stop(); process.exit(0); });
  process.removeAllListeners('SIGINT'); process.removeAllListeners('SIGTERM');
  process.once('SIGINT', close); process.once('SIGTERM', close);
})().catch(() => { console.error('Disposable database startup failed'); process.exit(1); });
