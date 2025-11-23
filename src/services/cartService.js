const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { AppError } = require("../utils/errorUtils");
const { ERROR_MESSAGES } = require("../utils/constant/Messages");

const getCartByUserId = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price images"
  );

  if (!cart) {
    // No cart found, create a new one
    cart = new Cart({ user: userId, items: [] });
    await cart.save();
    // Re-fetch to ensure population, though it will be empty
    cart = await Cart.findOne({ user: userId });
  }
  
  return cart;
};

const addProductToCart = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    throw new AppError(ERROR_MESSAGES.INVALID_QUANTITY, 400);
  }
  const product = await Product.findById(productId);
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
    cart.items.push({ 
        product: productId, 
        quantity,
        price: product.price,
        name: product.name,
        image: product.images[0]
    });
  }

  cart.recalculate();
  await cart.save();
  return getCartByUserId(userId);
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  if (quantity <= 0) {
    return removeProductFromCart(userId, productId);
  }
  const cart = await getCartByUserId(userId);
  const cartItemIndex = cart.items.findIndex(
    (item) => item.product._id.toString() === productId
  );

  if (cartItemIndex === -1) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_IN_CART, 404);
  }

  cart.items[cartItemIndex].quantity = quantity;
  cart.recalculate();
  await cart.save();
  return getCartByUserId(userId);
};

const removeProductFromCart = async (userId, productId) => {
  const cart = await getCartByUserId(userId);
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) => item.product._id.toString() !== productId
  );

  if (cart.items.length === initialLength) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_IN_CART, 404);
  }

  cart.recalculate();
  await cart.save();
  return getCartByUserId(userId);
};

const clearCart = async (userId) => {
  const cart = await getCartByUserId(userId);
  cart.items = [];
  cart.recalculate();
  await cart.save();
  return cart;
};

module.exports = {
  getCartByUserId,
  addProductToCart,
  updateCartItemQuantity,
  removeProductFromCart,
  clearCart,
};
