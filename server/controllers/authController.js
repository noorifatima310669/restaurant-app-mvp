const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
function validCredentials(body) {
  return body && typeof body.email === 'string' && /^\S+@\S+\.\S+$/.test(body.email.trim())
    && typeof body.password === 'string' && body.password.length >= 8 && body.password.length <= 72;
}
function session(user) {
  return { token: jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: '1d', algorithm: 'HS256' }), user: user.toJSON() };
}
async function register(req, res, next) {
  try {
    const body = req.body;
    if (!validCredentials(body) || typeof body.name !== 'string' || body.name.trim().length < 2 || !/\d/.test(body.password)) {
      return res.status(400).json({ message: 'Name, valid email and password (8-72 characters including a digit) are required' });
    }
    if (body.role && body.role !== 'customer') return res.status(400).json({ message: 'Public signup creates customer accounts only' });
    const email = body.email.trim().toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name: body.name, email, password: await bcrypt.hash(body.password, 12), role: 'customer' });
    return res.status(201).json(session(user));
  } catch (error) { return next(error); }
}
async function login(req, res, next) {
  try {
    if (!validCredentials(req.body)) return res.status(400).json({ message: 'Valid email and password are required' });
    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+password');
    if (!user || !await bcrypt.compare(req.body.password, user.password)) return res.status(401).json({ message: 'Invalid email or password' });
    return res.json(session(user));
  } catch (error) { return next(error); }
}
async function me(req, res, next) {
  try { return res.json({ user: req.user.toJSON() }); } catch (error) { return next(error); }
}
module.exports = { register, login, me };
