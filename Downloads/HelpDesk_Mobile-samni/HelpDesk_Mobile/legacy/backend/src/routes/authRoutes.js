const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const rules = require('../validators/authValidators');
const controller = require('../controllers/authController');

const router = Router();

// Slow down password guessing: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => env.isTest,
  message: { success: false, error: { message: 'Too many attempts. Please try again later.' } },
});

router.post('/register', authLimiter, validate(rules.register), controller.register);
router.post('/login', authLimiter, validate(rules.login), controller.login);
router.get('/me', authenticate, controller.getMe);
router.patch('/me', authenticate, validate(rules.updateMe), controller.updateMe);

module.exports = router;
