import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartIcon, 
  ShoppingCartIcon, 
  TrashIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getWishlist, removeFromWishlist, shareWishlist } from '../services/productAPI';
import ProductCard from '../components/Products/ProductCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Wishlist = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your wishlist');
      navigate('/login');
      return;
    }
    loadWishlist();
  }, [isAuthenticated, navigate]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🔄 Loading wishlist...');
      const response = await getWishlist();
      console.log('📝 Wishlist response:', response);
      
      // Handle the response structure from the backend
      if (response && response.data) {
        const data = response.data.data || response.data;
        setWishlistItems(Array.isArray(data) ? data : []);
        console.log('✅ Wishlist loaded successfully:', data.length, 'items');
      } else {
        console.log('⚠️ No data in wishlist response');
        setWishlistItems([]);
      }
    } catch (err) {
      console.error('❌ Failed to load wishlist:', err);
      
      // More specific error handling
      let errorMessage = 'Failed to load wishlist';
      
      if (err.response) {
        // Server responded with error status
        if (err.response.status === 401) {
          errorMessage = 'Please login to view your wishlist';
        } else if (err.response.status === 404) {
          errorMessage = 'Wishlist not found';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = err.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      setWishlistItems([]);
      
      // Show a toast notification for better UX
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Item removed from wishlist');
      loadWishlist(); // Reload the wishlist
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Failed to remove item from wishlist');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
      // Optionally remove from wishlist after adding to cart
      // await handleRemoveFromWishlist(productId);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleShareWishlist = async () => {
    try {
      const response = await shareWishlist();
      const shareUrl = response.data.shareUrl;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Wishlist link copied to clipboard!');
    } catch (error) {
      console.error('Failed to share wishlist:', error);
      toast.error('Failed to share wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {wishlistItems.length > 0 
                ? `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved for later`
                : 'No items in your wishlist yet'
              }
            </p>
          </div>
          
          {wishlistItems.length > 0 && (
            <button
              onClick={handleShareWishlist}
              className="btn btn-outline inline-flex items-center space-x-2"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Share Wishlist</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md mb-6">
          <div className="flex">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Wishlist Content */}
      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            // Handle different possible response structures
            const product = item.product || item;
            
            return (
              <div key={product._id} className="relative group">
                <ProductCard
                  product={product}
                  onAddToCart={() => handleAddToCart(product._id)}
                />
                
                {/* Wishlist Actions Overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex flex-col space-y-2">
                    {/* Remove from Wishlist */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Remove from Wishlist"
                    >
                      <TrashIcon className="w-4 h-4 text-red-500" />
                    </button>
                    
                    {/* Add to Cart */}
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-blue-50 transition-colors"
                      title="Add to Cart"
                    >
                      <ShoppingCartIcon className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <HeartIcon className="w-10 h-10 text-gray-400" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Your wishlist is empty
          </h3>
          
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Save items you love by clicking the heart icon on any product. 
            They'll appear here so you can easily find them later.
          </p>
          
          <Link
            to="/products"
            className="btn btn-primary inline-flex items-center space-x-2"
          >
            <span>Start Shopping</span>
            <HeartIconSolid className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Additional Actions */}
      {wishlistItems.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="btn btn-outline inline-flex items-center justify-center space-x-2"
            >
              <span>Continue Shopping</span>
            </Link>
            
            <button
              onClick={() => {
                // Add all items to cart
                wishlistItems.forEach(item => {
                  const product = item.product || item;
                  handleAddToCart(product._id);
                });
              }}
              className="btn btn-primary inline-flex items-center justify-center space-x-2"
            >
              <ShoppingCartIcon className="w-4 h-4" />
              <span>Add All to Cart</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist; 