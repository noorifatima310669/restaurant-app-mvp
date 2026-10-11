const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
async function list(req, res, next) {
  try { return res.json(await Table.find().sort({ code: 1 })); } catch (error) { return next(error); }
}
async function availability(req, res, next) {
  try {
    const { date, time } = req.query;
    const partySize = Number(req.query.partySize || 1);
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
      || typeof time !== 'string' || !/^(1[2-9]|2[0-2]):00$/.test(time)
      || !Number.isInteger(partySize) || partySize < 1 || partySize > 12) {
      return res.status(400).json({ message: 'Valid date, time and partySize required' });
    }
    const occupied = await Reservation.find({ date, time, active: true }).distinct('table');
    return res.json(await Table.find({ _id: { $nin: occupied }, seats: { $gte: partySize } }).sort({ seats: 1, code: 1 }));
  } catch (error) { return next(error); }
}
module.exports = { list, availability };
