const jwt = require('jsonwebtoken');
const User = require('../models/User');
async function protect(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Authentication required' });
  let payload;
  try { payload = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
  try {
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User no longer exists' });
    req.user = user;
    return next();
  } catch (error) { return next(error); }
}
function managerOnly(req, res, next) {
  if (req.user.role !== 'manager') return res.status(403).json({ message: 'Manager access required' });
  next();
}
function customerOnly(req, res, next) {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Customer access required' });
  next();
}
module.exports = { protect, managerOnly, customerOnly };
