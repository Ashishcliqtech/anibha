const { catchAsync } = require('../utils/errorUtils');
const successResponse = require('../utils/successResponse');
const cartService = require('../services/cartService');
const { SUCCESS_MESSAGES } = require('../utils/constant/Messages');

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCartByUserId(req.user.id);
  successResponse(res, 200, SUCCESS_MESSAGES.CART_FETCHED, { cart });
});

const addToCart = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addProductToCart(req.user.id, productId, quantity);
  successResponse(res, 201, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const updateCartItem = catchAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.updateCartItemQuantity(req.user.id, productId, quantity);
  successResponse(res, 200, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const removeCartItem = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const cart = await cartService.removeProductFromCart(req.user.id, productId);
  successResponse(res, 200, SUCCESS_MESSAGES.CART_UPDATED, { cart });
});

const clearCart = catchAsync(async (req, res) => {
    await cartService.clearCart(req.user.id);
    successResponse(res, 200, SUCCESS_MESSAGES.CART_CLEARED);
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
