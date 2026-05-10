const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const locationController = require('../controllers/locationController');

const insightLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || `${60 * 1000}`, 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
  message: { error: 'Too many requests.', code: 'RATE_LIMITED' },
});

router.post('/', insightLimiter, locationController.getInsights);

module.exports = router;
