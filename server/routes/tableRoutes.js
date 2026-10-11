const router = require('express').Router();
const controller = require('../controllers/tableController');
router.get('/', controller.list);
router.get('/availability', controller.availability);
module.exports = router;
