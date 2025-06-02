import api from './api';

// Authentication endpoints
export const login = (credentials) => {
  return api.post('/auth/login', credentials);
};

export const register = (userData) => {
  return api.post('/auth/register', userData);
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const refreshToken = (refreshToken) => {
  return api.post('/auth/refresh', { refreshToken });
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, password) => {
  return api.post('/auth/reset-password', { token, password });
};

export const verifyEmail = (token) => {
  return api.post('/auth/verify-email', { token });
};

export const resendVerification = (email) => {
  return api.post('/auth/resend-verification', { email });
};

// User profile endpoints
export const getCurrentUser = () => {
  return api.get('/auth/me');
};

export const updateProfile = (profileData) => {
  return api.put('/auth/profile', profileData);
};

export const updateAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  return api.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAvatar = () => {
  return api.delete('/auth/avatar');
};

export const changePassword = (passwordData) => {
  return api.put('/auth/change-password', passwordData);
};

// Address management
export const getAddresses = () => {
  return api.get('/auth/addresses');
};

export const addAddress = (addressData) => {
  return api.post('/auth/addresses', addressData);
};

export const updateAddress = (addressId, addressData) => {
  return api.put(`/auth/addresses/${addressId}`, addressData);
};

export const deleteAddress = (addressId) => {
  return api.delete(`/auth/addresses/${addressId}`);
};

export const setDefaultAddress = (addressId) => {
  return api.put(`/auth/addresses/${addressId}/default`);
};

// User preferences
export const getPreferences = () => {
  return api.get('/auth/preferences');
};

export const updatePreferences = (preferences) => {
  return api.put('/auth/preferences', preferences);
};

// Account management
export const deleteAccount = (password) => {
  return api.delete('/auth/account', { data: { password } });
};

export const deactivateAccount = () => {
  return api.put('/auth/account/deactivate');
};

export const reactivateAccount = () => {
  return api.put('/auth/account/reactivate');
};

// Privacy and security
export const getTwoFactorStatus = () => {
  return api.get('/auth/2fa/status');
};

export const enableTwoFactor = () => {
  return api.post('/auth/2fa/enable');
};

export const disableTwoFactor = (token) => {
  return api.post('/auth/2fa/disable', { token });
};

export const verifyTwoFactor = (token) => {
  return api.post('/auth/2fa/verify', { token });
};

export const getLoginHistory = (page = 1, limit = 10) => {
  return api.get(`/auth/login-history?page=${page}&limit=${limit}`);
};

export const revokeAllSessions = () => {
  return api.post('/auth/revoke-sessions');
};

// Email and notification preferences
export const updateEmailPreferences = (preferences) => {
  return api.put('/auth/email-preferences', preferences);
};

export const updateNotificationPreferences = (preferences) => {
  return api.put('/auth/notification-preferences', preferences);
};

// Export helper functions
export const isEmailVerified = (user) => {
  return user?.emailVerified;
};

export const hasCompletedProfile = (user) => {
  return user?.name && user?.email && user?.phone;
};

export const getUserDisplayName = (user) => {
  if (!user) return 'Guest';
  return user.name || user.email || 'User';
};

export const getUserInitials = (user) => {
  if (!user?.name) return 'G';
  
  const names = user.name.split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  
  return user.name[0].toUpperCase();
};

export const formatUserRole = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'customer':
      return 'Customer';
    default:
      return 'User';
  }
};

export default {
  // Authentication
  login,
  register,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  
  // Profile
  getCurrentUser,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  changePassword,
  
  // Addresses
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  
  // Preferences
  getPreferences,
  updatePreferences,
  updateEmailPreferences,
  updateNotificationPreferences,
  
  // Account
  deleteAccount,
  deactivateAccount,
  reactivateAccount,
  
  // Security
  getTwoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getLoginHistory,
  revokeAllSessions,
  
  // Helpers
  isEmailVerified,
  hasCompletedProfile,
  getUserDisplayName,
  getUserInitials,
  formatUserRole,
}; 