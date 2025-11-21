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
    mainImage,
    stock,
    tags,
    weightInGrams,
    dimensions
  } = req.body;

  // MRP / discount fields (server will compute selling price from these when provided)
  const { mrp, discountPercent, discountAmount } = req.body;

  // Validate discount inputs early
  const parsedMrp = (mrp !== undefined && mrp !== null && mrp !== '') ? Number(mrp) : undefined;
  const parsedDiscountPercent = (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') ? Number(discountPercent) : undefined;
  const parsedDiscountAmount = (discountAmount !== undefined && discountAmount !== null && discountAmount !== '') ? Number(discountAmount) : undefined;

  if (parsedDiscountPercent !== undefined && (isNaN(parsedDiscountPercent) || parsedDiscountPercent < 0 || parsedDiscountPercent > 100)) {
    return next(new AppError('`discountPercent` must be a number between 0 and 100', 400));
  }
  if (parsedDiscountAmount !== undefined && (isNaN(parsedDiscountAmount) || parsedDiscountAmount < 0)) {
    return next(new AppError('`discountAmount` must be a non-negative number', 400));
  }

  // Additional descriptive fields from product detail view
  const {
    brand,
    modelNumber,
    baseMaterial,
    color,
    type: productType,
    idealFor,
    plating,
    certification,
    netQuantity,
    brandColor,
    warrantySummary,
    domesticWarranty,
    internationalWarranty,
    salesPackage,
    collection,
    occasion,
    otherDimensions,
    chainLength
  } = req.body;

  // Basic validation - rely on mongoose for deep validation
  if (!name || !description || price === undefined) {
    return next(new AppError(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS, 400));
  }

  const productData = {
    name,
    description,
    // price may be computed below from MRP/discount; include provided price as fallback
    price,
    currency,
    sku,
    category,
    material,
    metalType,
    gemstones: Array.isArray(gemstones) ? gemstones : (gemstones ? [gemstones] : []),
    images: Array.isArray(images) ? images : (images ? [images] : []),
    mainImage: mainImage || undefined,
    stock: stock || 0,
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    weightInGrams,
    dimensions
  };

  // Include MRP/discount into saved document (optional)
  if (parsedMrp !== undefined) productData.mrp = parsedMrp;
  if (parsedDiscountPercent !== undefined) productData.discountPercent = parsedDiscountPercent;
  if (parsedDiscountAmount !== undefined) productData.discountAmount = parsedDiscountAmount;

  // Compute price from MRP + discount if provided. Priority:
  // 1) If mrp + discountPercent => price = mrp * (1 - discountPercent/100)
  // 2) Else if mrp + discountAmount => price = mrp - discountAmount
  // 3) Else if mrp only => price = mrp
  // 4) Else use provided `price` value
  if (productData.mrp !== undefined && productData.mrp !== null) {
    const m = Number(productData.mrp);
    if (productData.discountPercent !== undefined && productData.discountPercent !== null) {
      productData.price = Math.max(0, Math.round((m * (1 - Number(productData.discountPercent) / 100)) * 100) / 100);
    } else if (productData.discountAmount !== undefined && productData.discountAmount !== null) {
      productData.price = Math.max(0, Math.round((m - Number(productData.discountAmount)) * 100) / 100);
    } else {
      productData.price = Math.round(m * 100) / 100;
    }
  }

  // Ensure MRP is not less than computed price
  if (productData.mrp !== undefined && productData.price !== undefined && productData.price > productData.mrp) {
    return next(new AppError('Computed selling price cannot exceed MRP', 400));
  }

  // Include optional descriptive fields if provided
  if (brand) productData.brand = brand;
  if (modelNumber) productData.modelNumber = modelNumber;
  if (baseMaterial) productData.baseMaterial = baseMaterial;
  if (color) productData.color = color;
  if (productType) productData.type = productType;
  if (idealFor) productData.idealFor = idealFor;
  if (plating) productData.plating = plating;
  if (certification) productData.certification = certification;
  if (netQuantity !== undefined) productData.netQuantity = Number(netQuantity);
  if (brandColor) productData.brandColor = brandColor;
  if (warrantySummary) productData.warrantySummary = warrantySummary;
  if (domesticWarranty) productData.domesticWarranty = domesticWarranty;
  if (internationalWarranty) productData.internationalWarranty = internationalWarranty;
  if (salesPackage) productData.salesPackage = salesPackage;
  if (collection) productData.collection = collection;
  if (occasion) productData.occasion = occasion;
  if (otherDimensions) productData.otherDimensions = otherDimensions;
  if (chainLength) productData.chainLength = chainLength;

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
  // Allow updating/replacing mainImage as a string URL
  if (updateData.mainImage !== undefined && updateData.mainImage !== null) {
    updateData.mainImage = updateData.mainImage;
  }

  // If MRP/discount values are being updated, compute price accordingly
  // Recompute price if any price-related fields are changing
  const priceFieldTouched = (updateData.mrp !== undefined) || (updateData.discountPercent !== undefined) || (updateData.discountAmount !== undefined);
  if (priceFieldTouched) {
    const effectiveMrp = (updateData.mrp !== undefined && updateData.mrp !== null && updateData.mrp !== '') ? Number(updateData.mrp) : existing.mrp;
    const effectiveDiscountPercent = (updateData.discountPercent !== undefined && updateData.discountPercent !== null && updateData.discountPercent !== '') ? Number(updateData.discountPercent) : existing.discountPercent;
    const effectiveDiscountAmount = (updateData.discountAmount !== undefined && updateData.discountAmount !== null && updateData.discountAmount !== '') ? Number(updateData.discountAmount) : existing.discountAmount;

    if (effectiveDiscountPercent !== undefined && effectiveDiscountPercent !== null && (isNaN(effectiveDiscountPercent) || effectiveDiscountPercent < 0 || effectiveDiscountPercent > 100)) {
      return next(new AppError('`discountPercent` must be a number between 0 and 100', 400));
    }
    if (effectiveDiscountAmount !== undefined && (isNaN(effectiveDiscountAmount) || effectiveDiscountAmount < 0)) {
      return next(new AppError('`discountAmount` must be a non-negative number', 400));
    }

    if (effectiveMrp !== undefined && effectiveMrp !== null) {
      const m = Number(effectiveMrp);
      let newPrice = undefined;
      if (effectiveDiscountPercent !== undefined && effectiveDiscountPercent !== null) {
        newPrice = Math.max(0, Math.round((m * (1 - Number(effectiveDiscountPercent) / 100)) * 100) / 100);
      } else if (effectiveDiscountAmount !== undefined && effectiveDiscountAmount !== null) {
        newPrice = Math.max(0, Math.round((m - Number(effectiveDiscountAmount)) * 100) / 100);
      } else {
        newPrice = Math.round(m * 100) / 100;
      }

      // Ensure computed price does not exceed MRP
      if (newPrice > m) {
        return next(new AppError('Computed selling price cannot exceed MRP', 400));
      }

      updateData.price = newPrice;
    } else {
      // No effective MRP available; if discounts are provided without MRP we cannot validate; allow setting discount fields but do not compute price
      if (updateData.discountPercent !== undefined || updateData.discountAmount !== undefined) {
        // Try to compute using existing.mrp if present
        if (existing.mrp !== undefined && existing.mrp !== null) {
          const m = Number(existing.mrp);
          let newPrice;
          if (effectiveDiscountPercent !== undefined && effectiveDiscountPercent !== null) {
            newPrice = Math.max(0, Math.round((m * (1 - Number(effectiveDiscountPercent) / 100)) * 100) / 100);
          } else if (effectiveDiscountAmount !== undefined && effectiveDiscountAmount !== null) {
            newPrice = Math.max(0, Math.round((m - Number(effectiveDiscountAmount)) * 100) / 100);
          }
          if (newPrice !== undefined) updateData.price = newPrice;
        }
      }
    }
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
