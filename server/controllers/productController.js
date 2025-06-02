const Product = require('../models/Product');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// Get all products with filtering, sorting, search, and pagination
exports.getProducts = async (req, res) => {
  try {
    console.log('Products API called with params:', req.query); // Debug log
    
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    // Category filter
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Search filter
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { brand: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    console.log('Filter object:', JSON.stringify(filter, null, 2));
    console.log('Sort object:', sortObj);

    // Use native MongoDB driver for better performance
    const db = mongoose.connection.db;
    
    // Get products with filtering, sorting, and pagination
    const products = await db.collection('products')
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Get total count for pagination
    const totalProducts = await db.collection('products').countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    console.log(`Found ${products.length} products (${totalProducts} total)`);
    
    res.json({
      success: true,
      data: {
        products: products,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalProducts: totalProducts,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
          limit: limitNum
        }
      }
    });
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate({
        path: 'reviews',
        populate: {
          path: 'userId',
          select: 'name'
        }
      })
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product is not available'
      });
    }

    // Calculate average rating
    if (product.reviews && product.reviews.length > 0) {
      const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
      product.averageRating = parseFloat(avgRating.toFixed(1));
      product.reviewCount = product.reviews.length;
    } else {
      product.averageRating = 0;
      product.reviewCount = 0;
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = { $regex: q, $options: 'i' };
    
    const products = await Product.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { category: searchRegex },
            { tags: { $in: [searchRegex] } }
          ]
        }
      ]
    })
    .select('name price images category averageRating')
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {
      category: { $regex: category, $options: 'i' },
      isActive: true
    };

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('reviews', 'rating')
      .lean();

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limitNum);

    const productsWithRatings = products.map(product => {
      if (product.reviews && product.reviews.length > 0) {
        const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
        return {
          ...product,
          averageRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length
        };
      }
      return {
        ...product,
        averageRating: 0,
        reviewCount: 0
      };
    });

    res.json({
      success: true,
      products: productsWithRatings,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error.message
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    console.log('Getting featured products with limit:', limit);

    // Use native MongoDB driver
    const db = mongoose.connection.db;
    const products = await db.collection('products')
      .find({
        isActive: true,
        isFeatured: true
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();

    console.log(`Found ${products.length} featured products`);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
};

// Get related products
exports.getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Get the current product to find related products
    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find products in the same category, excluding the current product
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: currentProduct.category,
      isActive: true
    })
    .limit(parseInt(limit))
    .populate('reviews', 'rating')
    .lean();

    const productsWithRatings = relatedProducts.map(product => {
      if (product.reviews && product.reviews.length > 0) {
        const avgRating = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
        return {
          ...product,
          averageRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: product.reviews.length
        };
      }
      return {
        ...product,
        averageRating: 0,
        reviewCount: 0
      };
    });

    res.json({
      success: true,
      products: productsWithRatings
    });
  } catch (error) {
    console.error('Get related products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch related products',
      error: error.message
    });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      categories: categories.filter(cat => cat && cat.trim().length > 0)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Create new product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      images,
      tags,
      specifications,
      isFeatured = false
    } = req.body;

    // Validation
    if (!name || !description || !price || !category || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, price, category, and stock are required'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      images: images || [],
      tags: tags || [],
      specifications: specifications || {},
      isFeatured,
      createdBy: req.user.id
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.reviews;

    // Validation for price and stock if provided
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than 0'
      });
    }

    if (updates.stock !== undefined && updates.stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Also delete associated reviews
    await Review.deleteMany({ productId: id });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// Toggle product active status (Admin only)
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      product
    });
  } catch (error) {
    console.error('Toggle product status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product status',
      error: error.message
    });
  }
};

// Get new arrivals
exports.getNewArrivals = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    console.log('Getting new arrivals with limit:', limit);

    // Use native MongoDB driver
    const db = mongoose.connection.db;
    const products = await db.collection('products')
      .find({ isActive: true })
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(parseInt(limit))
      .toArray();

    console.log(`Found ${products.length} new arrivals`);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new arrivals',
      error: error.message
    });
  }
};

// Get best sellers
exports.getBestSellers = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    console.log('Getting best sellers with limit:', limit);

    // Use native MongoDB driver
    const db = mongoose.connection.db;
    const products = await db.collection('products')
      .find({ isActive: true })
      .sort({ totalSold: -1 }) // Sort by total sold (best sellers)
      .limit(parseInt(limit))
      .toArray();

    console.log(`Found ${products.length} best sellers`);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch best sellers',
      error: error.message
    });
  }
}; 