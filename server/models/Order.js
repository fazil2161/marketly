const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    required: true
  },
  sku: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1 // Percentage as decimal
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Shipping Information
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'United States'
    }
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
    default: 'credit_card'
  },
  paymentIntentId: String, // Stripe payment intent ID
  transactionId: String,
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  
  // Tracking
  trackingNumber: String,
  carrier: String,
  estimatedDelivery: Date,
  
  // Timestamps for status changes
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Additional Information
  notes: String,
  customerNotes: String,
  
  // Cancellation/Return Information
  cancellationReason: String,
  returnReason: String,
  refundAmount: {
    type: Number,
    min: 0
  },
  
  // Delivery Information
  deliveredAt: Date,
  deliverySignature: String,
  
  // Marketing
  source: {
    type: String,
    enum: ['web', 'mobile', 'admin', 'api'],
    default: 'web'
  },
  
  // Invoice
  invoiceNumber: String,
  invoiceDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'shippingAddress.email': 1 });

// Virtual for full shipping address
orderSchema.virtual('fullShippingAddress').get(function() {
  const addr = this.shippingAddress;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Virtual for customer full name
orderSchema.virtual('customerFullName').get(function() {
  const addr = this.shippingAddress;
  return `${addr.firstName} ${addr.lastName}`;
});

// Virtual for current status info
orderSchema.virtual('currentStatusInfo').get(function() {
  if (this.statusHistory && this.statusHistory.length > 0) {
    return this.statusHistory[this.statusHistory.length - 1];
  }
  return null;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber && this.isNew) {
    // Generate order number: ORD-YYYYMMDD-XXXXX
    const date = new Date();
    const dateString = date.getFullYear().toString() + 
                      (date.getMonth() + 1).toString().padStart(2, '0') + 
                      date.getDate().toString().padStart(2, '0');
    
    // Get count of orders today for sequential numbering
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const todayOrdersCount = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequentialNumber = (todayOrdersCount + 1).toString().padStart(5, '0');
    this.orderNumber = `ORD-${dateString}-${sequentialNumber}`;
  }
  next();
});

// Pre-save middleware to add status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  } else if (this.isNew) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date()
    }];
  }
  next();
});

// Pre-save middleware to generate invoice number
orderSchema.pre('save', function(next) {
  if (!this.invoiceNumber && this.paymentStatus === 'paid') {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.invoiceNumber = `INV-${year}${month}-${random}`;
    this.invoiceDate = date;
  }
  next();
});

// Static method to get orders with pagination
orderSchema.statics.getPaginated = function(userId = null, page = 1, limit = 10, status = null) {
  const skip = (page - 1) * limit;
  const query = {};
  
  if (userId) query.userId = userId;
  if (status) query.status = status;
  
  return this.find(query)
    .populate('userId', 'name email')
    .populate('items.productId', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = function(userId = null, timeframe = 'month') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const matchStage = {
    createdAt: { $gte: startDate }
  };
  
  if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '', updatedBy = null) {
  this.status = newStatus;
  
  const statusEntry = {
    status: newStatus,
    timestamp: new Date()
  };
  
  if (note) statusEntry.note = note;
  if (updatedBy) statusEntry.updatedBy = updatedBy;
  
  this.statusHistory.push(statusEntry);
  
  // Set delivered timestamp
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }
  
  return this.save();
};

// Instance method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.tax = this.subtotal * (this.taxRate || 0);
  this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
  
  return this;
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

// Instance method to check if order can be returned
orderSchema.methods.canBeReturned = function() {
  if (this.status !== 'delivered') return false;
  
  const deliveryDate = new Date(this.deliveredAt || this.updatedAt);
  const now = new Date();
  const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
  
  return daysSinceDelivery <= 30; // 30-day return policy
};

// Static method to get revenue by time period
orderSchema.statics.getRevenueByPeriod = function(period = 'month', year = null) {
  const currentYear = year || new Date().getFullYear();
  
  let groupBy;
  if (period === 'month') {
    groupBy = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
  } else if (period === 'day') {
    groupBy = { 
      day: { $dayOfMonth: '$createdAt' },
      month: { $month: '$createdAt' },
      year: { $year: '$createdAt' }
    };
  }
  
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

module.exports = mongoose.model('Order', orderSchema); 