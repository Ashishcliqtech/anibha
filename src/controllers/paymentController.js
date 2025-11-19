const Order = require('../models/Order');
const { catchAsync } = require('../utils/errorUtils');
const logger = require('../utils/logger');
const crypto = require('crypto');
const config = require('../config/config');

// Webhook endpoint for Instamojo
const instamojoWebhook = catchAsync(async (req, res) => {
  // Instamojo posts form-encoded or JSON data; handle both
  const payload = req.body || {};
  logger.info('Instamojo webhook received');

  // Verify webhook signature if salt is configured
  try {
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const sigHeader = req.headers['x-instamojo-signature'] || req.headers['x-instamojo-signature-hmac'] || req.headers['x-instamojo-signature-sha1'];
    if (config.INSTAMOJO_SALT && sigHeader) {
      // Compute HMAC-SHA1 and also compute SHA256 for compatibility
      const hmacSha1 = crypto.createHmac('sha1', config.INSTAMOJO_SALT).update(raw).digest('hex');
      const hmacSha256 = crypto.createHmac('sha256', config.INSTAMOJO_SALT).update(raw).digest('hex');
      const hmacBase64Sha1 = crypto.createHmac('sha1', config.INSTAMOJO_SALT).update(raw).digest('base64');

      const provided = sigHeader.toString().trim();
      const matches = [hmacSha1, hmacSha256, hmacBase64Sha1].some(m => m === provided);
      if (!matches) {
        logger.warn('Instamojo webhook signature mismatch', { provided: sigHeader });
        return res.status(403).send('Invalid signature');
      }
      logger.info('Instamojo webhook signature verified');
    } else if (config.INSTAMOJO_SALT && !sigHeader) {
      logger.warn('INSTAMOJO_SALT provided but signature header missing');
      return res.status(400).send('Missing signature header');
    }
  } catch (err) {
    logger.error('Error verifying Instamojo signature', err);
    return res.status(500).send('Signature verification error');
  }

  const paymentRequestId = payload.payment_request_id || payload.payment_request || payload.payment_request_id;
  const paymentId = payload.payment_id || payload.payment || payload.payment_id;
  const status = payload.status || payload.payment_status || payload.status;

  if (!paymentRequestId) {
    logger.warn('Instamojo webhook missing payment_request_id');
    return res.status(400).send('Missing payment_request_id');
  }

  const order = await Order.findOne({ 'meta.paymentRequestId': paymentRequestId });
  if (!order) {
    logger.warn('Order not found for payment_request_id', paymentRequestId);
    return res.status(404).send('Order not found');
  }

  // Determine success
  const successStatuses = ['Credit', 'Completed', 'PAID', 'Successful', 'Success'];
  const isPaid = successStatuses.includes((status || '').toString());

  if (isPaid) {
    order.paymentStatus = 'paid';
    order.status = order.status === 'processing' ? 'completed' : order.status;
    order.meta = order.meta || {};
    order.meta.instamojo = order.meta.instamojo || {};
    order.meta.instamojo.paymentId = paymentId;
    order.meta.instamojo.raw = payload;
    await order.save();
    logger.info('Order marked as paid via Instamojo', order._id.toString());
    return res.status(200).send('OK');
  }

  // For failed or pending statuses, record raw payload
  order.meta = order.meta || {};
  order.meta.instamojo = order.meta.instamojo || {};
  order.meta.instamojo.raw = payload;
  await order.save();

  return res.status(200).send('Ignored');
});

// Redirect handler (user returning to site after payment)
const instamojoConfirm = catchAsync(async (req, res) => {
  // Instamojo redirects with parameters like payment_id, payment_request_id, status
  const { payment_id, payment_request_id, status } = req.query;
  // Attempt to find order and update similar to webhook
  const order = await Order.findOne({ 'meta.paymentRequestId': payment_request_id });
  if (!order) return res.status(404).send('Order not found');

  const successStatuses = ['Credit', 'Completed', 'PAID', 'Successful', 'Success'];
  const isPaid = successStatuses.includes((status || '').toString());
  if (isPaid) {
    order.paymentStatus = 'paid';
    order.status = order.status === 'processing' ? 'completed' : order.status;
    order.meta = order.meta || {};
    order.meta.instamojo = order.meta.instamojo || {};
    order.meta.instamojo.paymentId = payment_id;
    await order.save();
    // Redirect to frontend success page (client should interpret URL)
    return res.redirect(302, '/payment/success');
  }
  return res.redirect(302, '/payment/failure');
});

module.exports = { instamojoWebhook, instamojoConfirm };
