const express = require('express');
const router = express.Router();

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getUserProducts,
  getAdminProducts,
  getProductById,
  getProductByIdAdmin
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middleware/authMiddleware');
const { uploadImagesToCloudinary } = require('../middleware/uploadMiddleware');

// Public
router.get('/products', getUserProducts);
router.get('/products/:id', getProductById);

// Admin
router.get('/admin/products', protect, adminOnly, getAdminProducts);
router.get('/admin/products/:id', protect, adminOnly, getProductByIdAdmin);

// Create product - image upload first (if multipart)
router.post(
  '/admin/create-products',
  protect,
  adminOnly,
  // accept a single main image and additional images in one request
  uploadImagesToCloudinary([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ], 'products'),
  createProduct
);

// Update product - PATCH
router.patch(
  '/admin/products/:id',
  protect,
  adminOnly,
  // accept a single main image and additional images in one request
  uploadImagesToCloudinary([
    { name: 'mainImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ], 'products'),
  updateProduct
);
// Admin: update product stock
const { updateStock } = require('../controllers/productController');
router.patch('/admin/products/:id/stock', protect, adminOnly, updateStock);

// Soft delete
router.patch('/admin/delete-products/:id', protect, adminOnly, deleteProduct);

module.exports = router;
