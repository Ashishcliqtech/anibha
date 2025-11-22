const { catchAsync } = require('../utils/errorUtils');
const successResponse = require('../utils/successResponse');
const wishlistService = require('../services/wishlistService');
const { SUCCESS_MESSAGES } = require('../utils/constant/Messages');

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await wishlistService.getWishlistByUserId(req.user.id);
  successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_FETCHED, { wishlist });
});

const addToWishlist = catchAsync(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await wishlistService.addProductToWishlist(req.user.id, productId);
  successResponse(res, 201, SUCCESS_MESSAGES.WISHLIST_UPDATED, { wishlist });
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const { productId } = req.params;
  const wishlist = await wishlistService.removeProductFromWishlist(req.user.id, productId);
  successResponse(res, 200, SUCCESS_MESSAGES.WISHLIST_UPDATED, { wishlist });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
