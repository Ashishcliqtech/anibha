const Cart = require("../models/Cart");
const AppError = require("../utils/errorUtils");
const { getProductById } = require("./productService");
const { ERROR_MESSAGES } = require("../utils/constant/Messages");

const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price image"
  );
  return cart || { items: [], subTotal: 0 };
};

const addProductToCart = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    throw new AppError(ERROR_MESSAGES.INVALID_QUANTITY, 400);
  }
  const product = await getProductById(productId);
  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  const cart = await getCartByUserId(userId);
  const cartItemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (cartItemIndex > -1) {
    cart.items[cartItemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  cart.subTotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * product.price,
    0
  );
  await cart.save();
  return getCartByUserId(userId);
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    throw new AppError(ERROR_MESSAGES.INVALID_QUANTITY, 400);
  }
  const cart = await getCartByUserId(userId);
  const cartItemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (cartItemIndex === -1) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_IN_CART, 404);
  }

  cart.items[cartItemIndex].quantity = quantity;
  cart.subTotal = cart.items.reduce(
    (acc, item) => acc + item.quantity * item.product.price,
    0
  );
  await cart.save();
  return getCartByUserId(userId);
};

const removeProductFromCart = async (userId, productId) => {
  const cart = await getCartByUserId(userId);
  const cartItemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (cartItemIndex === -1) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_IN_CART, 404);
  }

  const productPrice = cart.items[cartItemIndex].product.price;
  const productQuantity = cart.items[cartItemIndex].quantity;
  cart.subTotal -= productPrice * productQuantity;
  cart.items.splice(cartItemIndex, 1);

  await cart.save();
  return getCartByUserId(userId);
};

const clearCart = async (userId) => {
  const cart = await getCartByUserId(userId);
  cart.items = [];
  cart.subTotal = 0;
  await cart.save();
};

module.exports = {
  getCartByUserId,
  addProductToCart,
  updateCartItemQuantity,
  removeProductFromCart,
  clearCart,
};
