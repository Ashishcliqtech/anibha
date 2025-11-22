const Product = require('../models/Product');
const { AppError } = require('../utils/errorUtils');
const { ERROR_MESSAGES } = require('../utils/constant/Messages');

/**
 * Calculates the final selling price based on MRP and discounts.
 * Throws an error if validation fails.
 * @param {object} data - Object containing price-related fields.
 * @returns {number} - The calculated price.
 * @private
 */
const _calculatePrice = (data) => {
  const { price: initialPrice, mrp, discountPercent, discountAmount } = data;

  // Validate discount inputs
  if (discountPercent !== undefined && discountPercent !== null && (isNaN(Number(discountPercent)) || Number(discountPercent) < 0 || Number(discountPercent) > 100)) {
    throw new AppError('`discountPercent` must be a number between 0 and 100', 400);
  }
  if (discountAmount !== undefined && discountAmount !== null && (isNaN(Number(discountAmount)) || Number(discountAmount) < 0)) {
    throw new AppError('`discountAmount` must be a non-negative number', 400);
  }

  // If MRP is not provided, we cannot calculate a new price. Return the initial price.
  if (mrp === undefined || mrp === null || mrp === '') {
    return initialPrice;
  }

  const m = Number(mrp);
  let calculatedPrice;

  if (discountPercent !== undefined && discountPercent !== null && discountPercent !== '') {
    calculatedPrice = Math.max(0, Math.round((m * (1 - Number(discountPercent) / 100)) * 100) / 100);
  } else if (discountAmount !== undefined && discountAmount !== null && discountAmount !== '') {
    calculatedPrice = Math.max(0, Math.round((m - Number(discountAmount)) * 100) / 100);
  } else {
    calculatedPrice = Math.round(m * 100) / 100;
  }

  // Ensure MRP is not less than the calculated price
  if (calculatedPrice > m) {
    throw new AppError('Computed selling price cannot exceed MRP', 400);
  }

  return calculatedPrice;
};

/**
 * Prepares product data by normalizing array fields and handling legacy field names.
 * @param {object} productData - The raw product data.
 * @returns {object} - The sanitized product data.
 * @private
 */
const _prepareProductData = (productData) => {
    const data = { ...productData };
    
    // Backward compatibility for 'collection' field
    if (data.collection) {
        data.productCollection = data.collection;
        delete data.collection;
    }

    // Ensure array fields are arrays
    if (data.gemstones && !Array.isArray(data.gemstones)) {
        data.gemstones = [data.gemstones];
    }
    if (data.images && !Array.isArray(data.images)) {
        data.images = [data.images];
    }
    if (data.tags && !Array.isArray(data.tags)) {
        data.tags = [data.tags];
    }
    return data;
};


const createProduct = async (productData, userId) => {
  if (!productData.name || !productData.description || productData.price === undefined) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS, 400);
  }
  
  const data = _prepareProductData(productData);
  data.price = _calculatePrice(data);

  if (userId) {
    data.createdBy = userId;
  }

  const newProduct = new Product(data);
  await newProduct.save();
  return newProduct;
};

const updateProduct = async (productId, updateData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  const dataToUpdate = _prepareProductData(updateData);
  const priceFieldsTouched = dataToUpdate.mrp !== undefined || dataToUpdate.discountPercent !== undefined || dataToUpdate.discountAmount !== undefined;

  if (priceFieldsTouched) {
    const effectiveData = { ...product.toObject(), ...dataToUpdate };
    dataToUpdate.price = _calculatePrice(effectiveData);
  }

  const updatedProduct = await Product.findByIdAndUpdate(productId, dataToUpdate, { new: true, runValidators: true });
  return updatedProduct;
};

const deleteProduct = async (productId, userId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  product.isActive = false;
  product.deletedAt = new Date();
  if (userId) {
    product.deletedBy = userId;
  }
  await product.save();
  // No need to return anything for a delete operation
};

const getProducts = async (queryParams) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    material,
    metalType,
    tag,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    order = 'desc',
    // Admin-specific filter
    isActive,
  } = queryParams;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 12, 1);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  
  // Admin can see inactive products, users can't.
  // If isActive is 'true' or 'false', use it. Otherwise, default to true.
  if (isActive !== undefined && isActive !== null) {
      filter.isActive = isActive === 'true';
  } else {
      filter.isActive = true;
  }

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (material) filter.material = material;
  if (metalType) filter.metalType = metalType;
  if (tag) filter.tags = tag;
  if (inStock === 'true') filter.stock = { $gt: 0 };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const query = Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .populate('category createdBy', 'name email')
    .lean(); // Use lean for performance

  const [products, total] = await Promise.all([
      query, 
      Product.countDocuments(filter)
    ]);

  // Add derived `outOfStock` flag
  const productsWithFlags = products.map(p => ({
    ...p,
    outOfStock: !p.stock || p.stock <= 0,
  }));
  
  return {
    products: productsWithFlags,
    total,
    count: productsWithFlags.length,
    currentPage: pageNum,
    totalPages: Math.ceil(total / limitNum),
  };
};

const getProductById = async (productId, isAdmin = false) => {
  const product = await Product.findById(productId).populate('category').lean();

  if (!product || (!product.isActive && !isAdmin)) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }
  
  // Add derived `outOfStock` flag
  if (product) {
      product.outOfStock = !product.stock || product.stock <= 0;
  }

  return product;
};

const updateStock = async (productId, stockData) => {
  const { stock, delta } = stockData;
  if (stock === undefined && delta === undefined) {
      throw new AppError('Either stock or delta must be provided', 400);
  }
  
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, 404);
  }

  if (typeof delta === 'number') {
    product.stock = Math.max(0, (product.stock || 0) + delta);
  } else if (typeof stock === 'number') {
    product.stock = Math.max(0, stock);
  }

  await product.save();
  return product;
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
  updateStock,
};
