const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { AppError } = require('../utils/errorUtils');
const { ERROR_MESSAGES } = require('../utils/constant/Messages');

const getWishlistByUserId = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate('products');
  return wishlist || { products: [] };
};

const addProductToWishlist = async (userId, productId) => {
  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, products: [] });
  }

  if (wishlist.products.includes(productId)) {
    throw new AppError('Product already in wishlist', 409);
  }

  wishlist.products.push(productId);
  await wishlist.save();
  return wishlist;
};

const removeProductFromWishlist = async (userId, productId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.products.pull(productId);
    await wishlist.save();
  }
  return wishlist;
};

module.exports = {
  getWishlistByUserId,
  addProductToWishlist,
  removeProductFromWishlist,
};
