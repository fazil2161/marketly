import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ShoppingCartIcon, 
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatPrice, calculateDiscount, isOnSale, getStockStatus } from '../../services/productAPI';
import { addToWishlist, removeFromWishlist } from '../../services/productAPI';
import { toast } from 'react-hot-toast';

const ProductCard = ({ 
  product, 
  onAddToCart, 
  showNewBadge = false,
  className = ''
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const discount = calculateDiscount(product.price, product.salePrice);
  const stockStatus = getStockStatus(product);
  const isOutOfStock = stockStatus === 'out-of-stock';
  const isLowStock = stockStatus === 'low-stock';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && onAddToCart) {
      onAddToCart();
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => {
      const filled = index < Math.floor(rating);
      const half = index === Math.floor(rating) && rating % 1 !== 0;
      
      return (
        <StarIcon
          key={index}
          className={`w-4 h-4 ${
            filled ? 'text-yellow-400 fill-current' : 
            half ? 'text-yellow-400 fill-current opacity-50' : 
            'text-gray-300'
          }`}
        />
      );
    });
  };

  return (
    <div className={`group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 ${className}`}>
      <Link to={`/products/${product._id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {/* Image */}
          <img
            src={imageError ? '/images/placeholder-product.png' : (product.images?.[0]?.url || product.images?.[0] || '/images/placeholder-product.png')}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Loading Skeleton */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {showNewBadge && (
              <span className="badge badge-primary text-xs font-semibold">
                New
              </span>
            )}
            {isOnSale(product) && discount > 0 && (
              <span className="badge badge-error text-xs font-semibold">
                -{discount}%
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="badge badge-warning text-xs font-semibold">
                Low Stock
              </span>
            )}
            {isOutOfStock && (
              <span className="badge badge-secondary text-xs font-semibold">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex flex-col space-y-2">
              {/* Wishlist */}
              <button
                onClick={handleWishlistToggle}
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Add to Wishlist"
              >
                {isWishlisted ? (
                  <HeartIconSolid className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {/* Quick View */}
              <button
                className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Quick View"
              >
                <EyeIcon className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Add to Cart Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="p-4">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full btn btn-sm ${
                  isOutOfStock 
                    ? 'btn-secondary cursor-not-allowed opacity-50' 
                    : 'btn-primary'
                } flex items-center justify-center space-x-2`}
              >
                <ShoppingCartIcon className="w-4 h-4" />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.ratings > 0 && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex items-center">
                {renderStars(product.ratings)}
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2 mb-2">
            {isOnSale(product) ? (
              <>
                <span className="text-lg font-bold text-primary-600">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock !== undefined && (
            <div className="text-xs text-gray-500">
              {isOutOfStock ? (
                <span className="text-red-500">Out of stock</span>
              ) : isLowStock ? (
                <span className="text-yellow-600">Only {product.stock} left</span>
              ) : (
                <span className="text-green-600">In stock</span>
              )}
            </div>
          )}

          {/* Categories */}
          {product.category && (
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {typeof product.category === 'string' ? product.category : product.category.name}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard; 