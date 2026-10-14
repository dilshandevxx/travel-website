const { Router } = require('express');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const rules = require('../validators/providerValidators');
const controller = require('../controllers/providerController');

const router = Router();

// "/me" routes must come before "/:id" so "me" isn't treated as an id
router.get('/me/profile', authenticate, authorize('provider'), controller.getMyProfile);
router.patch(
  '/me/profile',
  authenticate,
  authorize('provider'),
  validate(rules.updateMyProfile),
  controller.updateMyProfile
);

router.get('/', validate(rules.list), controller.list);
router.get('/:id', validate(rules.getById), controller.getById);
router.get('/:id/reviews', validate(rules.listReviews), controller.listReviews);
router.patch(
  '/:id/verification',
  authenticate,
  authorize('admin'),
  validate(rules.setVerification),
  controller.setVerification
);

module.exports = router;
