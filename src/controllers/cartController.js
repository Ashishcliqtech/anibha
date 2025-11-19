const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { AppError, catchAsync } = require('../utils/errorUtils');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constant/Messages');
const successResponse = require('../utils/successResponse');

// Add item to cart or increment quantity
const addToCart = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { productId, quantity = 1 } = req.body;
  if (!productId) return next(new AppError('productId is required', 400));
  const qty = Math.max(parseInt(quantity) || 1, 1);

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));
  if (product.stock < qty) return next(new AppError('Requested quantity not available', 400));

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingIndex = cart.items.findIndex(i => i.product.toString() === productId.toString());
  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + qty;
    if (product.stock < newQty) return next(new AppError('Requested quantity not available', 400));
    cart.items[existingIndex].quantity = newQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity: qty,
      price: product.price,
      name: product.name,
      image: (product.images && product.images[0]) || null
    });
  }

  cart.recalculate();
  await cart.save();

  successResponse(res, 200, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const getCart = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images stock');
  if (!cart) return successResponse(res, 200, 'Cart fetched', { cart: { items: [], totalPrice: 0 } });

  successResponse(res, 200, 'Cart fetched', { cart });
});

const updateCartItem = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { productId, quantity } = req.body;
  if (!productId) return next(new AppError('productId is required', 400));
  const qty = Math.max(parseInt(quantity) || 0, 0);

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));
  if (qty > product.stock) return next(new AppError('Requested quantity not available', 400));

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return next(new AppError('Cart not found', 404));

  const existingIndex = cart.items.findIndex(i => i.product.toString() === productId.toString());
  if (existingIndex === -1) return next(new AppError('Product not in cart', 404));

  if (qty === 0) {
    cart.items.splice(existingIndex, 1);
  } else {
    cart.items[existingIndex].quantity = qty;
  }

  cart.recalculate();
  await cart.save();

  successResponse(res, 200, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const removeCartItem = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const productId = req.params.productId;
  if (!productId) return next(new AppError('productId is required', 400));

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return next(new AppError('Cart not found', 404));

  cart.items = cart.items.filter(i => i.product.toString() !== productId.toString());
  cart.recalculate();
  await cart.save();

  successResponse(res, 200, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    cart.recalculate();
    await cart.save();
  }

  successResponse(res, 200, SUCCESS_MESSAGES.CART_CLEARED);
});

module.exports = { addToCart, getCart, updateCartItem, removeCartItem, clearCart };
