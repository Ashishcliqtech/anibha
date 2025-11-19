const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { addToCart, getCart, updateCartItem, removeCartItem, clearCart } = require('../controllers/cartController');

router.use(protect);

router.post('/cart/add', addToCart);
router.get('/cart', getCart);
router.patch('/cart/update', updateCartItem);
router.delete('/cart/remove/:productId', removeCartItem);
router.delete('/cart/clear', clearCart);

module.exports = router;
