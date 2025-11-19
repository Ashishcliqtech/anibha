const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { createCoupon, updateCoupon, validateCoupon, listCoupons } = require('../controllers/couponController');

// public validate (can be used by logged-in users to validate)
router.post('/coupon/validate', protect, validateCoupon);

// Admin
router.post('/admin/coupons', protect, adminOnly, createCoupon);
router.patch('/admin/coupons/:id', protect, adminOnly, updateCoupon);
router.get('/admin/coupons', protect, adminOnly, listCoupons);

module.exports = router;
