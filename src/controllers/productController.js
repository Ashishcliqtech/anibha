const { catchAsync } = require('../utils/errorUtils');
const successResponse = require('../utils/successResponse');
const productService = require('../services/productService');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constant/Messages');
const emptyListResponse = require('../utils/emptyListResponse');

const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user.id);
  successResponse(res, 201, SUCCESS_MESSAGES.PRODUCT_CREATED, { product });
});

const updateProduct = catchAsync(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_UPDATED, { product });
});

const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.id);
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_DELETED);
});

const getProducts = catchAsync(async (req, res) => {
  const result = await productService.getProducts(req.query);
  if (!result.products || result.products.length === 0) {
      return emptyListResponse(res, ERROR_MESSAGES.PRODUCT_NOT_FOUND, 'products');
  }
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_FETCHED, result);
});

const getAdminProducts = catchAsync(async (req, res) => {
  const result = await productService.getProducts(req.query);
    if (!result.products || result.products.length === 0) {
      return emptyListResponse(res, 'No products found', 'products');
  }
  successResponse(res, 200, 'Successfully fetched products for admin.', result);
});

const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id, false);
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_FETCHED, { product });
});

const getProductByIdAdmin = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id, true);
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_FETCHED, { product });
});

const updateStock = catchAsync(async (req, res) => {
  const product = await productService.updateStock(req.params.id, req.body);
  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_UPDATED, { product });
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getAdminProducts,
  getProductById,
  getProductByIdAdmin,
  updateStock,
  getUserProducts: getProducts, // Alias for backward compatibility
};