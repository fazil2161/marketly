const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }

    // Filter out inactive products and calculate totals
    const validItems = cart.items.filter(item => 
      item.productId && item.productId.isActive && item.productId.stock > 0
    );

    // Update cart if items were removed due to inactive products
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculate cart totals
    const subtotal = validItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const totalItems = validItems.reduce((total, item) => total + item.quantity, 0);

    // Transform items to match frontend structure
    const transformedItems = validItems.map(item => ({
      _id: item._id,
      product: item.productId, // Rename productId to product
      quantity: item.quantity,
      price: item.price, // Use stored price from cart item
      addedAt: item.addedAt
    }));

    res.json({
      success: true,
      data: {
        items: transformedItems,
        savedForLater: [], // Add this for frontend compatibility
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check stock availability
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add ${quantity} more items. Only ${product.stock - cart.items[existingItemIndex].quantity} items available`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price; // Update price
    } else {
      // Add new item to cart
      cart.items.push({ 
        productId, 
        quantity,
        price: product.price // Add price from product
      });
    }

    await cart.save();

    // Populate cart items for response
    await cart.populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    // Transform items to match frontend structure
    const transformedItems = cart.items.map(item => ({
      _id: item._id,
      product: item.productId, // Rename productId to product
      quantity: item.quantity,
      price: item.price, // Use stored price from cart item
      addedAt: item.addedAt
    }));

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        items: transformedItems,
        savedForLater: [], // Add this for frontend compatibility
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Check if product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check stock availability
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price; // Update price as well
    await cart.save();

    // Populate cart items for response
    await cart.populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    // Transform items to match frontend structure
    const transformedItems = cart.items.map(item => ({
      _id: item._id,
      product: item.productId, // Rename productId to product
      quantity: item.quantity,
      price: item.price, // Use stored price from cart item
      addedAt: item.addedAt
    }));

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        items: transformedItems,
        savedForLater: [], // Add this for frontend compatibility
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find and remove item
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate cart items for response
    await cart.populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    // Transform items to match frontend structure
    const transformedItems = cart.items.map(item => ({
      _id: item._id,
      product: item.productId, // Rename productId to product
      quantity: item.quantity,
      price: item.price, // Use stored price from cart item
      addedAt: item.addedAt
    }));

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        items: transformedItems,
        savedForLater: [], // Add this for frontend compatibility
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        savedForLater: [], // Add this for frontend compatibility
        subtotal: 0,
        totalItems: 0,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Merge guest cart with user cart (for when user logs in)
exports.mergeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guestCartItems = [] } = req.body;

    if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest cart data'
      });
    }

    // Get or create user cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Process each guest cart item
    for (const guestItem of guestCartItems) {
      const { productId, quantity } = guestItem;

      // Validate product
      const product = await Product.findById(productId);
      if (!product || !product.isActive) continue;

      // Check if item exists in user cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Merge quantities (up to stock limit)
        const totalQuantity = cart.items[existingItemIndex].quantity + quantity;
        cart.items[existingItemIndex].quantity = Math.min(totalQuantity, product.stock);
      } else {
        // Add new item (up to stock limit)
        cart.items.push({
          productId,
          quantity: Math.min(quantity, product.stock)
        });
      }
    }

    await cart.save();

    // Populate and return merged cart
    await cart.populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    // Calculate totals
    const subtotal = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    // Transform items to match frontend structure
    const transformedItems = cart.items.map(item => ({
      _id: item._id,
      product: item.productId, // Rename productId to product
      quantity: item.quantity,
      price: item.price, // Use stored price from cart item
      addedAt: item.addedAt
    }));

    res.json({
      success: true,
      message: 'Cart merged successfully',
      data: {
        items: transformedItems,
        savedForLater: [], // Add this for frontend compatibility
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalItems,
        _id: cart._id,
        userId: cart.userId,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge cart',
      error: error.message
    });
  }
};

// Get cart item count
exports.getCartItemCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({
        success: true,
        itemCount: 0
      });
    }

    const totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

    res.json({
      success: true,
      itemCount: totalItems
    });
  } catch (error) {
    console.error('Get cart item count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cart item count',
      error: error.message
    });
  }
};

// Debug: Get raw cart data (development only)
exports.getCartDebug = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Not available in production' });
    }
    
    // If user is authenticated, show their cart, otherwise show all carts for debugging
    let query = {};
    if (req.user && req.user.id) {
      query = { userId: req.user.id };
    }
    
    const carts = await Cart.find(query).populate({
      path: 'items.productId',
      select: 'name price images stock isActive'
    });

    res.json({
      success: true,
      debug: true,
      authenticated: !!req.user,
      data: {
        cartsCount: carts.length,
        carts: carts.map(cart => ({
          _id: cart._id,
          userId: cart.userId,
          itemsCount: cart.items.length,
          items: cart.items.map(item => ({
            _id: item._id,
            productId: item.productId ? item.productId._id : 'null',
            productName: item.productId ? item.productId.name : 'null',
            quantity: item.quantity,
            cartItemPrice: item.price,
            productPrice: item.productId ? item.productId.price : 'N/A',
            productImages: item.productId ? item.productId.images : [],
            productStock: item.productId ? item.productId.stock : 'N/A'
          }))
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 