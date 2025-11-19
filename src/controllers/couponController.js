const Coupon = require('../models/Coupon');
const { AppError, catchAsync } = require('../utils/errorUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');
const successResponse = require('../utils/successResponse');

// Admin: create coupon
const createCoupon = catchAsync(async (req, res, next) => {
  const data = req.body;
  if (req.user && req.user.id) data.createdBy = req.user.id;
  data.code = (data.code || '').toString().trim().toUpperCase();
  const coupon = await Coupon.create(data);
  successResponse(res, 201, SUCCESS_MESSAGES.COUPON_CREATED, { coupon });
});

// Admin: update coupon
const updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return next(new AppError(ERROR_MESSAGES.COUPON_NOT_FOUND, 404));
  Object.assign(coupon, req.body);
  if (req.body.code) coupon.code = req.body.code.toString().trim().toUpperCase();
  await coupon.save();
  successResponse(res, 200, SUCCESS_MESSAGES.COUPON_UPDATED, { coupon });
});

// Public: validate coupon for cart (calculate discount)
const validateCoupon = catchAsync(async (req, res, next) => {
  const { code, subtotal } = req.body;
  if (!code) return next(new AppError('Coupon code is required', 400));
  const coupon = await Coupon.findOne({ code: code.toString().trim().toUpperCase() });
  if (!coupon) return next(new AppError(ERROR_MESSAGES.COUPON_NOT_FOUND, 404));

  const cartItems = req.body.items || [];
  const valid = coupon.isValidForUser(req.user && req.user.id, Number(subtotal) || 0, cartItems);
  if (!valid.valid) return next(new AppError(valid.reason || 'Coupon invalid', 400));

  const discount = coupon.applyDiscount(Number(subtotal) || 0);
  successResponse(res, 200, SUCCESS_MESSAGES.COUPON_VALID, { coupon: { code: coupon.code, discount } });
});

// Admin: list coupons
const listCoupons = catchAsync(async (req, res, next) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  successResponse(res, 200, SUCCESS_MESSAGES.COUPON_FETCHED, { coupons });
});

module.exports = { createCoupon, updateCoupon, validateCoupon, listCoupons };
