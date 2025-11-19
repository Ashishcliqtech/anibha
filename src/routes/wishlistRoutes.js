const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');

router.use(protect);

router.post('/wishlist/add', addToWishlist);
router.delete('/wishlist/remove/:productId', removeFromWishlist);
router.get('/wishlist', getWishlist);

module.exports = router;
