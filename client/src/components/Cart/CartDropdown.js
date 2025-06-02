import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../services/productAPI';

const CartDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity, isLoading } = useCart();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = async (productId) => {
    await removeFromCart(productId);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden" onClick={onClose} />
      
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({totalItems})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="spinner mx-auto mb-2"></div>
              <p className="text-gray-500">Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Link
                to="/products"
                onClick={onClose}
                className="btn btn-primary btn-sm"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => {
                // Safely extract image URL
                let imageUrl = '/placeholder-product.svg';
                
                try {
                  if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
                    const firstImage = item.product.images[0];
                    if (typeof firstImage === 'string') {
                      imageUrl = firstImage;
                    } else if (firstImage && typeof firstImage.url === 'string') {
                      imageUrl = firstImage.url;
                    }
                  } else if (item.product?.image && typeof item.product.image === 'string') {
                    imageUrl = item.product.image;
                  }
                } catch (e) {
                  console.error('Error extracting image URL in CartDropdown:', e);
                  imageUrl = '/placeholder-product.svg';
                }

                return (
                <div key={item.product._id} className="flex items-center space-x-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.svg';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product._id}`}
                      onClick={onClose}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        {/* Quantity Controls */}
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.price)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-gray-900">Total:</span>
              <span className="text-lg font-bold text-primary-600">
                {formatPrice(totalPrice)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                to="/cart"
                onClick={onClose}
                className="btn btn-outline w-full justify-center"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={onClose}
                className="btn btn-primary w-full justify-center"
              >
                Checkout
              </Link>
            </div>

            {/* Free Shipping Progress */}
            <div className="mt-4">
              {totalPrice < 50 ? (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      Add {formatPrice(50 - totalPrice)} for free shipping
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((totalPrice / 50) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center text-sm text-green-600">
                  <span>🎉 You qualify for free shipping!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDropdown; 