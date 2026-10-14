const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.use('/auth', require('./authRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/providers', require('./providerRoutes'));
router.use('/service-requests', require('./serviceRequestRoutes'));

module.exports = router;
