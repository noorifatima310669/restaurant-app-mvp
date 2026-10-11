const MenuItem = require('../models/MenuItem');
const FIELDS = ['name', 'description', 'price', 'category', 'imageKey', 'isSpecial', 'isAvailable'];
function changes(body) {
  return Object.fromEntries(FIELDS.filter(key => Object.hasOwn(body || {}, key)).map(key => [key, body[key]]));
}
function validTypes(body) {
  if (!body || Array.isArray(body) || typeof body !== 'object') return false;
  if (Object.hasOwn(body, 'price') && (typeof body.price !== 'number' || !Number.isFinite(body.price))) return false;
  return FIELDS.every(key => !Object.hasOwn(body, key) || (
    key === 'price' || typeof body[key] === (key.startsWith('is') ? 'boolean' : 'string')
  ));
}
async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.category) {
      if (typeof req.query.category !== 'string') return res.status(400).json({ message: 'Invalid category' });
      filter.category = req.query.category;
    }
    if (req.query.search) {
      if (typeof req.query.search !== 'string') return res.status(400).json({ message: 'Invalid search' });
      filter.name = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }
    return res.json(await MenuItem.find(filter).sort({ createdAt: 1, _id: 1 }));
  } catch (error) { return next(error); }
}
async function get(req, res, next) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    return res.json(item);
  } catch (error) { return next(error); }
}
async function create(req, res, next) {
  try {
    if (!validTypes(req.body)) return res.status(400).json({ message: 'Invalid menu data' });
    return res.status(201).json(await MenuItem.create(changes(req.body)));
  } catch (error) { return next(error); }
}
async function update(req, res, next) {
  try {
    if (!validTypes(req.body) || !Object.keys(changes(req.body)).length) return res.status(400).json({ message: 'Invalid menu data' });
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { $set: changes(req.body) }, { returnDocument: 'after', runValidators: true });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    return res.json(item);
  } catch (error) { return next(error); }
}
async function remove(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    return res.json({ message: 'Menu item deleted' });
  } catch (error) { return next(error); }
}
module.exports = { list, get, create, update, remove };
