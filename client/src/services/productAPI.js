import api, { createQueryString } from './api';

// Product listing and search
export const getProducts = (params = {}) => {
  const queryString = createQueryString(params);
  return api.get(`/products${queryString ? `?${queryString}` : ''}`);
};

export const searchProducts = (query, params = {}) => {
  const allParams = { search: query, ...params };
  const queryString = createQueryString(allParams);
  return api.get(`/products/search?${queryString}`);
};

export const getProductById = (id) => {
  return api.get(`/products/${id}`);
};

export const getProductsByCategory = (category, params = {}) => {
  const queryString = createQueryString(params);
  return api.get(`/products/category/${category}${queryString ? `?${queryString}` : ''}`);
};

export const getFeaturedProducts = (limit = 8) => {
  return api.get(`/products/featured?limit=${limit}`);
};

export const getNewArrivals = (limit = 8) => {
  return api.get(`/products/new-arrivals?limit=${limit}`);
};

export const getBestSellers = (limit = 8) => {
  return api.get(`/products/best-sellers?limit=${limit}`);
};

export const getDealsAndOffers = (limit = 8) => {
  return api.get(`/products/deals?limit=${limit}`);
};

// Product recommendations
export const getRecommendations = (productId) => {
  return api.get(`/products/${productId}/recommendations`);
};

export const getRelatedProducts = (productId, limit = 4) => {
  return api.get(`/products/${productId}/related?limit=${limit}`);
};

export const getFrequentlyBoughtTogether = (productId) => {
  return api.get(`/products/${productId}/frequently-bought-together`);
};

export const getRecentlyViewed = () => {
  return api.get('/products/recently-viewed');
};

export const addToRecentlyViewed = (productId) => {
  return api.post('/products/recently-viewed', { productId });
};

// Product categories and filters
export const getCategories = () => {
  return api.get('/products/categories');
};

export const getCategoryTree = () => {
  return api.get('/products/categories/tree');
};

export const getBrands = () => {
  return api.get('/products/brands');
};

export const getFilters = (category = null) => {
  const url = category ? `/products/filters?category=${category}` : '/products/filters';
  return api.get(url);
};

export const getPriceRange = (category = null) => {
  const url = category ? `/products/price-range?category=${category}` : '/products/price-range';
  return api.get(url);
};

// Product reviews and ratings
export const getProductReviews = (productId, params = {}) => {
  const queryString = createQueryString(params);
  return api.get(`/products/${productId}/reviews${queryString ? `?${queryString}` : ''}`);
};

export const addProductReview = (productId, reviewData) => {
  return api.post(`/products/${productId}/reviews`, reviewData);
};

export const updateProductReview = (productId, reviewId, reviewData) => {
  return api.put(`/products/${productId}/reviews/${reviewId}`, reviewData);
};

export const deleteProductReview = (productId, reviewId) => {
  return api.delete(`/products/${productId}/reviews/${reviewId}`);
};

export const voteOnReview = (productId, reviewId, vote) => {
  return api.post(`/products/${productId}/reviews/${reviewId}/vote`, { vote });
};

export const reportReview = (productId, reviewId, reason) => {
  return api.post(`/products/${productId}/reviews/${reviewId}/report`, { reason });
};

// Product wishlist
export const getWishlist = () => {
  return api.get('/products/wishlist');
};

export const addToWishlist = (productId) => {
  return api.post('/products/wishlist', { productId });
};

export const removeFromWishlist = (productId) => {
  return api.delete(`/products/wishlist/${productId}`);
};

export const isInWishlist = (productId) => {
  return api.get(`/products/wishlist/check/${productId}`);
};

export const shareWishlist = () => {
  return api.post('/products/wishlist/share');
};

// Product comparison
export const getComparison = (productIds) => {
  return api.post('/products/compare', { productIds });
};

export const addToComparison = (productId) => {
  return api.post('/products/compare/add', { productId });
};

export const removeFromComparison = (productId) => {
  return api.delete(`/products/compare/${productId}`);
};

export const getComparisonList = () => {
  return api.get('/products/compare');
};

export const clearComparison = () => {
  return api.delete('/products/compare/clear');
};

// Product stock and availability
export const checkStock = (productId, quantity = 1) => {
  return api.get(`/products/${productId}/stock?quantity=${quantity}`);
};

