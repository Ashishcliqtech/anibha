const express = require('express');
const router = express.Router();
const { instamojoWebhook, instamojoConfirm } = require('../controllers/paymentController');

// Capture raw body for signature verification
const rawBodySaver = function (req, res, buf, encoding) {
	if (buf && buf.length) req.rawBody = buf.toString(encoding || 'utf8');
};

// Parse both urlencoded and json bodies while saving raw payload
const urlencodedParser = express.urlencoded({ extended: true, verify: rawBodySaver });
const jsonParser = express.json({ verify: rawBodySaver });

// Webhook endpoint (public) - support form-encoded and json
router.post('/payments/webhook', urlencodedParser, jsonParser, instamojoWebhook);

// Redirect/confirm endpoint
router.get('/payments/confirm', instamojoConfirm);

module.exports = router;
