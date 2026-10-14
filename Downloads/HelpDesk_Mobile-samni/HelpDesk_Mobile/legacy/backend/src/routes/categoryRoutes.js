const { Router } = require('express');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const rules = require('../validators/categoryValidators');
const controller = require('../controllers/categoryController');

const router = Router();

router.get('/', controller.list);
router.post('/', authenticate, authorize('admin'), validate(rules.create), controller.create);
router.patch('/:id', authenticate, authorize('admin'), validate(rules.update), controller.update);

module.exports = router;
