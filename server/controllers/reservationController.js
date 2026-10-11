const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
async function create(req, res, next) {
  try {
    const body = req.body || {};
    if (!mongoose.isObjectIdOrHexString(body.tableId)) return res.status(400).json({ message: 'Choose a valid table' });
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)
      || typeof body.time !== 'string' || !/^(1[2-9]|2[0-2]):00$/.test(body.time)
      || !Number.isInteger(body.partySize) || body.partySize < 1 || body.partySize > 12
      || typeof body.contactName !== 'string' || !body.contactName.trim()
      || typeof body.phone !== 'string' || !/^03\d{2}-\d{7}$/.test(body.phone)) {
      return res.status(400).json({ message: 'Valid booking date, time, party size, name and phone are required' });
    }
    const date = new Date(`${body.date}T${body.time}:00+05:00`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== body.date || date.getTime() < Date.now() + 3600000) {
      return res.status(400).json({ message: 'Book a valid date at least one hour ahead (Asia/Karachi)' });
    }
    const table = await Table.findById(body.tableId);
    if (!table) return res.status(400).json({ message: 'Table not found' });
    if (body.partySize > table.seats) return res.status(400).json({ message: 'Party exceeds table capacity' });
    if (await Reservation.exists({ table: table._id, date: body.date, time: body.time, active: true })) {
      return res.status(409).json({ message: 'Table already reserved at this date and time' });
    }
    const reservation = await Reservation.create({ customer: req.user._id, table: table._id, tableName: table.name,
      date: body.date, time: body.time, partySize: body.partySize, contactName: body.contactName, phone: body.phone });
    return res.status(201).json(reservation);
  } catch (error) { return next(error); }
}
async function my(req, res, next) {
  try { return res.json(await Reservation.find({ customer: req.user._id }).sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
}
async function list(req, res, next) {
  try { return res.json(await Reservation.find().sort({ createdAt: -1 })); }
  catch (error) { return next(error); }
}
async function decide(req, res, next) {
  try {
    const status = req.body?.status;
    if (!['Accepted', 'Declined'].includes(status)) return res.status(400).json({ message: 'Choose Accepted or Declined' });
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Reservation not found' });
    if (existing.status !== 'Pending') return res.status(400).json({ message: 'Only pending reservations can be reviewed' });
    const updated = await Reservation.findOneAndUpdate({ _id: existing._id, status: 'Pending' },
      { $set: { status, active: status === 'Accepted' } }, { returnDocument: 'after', runValidators: true });
    if (!updated) return res.status(409).json({ message: 'Reservation changed; refresh and try again' });
    return res.json(updated);
  } catch (error) { return next(error); }
}
async function cancel(req, res, next) {
  try {
    const existing = await Reservation.findOne({ _id: req.params.id, customer: req.user._id });
    if (!existing) return res.status(404).json({ message: 'Reservation not found' });
    if (!existing.active) return res.status(400).json({ message: 'Reservation is already closed' });
    const updated = await Reservation.findOneAndUpdate({ _id: existing._id, customer: req.user._id, active: true },
      { $set: { status: 'Cancelled', active: false } }, { returnDocument: 'after', runValidators: true });
    if (!updated) return res.status(409).json({ message: 'Reservation changed; refresh and try again' });
    return res.json(updated);
  } catch (error) { return next(error); }
}
module.exports = { create, my, list, decide, cancel };
