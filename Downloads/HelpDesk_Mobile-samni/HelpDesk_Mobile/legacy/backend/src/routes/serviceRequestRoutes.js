const { Router } = require('express');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const rules = require('../validators/serviceRequestValidators');
const controller = require('../controllers/serviceRequestController');

const router = Router();

// Every service request route needs a logged-in user
router.use(authenticate);

router.post('/', authorize('customer'), validate(rules.create), controller.create);
router.get('/', validate(rules.list), controller.listMine);
router.get('/available', authorize('provider'), validate(rules.list), controller.listAvailable);
router.get('/:id', validate(rules.byId), controller.getById);

router.patch('/:id/accept', authorize('provider'), validate(rules.byId), controller.accept);
router.patch('/:id/decline', authorize('provider'), validate(rules.byId), controller.decline);
router.patch('/:id/start', authorize('provider'), validate(rules.byId), controller.start);
router.patch('/:id/complete', authorize('provider'), validate(rules.byId), controller.complete);
router.patch('/:id/cancel', validate(rules.cancel), controller.cancel);

router.post('/:id/review', authorize('customer'), validate(rules.review), controller.addReview);

module.exports = router;
