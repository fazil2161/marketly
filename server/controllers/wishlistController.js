const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// @desc    Get user's wishlist
// @route   GET /api/products/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  try {
    console.log('Getting wishlist for user:', req.user.id);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User wishlist items:', user.wishlist.length);

    // Populate wishlist with proper error handling
    let populatedUser;
    try {
      populatedUser = await User.findById(req.user.id).populate({
        path: 'wishlist',
        model: 'Product',
        select: 'name description price salePrice images category brand stock isActive averageRating numReviews thumbnail',
        match: { isActive: true } // Only populate active products
      });
    } catch (populateError) {
      console.error('Populate error:', populateError);
      // If populate fails, return empty wishlist rather than erroring
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'Wishlist loaded with some items unavailable'
      });
    }

    // Filter out any null products (deleted or inactive products)
    const validWishlistItems = populatedUser.wishlist.filter(item => item !== null && item.isActive);

    // If there were invalid items, clean up the user's wishlist
    if (validWishlistItems.length !== user.wishlist.length) {
      console.log('Cleaning up invalid wishlist items');
      user.wishlist = validWishlistItems.map(item => item._id);
      await user.save();
    }

    console.log('Valid wishlist items:', validWishlistItems.length);

    res.status(200).json({
      success: true,
      data: validWishlistItems,
      count: validWishlistItems.length
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist',
      error: error.message
    });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/products/wishlist
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not available'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist'
      });
    }

    // Add product to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: {
        productId,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/products/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product is in wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product is not in your wishlist'
      });
    }

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: {
        productId,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message
    });
  }
});

// @desc    Check if product is in wishlist
// @route   GET /api/products/wishlist/check/:productId
// @access  Private
const isInWishlist = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const inWishlist = user.wishlist.includes(productId);

    res.status(200).json({
      success: true,
      data: {
        productId,
        inWishlist
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist status',
      error: error.message
    });
  }
});

// @desc    Share wishlist (generate shareable link)
// @route   POST /api/products/wishlist/share
// @access  Private
const shareWishlist = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate a shareable link (in a real app, you might want to create a unique share token)
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/shared/${user._id}`;

    res.status(200).json({
      success: true,
      message: 'Wishlist share link generated',
      data: {
        shareUrl,
        wishlistCount: user.wishlist.length
      }
    });
  } catch (error) {
    console.error('Share wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share link',
      error: error.message
    });
  }
});

// @desc    Clear entire wishlist
// @route   DELETE /api/products/wishlist
// @access  Private
const clearWishlist = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.wishlist = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        wishlistCount: 0
      }
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  shareWishlist,
  clearWishlist
}; 