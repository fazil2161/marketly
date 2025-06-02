const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false // Optional reference to verify purchase
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
    maxlength: [100, 'Review title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a review comment'],
    trim: true,
    maxlength: [1000, 'Review comment cannot exceed 1000 characters']
  },
  
  // Review metadata
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true // Auto-approve by default, can be changed to false for moderation
  },
  isHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  isNotHelpful: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Additional review details
  pros: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  cons: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  
  // Product-specific ratings (optional)
  productQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  valueForMoney: {
    type: Number,
    min: 1,
    max: 5
  },
  deliverySpeed: {
    type: Number,
    min: 1,
    max: 5
  },
  customerService: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Review images (optional)
  images: [{
    url: String,
    public_id: String, // For Cloudinary
    alt: String
  }],
  
  // Moderation
  flaggedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  flaggedReasons: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Admin actions
  adminNotes: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  
  // User interactions
  helpfulVotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: Boolean, // true for helpful, false for not helpful
    votedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true }); // One review per user per product
reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  const totalVotes = this.isHelpful + this.isNotHelpful;
  if (totalVotes === 0) return 0;
  return Math.round((this.isHelpful / totalVotes) * 100);
});

// Virtual for overall score (considering sub-ratings)
reviewSchema.virtual('overallScore').get(function() {
  const ratings = [
    this.productQuality,
    this.valueForMoney,
    this.deliverySpeed,
    this.customerService
  ].filter(rating => rating !== undefined && rating !== null);
  
  if (ratings.length === 0) return this.rating;
  
  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return Math.round(average * 10) / 10; // Round to 1 decimal place
});

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
});

// Pre-save middleware to check verified purchase
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.orderId) {
    const Order = mongoose.model('Order');
    
    try {
      const order = await Order.findOne({
        _id: this.orderId,
        userId: this.userId,
        'items.productId': this.productId,
        status: 'delivered'
      });
      
      this.isVerifiedPurchase = !!order;
    } catch (error) {
      console.error('Error checking verified purchase:', error);
    }
  }
  next();
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function() {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.productId);
    
    if (product) {
      await product.updateRating();
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function() {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(this.productId);
    
    if (product) {
      await product.updateRating();
    }
  } catch (error) {
    console.error('Error updating product rating after review removal:', error);
  }
});

// Static method to get reviews with pagination
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    rating = null,
    verifiedOnly = false
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  const query = {
    productId: productId,
    isApproved: true
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  if (verifiedOnly) {
    query.isVerifiedPurchase = true;
  }
  
  return this.find(query)
    .populate('userId', 'name profilePicture')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

// Static method to get review statistics for a product
reviewSchema.statics.getProductReviewStats = function(productId) {
  return this.aggregate([
    {
      $match: {
        productId: mongoose.Types.ObjectId(productId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        verifiedReviews: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        verifiedReviews: 1,
        verifiedPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$verifiedReviews', '$totalReviews'] }, 100] },
            1
          ]
        },
        ratingDistribution: 1
      }
    }
  ]);
};

// Static method to get rating distribution
reviewSchema.statics.getRatingDistribution = function(productId) {
  return this.aggregate([
    {
      $match: {
        productId: mongoose.Types.ObjectId(productId),
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);
};

// Instance method to vote on review helpfulness
reviewSchema.methods.voteHelpful = function(userId, isHelpful) {
  // Check if user already voted
  const existingVoteIndex = this.helpfulVotes.findIndex(
    vote => vote.userId.toString() === userId.toString()
  );
  
  if (existingVoteIndex > -1) {
    // Update existing vote
    const oldVote = this.helpfulVotes[existingVoteIndex].isHelpful;
    this.helpfulVotes[existingVoteIndex].isHelpful = isHelpful;
    this.helpfulVotes[existingVoteIndex].votedAt = new Date();
    
    // Update counters
    if (oldVote && !isHelpful) {
      this.isHelpful = Math.max(0, this.isHelpful - 1);
      this.isNotHelpful += 1;
    } else if (!oldVote && isHelpful) {
      this.isNotHelpful = Math.max(0, this.isNotHelpful - 1);
      this.isHelpful += 1;
    }
  } else {
    // Add new vote
    this.helpfulVotes.push({
      userId: userId,
      isHelpful: isHelpful,
      votedAt: new Date()
    });
    
    // Update counters
    if (isHelpful) {
      this.isHelpful += 1;
    } else {
      this.isNotHelpful += 1;
    }
  }
  
  return this.save();
};

// Instance method to flag review
reviewSchema.methods.flagReview = function(reason, reportedBy) {
  const validReasons = ['inappropriate', 'spam', 'fake', 'offensive', 'other'];
  
  if (!validReasons.includes(reason)) {
    throw new Error('Invalid flag reason');
  }
  
  // Check if user already flagged this review
  const alreadyFlagged = this.flaggedReasons.some(
    flag => flag.reportedBy.toString() === reportedBy.toString()
  );
  
  if (alreadyFlagged) {
    throw new Error('You have already flagged this review');
  }
  
  this.flaggedReasons.push({
    reason: reason,
    reportedBy: reportedBy,
    reportedAt: new Date()
  });
  
  this.flaggedCount += 1;
  
  // Auto-hide review if flagged too many times
  if (this.flaggedCount >= 5) {
    this.isApproved = false;
  }
  
  return this.save();
};

// Instance method to moderate review
reviewSchema.methods.moderate = function(action, moderatorId, notes = '') {
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.adminNotes = notes;
  
  if (action === 'approve') {
    this.isApproved = true;
  } else if (action === 'reject') {
    this.isApproved = false;
  }
  
  return this.save();
};

// Static method to get reviews that need moderation
reviewSchema.statics.getReviewsForModeration = function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    $or: [
      { flaggedCount: { $gte: 3 } },
      { isApproved: false }
    ]
  })
  .populate('userId', 'name email')
  .populate('productId', 'name')
  .populate('flaggedReasons.reportedBy', 'name')
  .sort({ flaggedCount: -1, createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get user's reviews
reviewSchema.statics.getUserReviews = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId: userId })
    .populate('productId', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema); 