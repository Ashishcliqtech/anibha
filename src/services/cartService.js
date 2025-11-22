const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/errorUtils');
const { ERROR_MESSAGES } = require('../utils/constant/Messages');

const getCartByUserId = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images stock');
  if (!cart) {
    return { items: [], totalPrice: 0 };
  }
  return cart;
};

const addProductToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const existingIndex = cart.items.findIndex(i => i.product.toString() === productId.toString());
  const newQty = (existingIndex > -1 ? cart.items[existingIndex].quantity : 0) + quantity;

  if (product.stock < newQty) {
    throw new AppError('Requested quantity not available', 400);
  }

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity = newQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      price: product.price,
      name: product.name,
      image: (product.images && product.images[0]) || null
    });
  }

  cart.recalculate();
  await cart.save();
  return cart;
};

const updateCartItemQuantity = async (userId, productId, quantity) => {
  const qty = Math.max(parseInt(quantity) || 0, 0);

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  if (qty > product.stock) {
    throw new AppError('Requested quantity not available', 400);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const existingIndex = cart.items.findIndex(i => i.product.toString() === productId.toString());
  if (existingIndex === -1) {
    throw new AppError('Product not in cart', 404);
  }

  if (qty === 0) {
    cart.items.splice(existingIndex, 1);
  } else {
    cart.items[existingIndex].quantity = qty;
  }

  cart.recalculate();
  await cart.save();
  return cart;
};

const removeProductFromCart = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = cart.items.filter(i => i.product.toString() !== productId.toString());
  cart.recalculate();
  await cart.save();
  return cart;
};

const clearCart = async (userId) => {
    const cart = await Cart.findOne({ user: userId });
    if (cart) {
        cart.items = [];
        cart.recalculate();
        await cart.save();
    }
    return;
};


module.exports = {
  getCartByUserId,
  addProductToCart,
  updateCartItemQuantity,
  removeProductFromCart,
  clearCart,
};
