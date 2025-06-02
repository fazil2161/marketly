import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import * as cartAPI from '../services/cartAPI';

// Initial state
const initialState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  savedForLater: [],
  isLoading: false,
  error: null,
};

// Action types
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_CART_SUCCESS: 'LOAD_CART_SUCCESS',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  UPDATE_QUANTITY_SUCCESS: 'UPDATE_QUANTITY_SUCCESS',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
  SAVE_FOR_LATER_SUCCESS: 'SAVE_FOR_LATER_SUCCESS',
  MOVE_TO_CART_SUCCESS: 'MOVE_TO_CART_SUCCESS',
  REMOVE_SAVED_ITEM_SUCCESS: 'REMOVE_SAVED_ITEM_SUCCESS',
  SYNC_LOCAL_CART: 'SYNC_LOCAL_CART',
};

// Helper functions
const calculateTotals = (items) => {
  console.log('Calculating totals for items:', items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    console.log(`Item: ${item.product?.name}, price: ${item.price}, qty: ${item.quantity}, subtotal: ${itemTotal}`);
    return sum + itemTotal;
  }, 0);
  
  console.log('Final totals:', { totalItems, totalPrice });
  return { totalItems, totalPrice };
};

const saveToLocalStorage = (items, savedForLater) => {
  try {
    localStorage.setItem('cart', JSON.stringify(items));
    localStorage.setItem('savedForLater', JSON.stringify(savedForLater));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const savedForLater = JSON.parse(localStorage.getItem('savedForLater') || '[]');
    return { cart, savedForLater };
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return { cart: [], savedForLater: [] };
  }
};

// Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case CART_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case CART_ACTIONS.LOAD_CART_SUCCESS: {
      const { items = [], savedForLater = [] } = action.payload || {};
      console.log('Cart loaded:', { items, savedForLater, payload: action.payload });
      const totals = calculateTotals(items);
      console.log('Calculated totals:', totals);
      
      return {
        ...state,
        items,
        savedForLater,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.ADD_ITEM_SUCCESS: {
      const { item } = action.payload || {};
      if (!item) {
        return { ...state, isLoading: false };
      }
      const existingItemIndex = state.items.findIndex(
        (cartItem) => cartItem.product._id === item.product._id
      );

      let newItems;
      if (existingItemIndex !== -1) {
        // Update existing item quantity
        newItems = state.items.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        // Add new item
        newItems = [...state.items, item];
      }

      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY_SUCCESS: {
      const { productId, quantity } = action.payload || {};
      if (!productId) {
        return { ...state, isLoading: false };
      }
      const newItems = quantity === 0
        ? state.items.filter(item => item.product._id !== productId)
        : state.items.map(item =>
            item.product._id === productId
              ? { ...item, quantity }
              : item
          );

      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.REMOVE_ITEM_SUCCESS: {
      const { productId } = action.payload || {};
      if (!productId) {
        return { ...state, isLoading: false };
      }
      const newItems = state.items.filter(item => item.product._id !== productId);
      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.CLEAR_CART_SUCCESS:
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isLoading: false,
        error: null,
      };

    case CART_ACTIONS.SAVE_FOR_LATER_SUCCESS: {
      const { item } = action.payload || {};
      if (!item) {
        return { ...state, isLoading: false };
      }
      const newItems = state.items.filter(cartItem => cartItem.product._id !== item.product._id);
      const newSavedForLater = [...state.savedForLater, item];
      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        savedForLater: newSavedForLater,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.MOVE_TO_CART_SUCCESS: {
      const { item } = action.payload || {};
      if (!item) {
        return { ...state, isLoading: false };
      }
      const newSavedForLater = state.savedForLater.filter(
        savedItem => savedItem.product._id !== item.product._id
      );
      
      const existingItemIndex = state.items.findIndex(
        cartItem => cartItem.product._id === item.product._id
      );

      let newItems;
      if (existingItemIndex !== -1) {
        newItems = state.items.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
            : cartItem
        );
      } else {
        newItems = [...state.items, item];
      }

      const totals = calculateTotals(newItems);
      
      return {
        ...state,
        items: newItems,
        savedForLater: newSavedForLater,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.REMOVE_SAVED_ITEM_SUCCESS: {
      const { productId } = action.payload || {};
      if (!productId) {
        return { ...state, isLoading: false };
      }
      const newSavedForLater = state.savedForLater.filter(
        item => item.product._id !== productId
      );
      
      return {
        ...state,
        savedForLater: newSavedForLater,
        isLoading: false,
        error: null,
      };
    }

    case CART_ACTIONS.SYNC_LOCAL_CART: {
      const { localCart = [], localSavedForLater = [] } = action.payload || {};
      const totals = calculateTotals(localCart);
      
      return {
        ...state,
        items: localCart,
        savedForLater: localSavedForLater,
        ...totals,
        isLoading: false,
        error: null,
      };
    }

    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // Load cart on mount and auth changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      // Load from localStorage for guest users
      const { cart, savedForLater } = loadFromLocalStorage();
      dispatch({
        type: CART_ACTIONS.SYNC_LOCAL_CART,
        payload: { localCart: cart, localSavedForLater: savedForLater },
      });
    }
  }, [isAuthenticated, user]);

  // Save to localStorage whenever cart changes (for guest users)
  useEffect(() => {
    if (!isAuthenticated) {
      saveToLocalStorage(state.items, state.savedForLater);
    }
  }, [state.items, state.savedForLater, isAuthenticated]);

  // Load cart from server
  const loadCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      const response = await cartAPI.getCart();
      
      dispatch({
        type: CART_ACTIONS.LOAD_CART_SUCCESS,
        payload: response.data.data,
      });
    } catch (error) {
      console.error('Failed to load cart:', error);
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: error.response?.data?.error?.message || 'Failed to load cart',
      });
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        const response = await cartAPI.addToCart({ productId, quantity });
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        // Handle local cart for guest users
        // Note: This would need the product details to be passed or fetched
        const product = { _id: productId }; // Simplified for now
        const item = { product, quantity, price: 0 }; // Price would need to be fetched
        
        dispatch({
          type: CART_ACTIONS.ADD_ITEM_SUCCESS,
          payload: { item },
        });
      }
      
      toast.success('Item added to cart');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to add item to cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, quantity) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        const response = await cartAPI.updateQuantity(productId, { quantity });
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        dispatch({
          type: CART_ACTIONS.UPDATE_QUANTITY_SUCCESS,
          payload: { productId, quantity },
        });
      }
      
      if (quantity === 0) {
        toast.success('Item removed from cart');
      } else {
        toast.success('Cart updated');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        await cartAPI.removeFromCart(productId);
        const response = await cartAPI.getCart();
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        dispatch({
          type: CART_ACTIONS.REMOVE_ITEM_SUCCESS,
          payload: { productId },
        });
      }
      
      toast.success('Item removed from cart');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to remove item';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        await cartAPI.clearCart();
      }
      
      dispatch({ type: CART_ACTIONS.CLEAR_CART_SUCCESS });
      
      if (!isAuthenticated) {
        localStorage.removeItem('cart');
      }
      
      toast.success('Cart cleared');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to clear cart';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Save item for later
  const saveForLater = async (productId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        await cartAPI.saveForLater(productId);
        const response = await cartAPI.getCart();
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        const item = state.items.find(item => item.product._id === productId);
        if (item) {
          dispatch({
            type: CART_ACTIONS.SAVE_FOR_LATER_SUCCESS,
            payload: { item },
          });
        }
      }
      
      toast.success('Item saved for later');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to save item';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Move item back to cart
  const moveToCart = async (productId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        await cartAPI.moveToCart(productId);
        const response = await cartAPI.getCart();
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        const item = state.savedForLater.find(item => item.product._id === productId);
        if (item) {
          dispatch({
            type: CART_ACTIONS.MOVE_TO_CART_SUCCESS,
            payload: { item },
          });
        }
      }
      
      toast.success('Item moved to cart');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to move item';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Remove saved item
  const removeSavedItem = async (productId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      if (isAuthenticated) {
        await cartAPI.removeSavedItem(productId);
        const response = await cartAPI.getCart();
        dispatch({
          type: CART_ACTIONS.LOAD_CART_SUCCESS,
          payload: response.data.data,
        });
      } else {
        dispatch({
          type: CART_ACTIONS.REMOVE_SAVED_ITEM_SUCCESS,
          payload: { productId },
        });
      }
      
      toast.success('Saved item removed');
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to remove saved item';
      dispatch({
        type: CART_ACTIONS.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
    }
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  // Check if item is in cart
  const isInCart = (productId) => {
    return state.items.some(item => item.product._id === productId);
  };

  // Check if item is saved for later
  const isSavedForLater = (productId) => {
    return state.savedForLater.some(item => item.product._id === productId);
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  };

  // Debug function to log cart data
  const debugCart = () => {
    console.log('Cart Debug Info:', {
      items: state.items,
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      isLoading: state.isLoading,
      error: state.error,
      itemsWithCalculations: state.items.map(item => ({
        name: item.product?.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
        product: item.product
      }))
    });
  };

  // Expose debug function to window (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.debugCart = debugCart;
    }
  }, [state]);

  const value = {
    // State
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    savedForLater: state.savedForLater,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    clearError,
    
    // Utilities
    getItemQuantity,
    isInCart,
    isSavedForLater,
    
    // Debug
    debugCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext; 