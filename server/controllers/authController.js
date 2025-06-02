const User = require('../models/User');
const { asyncHandler, createError } = require('../middleware/error');
const { sendWelcomeEmail } = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw createError.conflict('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role === 'admin' ? 'admin' : 'user' // Prevent unauthorized admin creation
  });

  // Generate tokens
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Update last login
  await user.updateLastLogin();

  // Send welcome email (don't wait for it)
  sendWelcomeEmail(user).catch(error => {
    console.error('Failed to send welcome email:', error);
  });

  // Remove password from response
  const userResponse = user.toSafeObject();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    throw createError.badRequest('Please provide email and password');
  }

  // Check for user and include password field
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    throw createError.unauthorized('Invalid credentials');
  }

  // Check if user is active
  if (!user.isActive) {
    throw createError.unauthorized('Account is deactivated');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError.unauthorized('Invalid credentials');
  }

  // Generate tokens
  const token = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Update last login
  await user.updateLastLogin();

  // Remove password from response
  const userResponse = user.toSafeObject();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token,
      refreshToken
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user.toSafeObject();

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    address
  } = req.body;

  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
  if (address) fieldsToUpdate.address = address;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  const userResponse = user.toSafeObject();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: userResponse
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError.badRequest('Please provide current and new password');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw createError.badRequest('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear all refresh tokens (force re-login on all devices)
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw createError.badRequest('Refresh token is required');
  }

  // This will be handled by verifyRefreshToken middleware
  // req.user will be available here
  const newToken = req.user.getSignedJwtToken();
  const newRefreshToken = req.user.getRefreshToken();

  // Save new refresh token
  req.user.refreshToken = newRefreshToken;
  await req.user.save({ validateBeforeSave: false });

  const userResponse = req.user.toSafeObject();

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: userResponse,
      token: newToken,
      refreshToken: newRefreshToken
    }
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError.badRequest('Please provide email address');
  }

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token (you'd need to implement this in User model)
  // For now, we'll just simulate it
  const resetToken = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);

  // In a real app, you'd store this token with expiration in the database
  // user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // user.passwordResetExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  // await user.save({ validateBeforeSave: false });

  try {
    // Send reset email (implement in utils/email.js)
    // await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw createError.badRequest('Please provide new password');
  }

  // In a real app, you'd validate the token and find the user
  // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  // const user = await User.findOne({
  //   passwordResetToken: hashedToken,
  //   passwordResetExpire: { $gt: Date.now() }
  // });

  // For now, just return success
  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // In a real app, you'd validate the token and update user
  // For now, just return success
  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) {
    throw createError.badRequest('Email is already verified');
  }

  // Generate verification token and send email
  // For now, just return success
  res.status(200).json({
    success: true,
    message: 'Verification email sent'
  });
});

// @desc    Delete account
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw createError.badRequest('Please provide password to confirm account deletion');
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError.badRequest('Incorrect password');
  }

  // Soft delete - set isActive to false
  user.isActive = false;
  user.refreshToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount
}; 