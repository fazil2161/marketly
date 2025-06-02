const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    max: [99, 'Quantity cannot exceed 99']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Store product details at time of adding to cart (in case product changes later)
  productSnapshot: {
    name: String,
    image: String,
    sku: String,
    stock: Number
  }
}, {
  timestamps: true
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  
  // Calculated fields
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Cart metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Save for later / wishlist items
  savedItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Applied coupons/discounts
  appliedCoupons: [{
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  }],
  
  // Session info for guest carts (if needed)
  sessionId: String,
  guestEmail: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ lastActivity: 1 });
cartSchema.index({ 'items.productId': 1 });

// Virtual for total discount
cartSchema.virtual('totalDiscount').get(function() {
  return this.appliedCoupons.reduce((total, coupon) => {
    if (coupon.type === 'fixed') {
      return total + coupon.discount;
    } else {
      return total + (this.subtotal * coupon.discount / 100);
    }
  }, 0);
});

// Virtual for final total after discounts
cartSchema.virtual('finalTotal').get(function() {
  return Math.max(0, this.subtotal - this.totalDiscount);
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  this.lastActivity = new Date();
  next();
});

// Instance method to calculate cart totals
cartSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.totalItems = this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
  
  return this;
};

// Instance method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, price = null) {
  const Product = mongoose.model('Product');
  
  try {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (!product.isActive) {
      throw new Error('Product is not available');
    }
    
    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    
    // Check if item already exists in cart
    const existingItemIndex = this.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );
    
    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = this.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        throw new Error('Insufficient stock for requested quantity');
      }
      
      if (newQuantity > 99) {
        throw new Error('Maximum quantity per item is 99');
      }
      
      this.items[existingItemIndex].quantity = newQuantity;
      this.items[existingItemIndex].price = price || product.price;
    } else {
      // Add new item
      this.items.push({
        productId: productId,
        quantity: quantity,
        price: price || product.price,
        productSnapshot: {
          name: product.name,
          image: product.thumbnail || (product.images[0] && product.images[0].url),
          sku: product.sku,
          stock: product.stock
        }
      });
    }
    
    await this.save();
    return this;
    
  } catch (error) {
    throw error;
  }
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const Product = mongoose.model('Product');
  
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (quantity <= 0) {
      return this.removeItem(productId);
    }
    
    if (quantity > product.stock) {
      throw new Error('Insufficient stock');
    }
    
    if (quantity > 99) {
      throw new Error('Maximum quantity per item is 99');
    }
    
    const itemIndex = this.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );
    
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }
    
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].price = product.price; // Update price to current price
    
    await this.save();
    return this;
    
  } catch (error) {
    throw error;
  }
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  
  await this.save();
  return this;
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.appliedCoupons = [];
  await this.save();
  return this;
};

// Instance method to move item to saved items
cartSchema.methods.saveForLater = async function(productId) {
  const itemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  // Check if already in saved items
  const alreadySaved = this.savedItems.some(
    saved => saved.productId.toString() === productId.toString()
  );
  
  if (!alreadySaved) {
    this.savedItems.push({
      productId: productId,
      savedAt: new Date()
    });
  }
  
  // Remove from cart items
  this.items.splice(itemIndex, 1);
  
  await this.save();
  return this;
};

// Instance method to move saved item back to cart
cartSchema.methods.moveToCart = async function(productId, quantity = 1) {
  const savedItemIndex = this.savedItems.findIndex(
    saved => saved.productId.toString() === productId.toString()
  );
  
  if (savedItemIndex === -1) {
    throw new Error('Item not found in saved items');
  }
  
  // Add to cart
  await this.addItem(productId, quantity);
  
  // Remove from saved items
  this.savedItems.splice(savedItemIndex, 1);
  
  await this.save();
  return this;
};

// Instance method to apply coupon
cartSchema.methods.applyCoupon = function(couponCode, discount, type = 'percentage') {
  // Check if coupon already applied
  const existingCoupon = this.appliedCoupons.find(
    coupon => coupon.code === couponCode
  );
  
  if (existingCoupon) {
    throw new Error('Coupon already applied');
  }
  
  this.appliedCoupons.push({
    code: couponCode,
    discount: discount,
    type: type
  });
  
  return this.save();
};

// Instance method to remove coupon
cartSchema.methods.removeCoupon = function(couponCode) {
  this.appliedCoupons = this.appliedCoupons.filter(
    coupon => coupon.code !== couponCode
  );
  
  return this.save();
};

// Instance method to validate cart items (check stock, prices, etc.)
cartSchema.methods.validateCart = async function() {
  const Product = mongoose.model('Product');
  const issues = [];
  
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items[i];
    const product = await Product.findById(item.productId);
    
    if (!product) {
      issues.push({
        productId: item.productId,
        issue: 'Product no longer exists',
        action: 'remove'
      });
      continue;
    }
    
    if (!product.isActive) {
      issues.push({
        productId: item.productId,
        issue: 'Product is no longer available',
        action: 'remove'
      });
      continue;
    }
    
    if (product.stock < item.quantity) {
      issues.push({
        productId: item.productId,
        issue: `Only ${product.stock} items available`,
        action: 'update_quantity',
        availableStock: product.stock
      });
    }
    
    if (product.price !== item.price) {
      issues.push({
        productId: item.productId,
        issue: 'Price has changed',
        action: 'update_price',
        oldPrice: item.price,
        newPrice: product.price
      });
    }
  }
  
  return issues;
};

// Instance method to get cart with populated products
cartSchema.methods.getPopulatedCart = function() {
  return this.populate({
    path: 'items.productId',
    select: 'name price images stock isActive category'
  }).populate({
    path: 'savedItems.productId',
    select: 'name price images stock isActive category'
  });
};

// Static method to find or create cart for user
cartSchema.statics.findOrCreateForUser = async function(userId) {
  let cart = await this.findOne({ userId: userId });
  
  if (!cart) {
    cart = new this({ userId: userId });
    await cart.save();
  }
  
  return cart;
};

// Static method to merge guest cart with user cart
cartSchema.statics.mergeGuestCart = async function(userId, guestCartItems) {
  const userCart = await this.findOrCreateForUser(userId);
  
  for (const guestItem of guestCartItems) {
    await userCart.addItem(guestItem.productId, guestItem.quantity, guestItem.price);
  }
  
  return userCart;
};

// Static method to cleanup old inactive carts
cartSchema.statics.cleanupOldCarts = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    lastActivity: { $lt: cutoffDate },
    totalItems: 0
  });
};

module.exports = mongoose.model('Cart', cartSchema); 