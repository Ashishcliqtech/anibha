const Product = require('../models/Product');
const { AppError, catchAsync } = require('../utils/errorUtils');
const {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} = require('../utils/constant/Messages');
const successResponse = require('../utils/successResponse');
const emptyListResponse = require('../utils/emptyListResponse');
const logger = require('../utils/logger');

// Create Product (Admin)
const createProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    currency,
    sku,
    category,
    material,
    metalType,
    gemstones,
    images,
    stock,
    tags,
    weightInGrams,
    dimensions
  } = req.body;

  // Basic validation - rely on mongoose for deep validation
  if (!name || !description || price === undefined) {
    return next(new AppError(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS, 400));
  }

  const productData = {
    name,
    description,
    price,
    currency,
    sku,
    category,
    material,
    metalType,
    gemstones: Array.isArray(gemstones) ? gemstones : (gemstones ? [gemstones] : []),
    images: Array.isArray(images) ? images : (images ? [images] : []),
    stock: stock || 0,
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    weightInGrams,
    dimensions
  };

  if (req.user && req.user.id) productData.createdBy = req.user.id;

  const product = await Product.create(productData);

  successResponse(res, 201, SUCCESS_MESSAGES.PRODUCT_CREATED, { product });
});

// Update Product (Admin)
const updateProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const existing = await Product.findById(productId);
  if (!existing) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));

  // Prevent accidental clearing of arrays when not provided
  const updateData = { ...req.body };
  if (updateData.gemstones && !Array.isArray(updateData.gemstones)) {
    updateData.gemstones = [updateData.gemstones];
  }
  if (updateData.images && !Array.isArray(updateData.images)) {
    updateData.images = [updateData.images];
  }

  const product = await Product.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true
  });

  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_UPDATED, { product });
});

// Soft delete
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));

  product.isActive = false;
  product.deletedAt = new Date();
  if (req.user && req.user.id) product.deletedBy = req.user.id;
  await product.save();

  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_DELETED);
});

// Public: list products with filters
const getUserProducts = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 12, 1);
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  // Search
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  // Category/material/metalType/tags
  if (req.query.category) filter.category = req.query.category;
  if (req.query.material) filter.material = req.query.material;
  if (req.query.metalType) filter.metalType = req.query.metalType;
  if (req.query.tag) filter.tags = req.query.tag;

  // Price range
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // Availability
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };

  // Sorting
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;

  const query = Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortOrder })
    .select('-__v');

  const [products, total] = await Promise.all([query, Product.countDocuments(filter)]);

    if (!products || products.length === 0) {
    return emptyListResponse(res, ERROR_MESSAGES.PRODUCT_NOT_FOUND || 'No products found.', 'products', {
      pagination: {
        totalProducts: 0,
        totalPages: 1,
        currentPage: page,
        pageSize: limit
      }
    });
  }

    // add derived field `outOfStock` to each product for convenience
    const productsWithFlags = products.map(p => {
      const obj = (p.toObject && typeof p.toObject === 'function') ? p.toObject() : p;
      obj.outOfStock = !obj.stock || obj.stock <= 0;
      return obj;
    });

    res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.PRODUCT_FETCHED,
      count: productsWithFlags.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: { products: productsWithFlags }
    });
});

// Admin: list all
const getAdminProducts = catchAsync(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 20, 1);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive !== undefined && req.query.isActive !== null) {
    filter.isActive = req.query.isActive === 'true';
  }
  if (req.query.search) filter.$text = { $search: req.query.search };

  const query = Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');

  const [products, total] = await Promise.all([query, Product.countDocuments(filter)]);

  if (!products || products.length === 0) {
    return emptyListResponse(res, 'No products found', 'products', {
      pagination: {
        totalProducts: 0,
        totalPages: 1,
        currentPage: page,
        pageSize: limit
      }
    });
  }

  const productsWithFlags = products.map(p => {
    const obj = (p.toObject && typeof p.toObject === 'function') ? p.toObject() : p;
    obj.outOfStock = !obj.stock || obj.stock <= 0;
    return obj;
  });

  res.status(200).json({
    success: true,
    message: 'Successfully fetched products for admin.',
    count: productsWithFlags.length,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    data: { products: productsWithFlags },
  });
});

// Admin: update stock (set or adjust)
const updateStock = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const { stock, delta } = req.body; // delta to increment/decrement

  const product = await Product.findById(productId);
  if (!product) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));

  if (typeof delta === 'number') {
    product.stock = Math.max(0, (product.stock || 0) + delta);
  } else if (typeof stock === 'number') {
    product.stock = Math.max(0, stock);
  } else {
    return next(new AppError('Either stock or delta must be provided', 400));
  }

  await product.save();

  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_UPDATED, { product });
});

// Exporting functions at the end of the file (after all are defined)

// Public: get by id (must be active)
const getProductById = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  if (!productId) return next(new AppError(ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 400));

  const product = await Product.findById(productId);
  if (!product || !product.isActive) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));

  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_FETCHED, { product });
});

// Admin: get by id
const getProductByIdAdmin = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  if (!productId) return next(new AppError(ERROR_MESSAGES.PRODUCT_ID_REQUIRED, 400));

  const product = await Product.findById(productId);
  if (!product) return next(new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404));

  successResponse(res, 200, SUCCESS_MESSAGES.PRODUCT_FETCHED, { product });
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getAdminProducts,
  getProductById,
  getProductByIdAdmin,
  updateStock
};
