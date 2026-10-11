const mongoose = require('mongoose');
function validId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid ObjectId' });
  next();
}
function errorHandler(error, _req, res, _next) {
  if (error.code === 11000) return res.status(409).json({ message: 'A record already exists for these details' });
  if (['ValidationError', 'CastError'].includes(error.name)) return res.status(400).json({ message: 'Invalid or missing data' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large' });
  // Intentionally exclude stack traces, database errors and secrets from responses/logs.
  console.error('Request failed:', error.name || 'Error');
  return res.status(500).json({ message: 'Internal server error' });
}
module.exports = { validId, errorHandler };
