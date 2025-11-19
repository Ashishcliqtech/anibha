const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { AppError, catchAsync } = require('../utils/errorUtils');
const { SUCCESS_MESSAGES } = require('../utils/constant/Messages');
const successResponse = require('../utils/successResponse');

const addToWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const { productId } = req.body;
  if (!productId) return next(new AppError('productId is required', 400));

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) return next(new AppError('Product not found', 404));

  let list = await Wishlist.findOne({ user: userId });
  if (!list) list = new Wishlist({ user: userId, products: [] });

  if (!list.products.find(p => p.toString() === productId.toString())) list.products.push(productId);
  await list.save();

  successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_UPDATED, { wishlist: list });
});

const removeFromWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const productId = req.params.productId;
  if (!productId) return next(new AppError('productId is required', 400));

  const list = await Wishlist.findOne({ user: userId });
  if (!list) return successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_UPDATED, { wishlist: { products: [] } });

  list.products = list.products.filter(p => p.toString() !== productId.toString());
  await list.save();

  successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_UPDATED, { wishlist: list });
});

const getWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user && req.user.id;
  if (!userId) return next(new AppError('Unauthorized', 401));

  const list = await Wishlist.findOne({ user: userId }).populate('products');
  successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_FETCHED, { wishlist: list || { products: [] } });
});

module.exports = { addToWishlist, removeFromWishlist, getWishlist };
