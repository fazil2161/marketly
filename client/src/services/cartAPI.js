import api from './api';

// Cart endpoints
export const getCart = () => {
  return api.get('/cart');
};

export const addToCart = (itemData) => {
  return api.post('/cart/add', itemData);
};

export const updateQuantity = (productId, quantityData) => {
  return api.put(`/cart/update/${productId}`, quantityData);
};

export const removeFromCart = (productId) => {
  return api.delete(`/cart/remove/${productId}`);
};

export const clearCart = () => {
  return api.delete('/cart/clear');
};

// Save for later endpoints
export const saveForLater = (productId) => {
  return api.put(`/cart/save-later/${productId}`);
};

export const moveToCart = (productId) => {
  return api.put(`/cart/move-to-cart/${productId}`);
};

export const removeSavedItem = (productId) => {
  return api.delete(`/cart/saved/${productId}`);
};

export const getSavedItems = () => {
  return api.get('/cart/saved');
};

export const clearSavedItems = () => {
  return api.delete('/cart/saved/clear');
};

// Cart calculations and utilities
export const calculateCartTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

export const calculateCartItems = (items) => {
  return items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
};

export const calculateCartWeight = (items) => {
  return items.reduce((total, item) => {
    const weight = item.product?.weight || 0;
    return total + (weight * item.quantity);
  }, 0);
};

export const validateCartItem = (item) => {
  const errors = [];
  
  if (!item.product) {
    errors.push('Product information is missing');
  }
  
  if (!item.quantity || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (item.product?.stock !== undefined && item.quantity > item.product.stock) {
    errors.push('Quantity exceeds available stock');
  }
  
  if (!item.price || item.price <= 0) {
    errors.push('Price information is missing or invalid');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatCartForCheckout = (cart) => {
  return {
    items: cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price
    })),
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    subtotal: cart.subtotal || cart.totalPrice,
    tax: cart.tax || 0,
    shipping: cart.shipping || 0,
    discount: cart.discount || 0
  };
};

export const mergeGuestCart = (guestCart) => {
  return api.post('/cart/merge', { guestCart });
};

export const syncCart = (localCart) => {
  return api.post('/cart/sync', { items: localCart });
};

// Bulk operations
export const updateMultipleItems = (updates) => {
  return api.put('/cart/bulk-update', { updates });
};

export const removeMultipleItems = (productIds) => {
  return api.delete('/cart/bulk-remove', { data: { productIds } });
};

export const moveMultipleToSaved = (productIds) => {
  return api.put('/cart/bulk-save', { productIds });
};

export const moveMultipleToCart = (productIds) => {
  return api.put('/cart/bulk-move-to-cart', { productIds });
};

// Cart sharing and wishlist
export const shareCart = (shareData) => {
  return api.post('/cart/share', shareData);
};

export const getSharedCart = (shareToken) => {
  return api.get(`/cart/shared/${shareToken}`);
};

export const addSharedCartItems = (shareToken, selectedItems) => {
  return api.post(`/cart/shared/${shareToken}/add`, { selectedItems });
};

// Cart history and recovery
export const getCartHistory = (page = 1, limit = 10) => {
  return api.get(`/cart/history?page=${page}&limit=${limit}`);
};

export const restoreCart = (cartId) => {
  return api.post(`/cart/restore/${cartId}`);
};

export const saveCartSnapshot = (name) => {
  return api.post('/cart/snapshot', { name });
};

export const getCartSnapshots = () => {
  return api.get('/cart/snapshots');
};

export const deleteCartSnapshot = (snapshotId) => {
  return api.delete(`/cart/snapshots/${snapshotId}`);
};

// Cart recommendations
export const getCartRecommendations = () => {
  return api.get('/cart/recommendations');
};

export const getFrequentlyBoughtTogether = (productId) => {
  return api.get(`/cart/frequently-bought-together/${productId}`);
};

// Cart validation and checks
export const validateCart = () => {
  return api.get('/cart/validate');
};

export const checkProductAvailability = (productIds) => {
  return api.post('/cart/check-availability', { productIds });
};

export const updatePrices = () => {
  return api.put('/cart/update-prices');
};

// Export utility functions
export const getCartItemKey = (item) => {
  return `${item.product._id}_${item.variant || 'default'}`;
};

export const findCartItem = (cart, productId, variant = null) => {
  return cart.items.find(item => 
    item.product._id === productId && 
    (item.variant === variant || (!item.variant && !variant))
  );
};

export const isCartEmpty = (cart) => {
  return !cart || !cart.items || cart.items.length === 0;
};

export const hasItemsInCart = (cart, productIds) => {
  if (!cart || !cart.items) return false;
  
  return productIds.some(productId => 
    cart.items.some(item => item.product._id === productId)
  );
};

export const getOutOfStockItems = (cart) => {
  if (!cart || !cart.items) return [];
  
  return cart.items.filter(item => 
    item.product.stock !== undefined && 
    item.quantity > item.product.stock
  );
};

export const getUnavailableItems = (cart) => {
  if (!cart || !cart.items) return [];
  
  return cart.items.filter(item => 
    !item.product.isActive || 
    item.product.isDeleted ||
    item.product.stock === 0
  );
};

export default {
  // Basic cart operations
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  
  // Save for later
  saveForLater,
  moveToCart,
  removeSavedItem,
  getSavedItems,
  clearSavedItems,
  
  // Bulk operations
  updateMultipleItems,
  removeMultipleItems,
  moveMultipleToSaved,
  moveMultipleToCart,
  
  // Cart sharing
  shareCart,
  getSharedCart,
  addSharedCartItems,
  
  // Cart history
  getCartHistory,
  restoreCart,
  saveCartSnapshot,
  getCartSnapshots,
  deleteCartSnapshot,
  
  // Recommendations
  getCartRecommendations,
  getFrequentlyBoughtTogether,
  
  // Validation
  validateCart,
  checkProductAvailability,
  updatePrices,
  
  // Sync and merge
  mergeGuestCart,
  syncCart,
  
  // Utilities
  calculateCartTotal,
  calculateCartItems,
  calculateCartWeight,
  validateCartItem,
  formatCartForCheckout,
  getCartItemKey,
  findCartItem,
  isCartEmpty,
  hasItemsInCart,
  getOutOfStockItems,
  getUnavailableItems,
}; 