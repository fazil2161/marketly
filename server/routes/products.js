const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  searchProducts,
  getProductsByCategory,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus
} = require('../controllers/productController');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  shareWishlist,
  clearWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Debug route to check products count
router.get('/debug/count', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const totalCount = await Product.countDocuments();
    const activeCount = await Product.countDocuments({ isActive: true });
    const featuredCount = await Product.countDocuments({ isActive: true, isFeatured: true });
    
    res.json({
      success: true,
      data: {
        totalProducts: totalCount,
        activeProducts: activeCount,
        featuredProducts: featuredCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug route for wishlist testing
router.get('/debug/wishlist-test', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      message: 'Wishlist route is accessible',
      data: {
        userId: req.user.id,
        wishlistCount: user?.wishlist?.length || 0,
        userExists: !!user
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Wishlist route test failed',
      error: error.message 
    });
  }
});

// Wishlist routes (protected) - MUST come BEFORE /:id routes
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);
router.get('/wishlist/check/:productId', protect, isInWishlist);
router.post('/wishlist/share', protect, shareWishlist);
router.delete('/wishlist', protect, clearWishlist);

// Public routes with specific paths (before generic /:id)
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/category/:category', getProductsByCategory);

// Generic routes with parameters (MUST come last)
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);

// Admin routes (protected)
router.post('/', protect, isAdmin, createProduct);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.patch('/:id/status', protect, isAdmin, toggleProductStatus);

module.exports = router; 