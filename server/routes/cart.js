const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart,
  getCartItemCount,
  getCartDebug
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Debug route (no auth required in development)
router.get('/debug', getCartDebug);

// All other cart routes require authentication
router.use(protect);

// Cart routes
router.get('/', getCart);
router.get('/count', getCartItemCount);
router.post('/add', addToCart);
router.put('/update/:productId', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);
router.post('/merge', mergeCart);

module.exports = router; 