export const getStockUpdates = (productIds) => {
  return api.post('/products/stock-updates', { productIds });
};

export const notifyWhenAvailable = (productId, email) => {
  return api.post(`/products/${productId}/notify`, { email });
};

// Product pricing
export const getPriceHistory = (productId, days = 30) => {
  return api.get(`/products/${productId}/price-history?days=${days}`);
};

export const getPriceAlerts = () => {
  return api.get('/products/price-alerts');
};

export const setPriceAlert = (productId, targetPrice) => {
  return api.post('/products/price-alerts', { productId, targetPrice });
};

export const removePriceAlert = (alertId) => {
  return api.delete(`/products/price-alerts/${alertId}`);
};

// Admin product management (protected routes)
export const createProduct = (productData) => {
  return api.post('/admin/products', productData);
};

export const updateProduct = (productId, productData) => {
  return api.put(`/admin/products/${productId}`, productData);
};

export const deleteProduct = (productId) => {
  return api.delete(`/admin/products/${productId}`);
};

export const uploadProductImages = (productId, files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  
  return api.post(`/admin/products/${productId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteProductImage = (productId, imageId) => {
  return api.delete(`/admin/products/${productId}/images/${imageId}`);
};

export const updateProductStatus = (productId, status) => {
  return api.patch(`/admin/products/${productId}/status`, { status });
};

export const bulkUpdateProducts = (updates) => {
  return api.put('/admin/products/bulk-update', { updates });
};

export const importProducts = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/admin/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const exportProducts = (params = {}) => {
  const queryString = createQueryString(params);
  return api.get(`/admin/products/export${queryString ? `?${queryString}` : ''}`, {
    responseType: 'blob',
  });
};

// Utility functions
export const formatPrice = (price, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

export const calculateDiscount = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

export const isOnSale = (product) => {
  return product.salePrice && product.salePrice < product.price;
};

export const isNewArrival = (product, days = 30) => {
  if (!product.createdAt) return false;
  const created = new Date(product.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
};

export const isInStock = (product) => {
  return product.stock > 0 && product.isActive;
};

export const isLowStock = (product, threshold = 10) => {
  return product.stock <= threshold && product.stock > 0;
};

export const getStockStatus = (product) => {
  if (!product.isActive) return 'inactive';
  if (product.stock === 0) return 'out-of-stock';
  if (product.stock <= 10) return 'low-stock';
  return 'in-stock';
};

export const getAverageRating = (product) => {
  if (!product.ratings || product.reviewCount === 0) return 0;
  return product.ratings;
};

export const formatRating = (rating) => {
  return Math.round(rating * 10) / 10;
};

export const getMainImage = (product) => {
  if (!product.images || product.images.length === 0) {
    return '/images/placeholder-product.png';
  }
  return product.images[0];
};

export const generateProductSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const buildProductURL = (product) => {
  const slug = product.slug || generateProductSlug(product.name);
  return `/products/${product._id}/${slug}`;
};

export default {
  // Listing and search
  getProducts,
  searchProducts,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getDealsAndOffers,
  
  // Recommendations
  getRecommendations,
  getRelatedProducts,
  getFrequentlyBoughtTogether,
  getRecentlyViewed,
  addToRecentlyViewed,
  
  // Categories and filters
  getCategories,
  getCategoryTree,
  getBrands,
  getFilters,
  getPriceRange,
  
  // Reviews
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  voteOnReview,
  reportReview,
  
  // Wishlist
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  shareWishlist,
  
  // Comparison
  getComparison,
  addToComparison,
  removeFromComparison,
  getComparisonList,
  clearComparison,
  
  // Stock and availability
  checkStock,
  getStockUpdates,
  notifyWhenAvailable,
  
  // Pricing
  getPriceHistory,
  getPriceAlerts,
  setPriceAlert,
  removePriceAlert,
  
  // Admin functions
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
  updateProductStatus,
  bulkUpdateProducts,
  importProducts,
  exportProducts,
  
  // Utilities
  formatPrice,
  calculateDiscount,
  isOnSale,
  isNewArrival,
  isInStock,
  isLowStock,
  getStockStatus,
  getAverageRating,
  formatRating,
  getMainImage,
  generateProductSlug,
  buildProductURL,
}; 