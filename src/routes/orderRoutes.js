const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { checkout, getUserOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');

router.use(protect);

router.post('/orders/checkout', checkout);
router.get('/orders', getUserOrders);
router.get('/orders/:id', getOrderById);

// Admin routes
router.patch('/admin/orders/:id', protect, adminOnly, updateOrderStatus);

module.exports = router;
