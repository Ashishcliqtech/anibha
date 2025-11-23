const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError, catchAsync } = require('../utils/errorUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');
const successResponse = require('../utils/successResponse');
const Coupon = require('../models/Coupon');
const logger = require('../utils/logger');


// Checkout: create order from cart with transaction-safe stock decrement
const checkout = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const cart = await Cart.findOne({ user: userId }).session(session);
    if (!cart || !cart.items || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError('Cart is empty', 400));
    }

    // Verify stock for each item and decrement
    for (const item of cart.items) {
      const prod = await Product.findById(item.product).session(session);
      if (!prod || !prod.isActive) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(`${ERROR_MESSAGES.PRODUCT_NOT_FOUND}`, 400));
      }
      if (prod.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(`Insufficient stock for ${prod.name}`, 400));
      }
      // decrement
      prod.stock = prod.stock - item.quantity;
      await prod.save({ session, validateBeforeSave: true });
    }

    // Calculate subtotal, apply coupon if provided
    const subtotal = cart.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    let shipping = 0; // placeholder
    let tax = 0; // placeholder
    let discount = 0;
    let appliedCoupon = null;

    if (req.body.couponCode) {
      const code = req.body.couponCode.toString().trim().toUpperCase();
      const coupon = await Coupon.findOne({ code }).session(session);
      if (!coupon) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(ERROR_MESSAGES.COUPON_NOT_FOUND, 400));
      }
      const valid = coupon.isValidForUser(userId, subtotal, cart.items.map(i => ({ product: i.product, category: i.category })));
      if (!valid.valid) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(valid.reason || 'Coupon invalid', 400));
      }
      discount = coupon.applyDiscount(subtotal);
      appliedCoupon = coupon;
      // update coupon usage counts
      coupon.usedCount = (coupon.usedCount || 0) + 1;
      const ub = (coupon.usedBy || []).find(u => u.user.toString() === userId.toString());
      if (ub) ub.uses = (ub.uses || 0) + 1;
      else coupon.usedBy.push({ user: userId, uses: 1 });
      await coupon.save({ session });
    }

    const totalAmount = Math.max(0, subtotal - discount + shipping + tax);

    const order = new Order({
      user: userId,
      items: cart.items.map(i => ({ product: i.product, quantity: i.quantity, price: i.price, name: i.name, image: i.image })),
      subtotal,
      shipping,
      tax,
      totalAmount,
      meta: appliedCoupon ? { coupon: appliedCoupon._id, couponCode: appliedCoupon.code, discount } : {},
      paymentStatus: 'pending',
      status: 'processing'
    });

    await order.save({ session });

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await Cart.findByIdAndUpdate(cart._id, { items: cart.items, totalPrice: cart.totalPrice }, { session });


    await session.commitTransaction();
    session.endSession();
    // After DB transaction commit create payment request if requested
    if (req.body.paymentMethod && req.body.paymentMethod === 'instamojo') {
      try {
        const instamojoService = require('../services/instamojoService');
        const config = require('../config/config');
        const host = req.body.redirectHost || (req.get('origin') || `${req.protocol}://${req.get('host')}`);
        const redirectUrl = `${host}/api/v1/payments/confirm`;
        const webhookUrl = `${host}/api/v1/payments/webhook`;

        const payResp = await instamojoService.createPaymentRequest({
          purpose: `Order #${order._id}`,
          amount: order.totalAmount,
          buyer_name: req.user && req.user.name ? req.user.name : 'Customer',
          email: req.user && req.user.email ? req.user.email : undefined,
          phone: undefined,
          redirect_url: redirectUrl,
          webhook: webhookUrl
        });

        // Instamojo returns response in payResp; store payment_request id and long_url if present
        const paymentRequest = payResp && payResp.payment_request ? payResp.payment_request : null;
        if (paymentRequest) {
          order.meta = order.meta || {};
          order.meta.paymentRequestId = paymentRequest.id || paymentRequest.payment_request_id || null;
          order.meta.paymentLongUrl = paymentRequest.longurl || paymentRequest.long_url || null;
          await order.save();
        }

        successResponse(res, 201, SUCCESS_MESSAGES.ORDER_CREATED, { order, payment: paymentRequest });
        return;
      } catch (err) {
        // If payment creation failed, inform client but order is created. Log and respond.
        logger.error('Instamojo payment request creation failed', err);
        successResponse(res, 201, SUCCESS_MESSAGES.ORDER_CREATED, { order, payment: null, warning: 'Payment request creation failed' });
        return;
      }
    }

    successResponse(res, 201, SUCCESS_MESSAGES.ORDER_CREATED, { order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
});

const getUserOrders = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: userId }).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('items.product', 'name images'),
    Order.countDocuments({ user: userId })
  ]);

  successResponse(res, 200, SUCCESS_MESSAGES.ORDER_FETCHED, { orders, total, currentPage: page, totalPages: Math.ceil(total/limit) });
});

const getOrderById = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const order = await Order.findById(req.params.id).populate('items.product', 'name images');
  if (!order) return next(new AppError('Order not found', 404));
  if (order.user.toString() !== userId.toString()) return next(new AppError('Forbidden', 403));

  successResponse(res, 200, SUCCESS_MESSAGES.ORDER_FETCHED, { order });
});

const getOrderByIdAdmin = catchAsync(async (req, res, next) => {
    if (!req.user || !req.user.isAdmin) return next(new AppError('Forbidden', 403));
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name images');
    if (!order) return next(new AppError('Order not found', 404));

    successResponse(res, 200, SUCCESS_MESSAGES.ORDER_FETCHED, { order });
});


// Admin: update order status
const updateOrderStatus = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return next(new AppError('Forbidden', 403));
  const order = await Order.findById(req.params.id);
  if (!order) return next(new AppError('Order not found', 404));

  const { status, paymentStatus } = req.body;
  if (status) order.status = status;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  await order.save();

  successResponse(res, 200, 'Order updated', { order });
});

const getAllOrders = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) return next(new AppError('Forbidden', 403));

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('user', 'name email'),
    Order.countDocuments({})
  ]);

  successResponse(res, 200, SUCCESS_MESSAGES.ORDER_FETCHED, { orders, total, currentPage: page, totalPages: Math.ceil(total/limit) });
});


module.exports = { checkout, getUserOrders, getOrderById, getOrderByIdAdmin, updateOrderStatus, getAllOrders };