const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [2000, 'Product description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative'],
    set: function(val) {
      return Math.round(val * 100) / 100; // Round to 2 decimal places
    }
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    set: function(val) {
      return val ? Math.round(val * 100) / 100 : val;
    }
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: {
      values: [
        'Electronics',
        'Clothing',
        'Books',
        'Home & Garden',
        'Sports & Outdoors',
        'Health & Beauty',
        'Toys & Games',
        'Food & Beverages',
        'Automotive',
        'Jewelry',
        'Others'
      ],
      message: 'Please select a valid category'
    }
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple documents with null/undefined SKU
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: String, // For Cloudinary
    alt: String
  }],
  thumbnail: {
    type: String,
    default: function() {
      return this.images && this.images.length > 0 ? this.images[0].url : '';
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  features: [{
    name: String,
    value: String
  }],
  specifications: {
    type: Map,
    of: String
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch', 'mm'],
      default: 'cm'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    set: function(val) {
      return Math.round(val * 10) / 10; // Round to 1 decimal place
    }
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: -1 });
productSchema.index({ stock: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || this.originalPrice <= this.price) {
    return 0;
  }
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= 5) return 'Low Stock';
  if (this.stock <= 20) return 'Limited Stock';
  return 'In Stock';
});

// Virtual to populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
  justOne: false
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku && this.isNew) {
    // Generate SKU: CATEGORY-TIMESTAMP-RANDOM
    const category = this.category.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `${category}-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to update thumbnail
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    this.thumbnail = this.images[0].url;
  }
  next();
});

// Static method to search products
productSchema.statics.searchProducts = function(query, options = {}) {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    inStock = true
  } = options;

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Build search criteria
  const searchCriteria = {
    isActive: true
  };

  if (inStock) {
    searchCriteria.stock = { $gt: 0 };
  }

  if (query) {
    searchCriteria.$text = { $search: query };
  }

  if (category) {
    searchCriteria.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    searchCriteria.price = {};
    if (minPrice !== undefined) searchCriteria.price.$gte = minPrice;
    if (maxPrice !== undefined) searchCriteria.price.$lte = maxPrice;
  }

  return this.find(searchCriteria)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name');
};

// Static method to get featured products
productSchema.statics.getFeaturedProducts = function(limit = 8) {
  return this.find({
    isActive: true,
    isFeatured: true,
    stock: { $gt: 0 }
  })
  .sort({ averageRating: -1, totalSold: -1 })
  .limit(limit);
};

// Static method to get related products
productSchema.statics.getRelatedProducts = function(productId, category, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    category: category,
    isActive: true,
    stock: { $gt: 0 }
  })
  .sort({ averageRating: -1 })
  .limit(limit);
};

// Instance method to update rating
productSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  
  const stats = await Review.aggregate([
    {
      $match: { productId: this._id }
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.averageRating = stats[0].avgRating;
    this.numReviews = stats[0].numReviews;
  } else {
    this.averageRating = 0;
    this.numReviews = 0;
  }

  await this.save({ validateBeforeSave: false });
};

// Instance method to increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'subtract') {
  if (operation === 'subtract') {
    this.stock = Math.max(0, this.stock - quantity);
    this.totalSold += quantity;
  } else if (operation === 'add') {
    this.stock += quantity;
  }
  return this.save({ validateBeforeSave: false });
};

// Static method to get products by category
productSchema.statics.getByCategory = function(category, options = {}) {
  const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  return this.find({
    category: category,
    isActive: true,
    stock: { $gt: 0 }
  })
  .sort(sort)
  .skip(skip)
  .limit(limit);
};

// Static method to get price range for category
productSchema.statics.getPriceRange = function(category = null) {
  const match = { isActive: true };
  if (category) match.category = category;

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);
};

module.exports = mongoose.model('Product', productSchema); 