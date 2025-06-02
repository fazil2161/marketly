import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import authAPI from '../services/authAPI';

const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Auth Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: response.data.data.user
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authAPI.login({ email, password });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.data.user,
          token: response.data.data.token
        }
      });

      toast.success('Login successful');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract the proper error message
      let errorMessage = 'Login failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await authAPI.register(userData);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.data.token);
      if (response.data.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.data.data.user,
          token: response.data.data.token
        }
      });

      toast.success('Registration successful');

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract the proper error message
      let errorMessage = 'Registration failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });

    toast.success('Logout successful');
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.data.user
      });
      toast.success('Profile update successful');
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Extract the proper error message
      let errorMessage = 'Profile update failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user && state.user.role === 'admin';
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 