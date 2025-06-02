const nodemailer = require('nodemailer');
const { createError } = require('../middleware/error');

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

// Create transporter
let transporter = null;

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email sending will be disabled.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    return transporter;
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

// Initialize transporter
createTransporter();

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

// Send email function
const sendEmail = async (options) => {
  if (!transporter) {
    throw createError.internal('Email service not configured');
  }

  const {
    to,
    subject,
    text,
    html,
    attachments = [],
    from = process.env.EMAIL_FROM || process.env.EMAIL_USER
  } = options;

  try {
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`📧 Email sent successfully to ${to}: ${subject}`);
    return {
      success: true,
      messageId: result.messageId,
      response: result.response
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw createError.internal(`Failed to send email: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  // Welcome email for new users
  welcome: (user) => ({
    subject: 'Welcome to Marketly!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Welcome to Marketly!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for joining Marketly, your premier online marketplace. We're excited to have you as part of our community!</p>
        <p>Here's what you can do with your new account:</p>
        <ul>
          <li>Browse thousands of products</li>
          <li>Track your orders in real-time</li>
          <li>Save items to your wishlist</li>
          <li>Write reviews for purchased products</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Happy shopping!</p>
        <p>The Marketly Team</p>
      </div>
    `,
    text: `Welcome to Marketly! Hi ${user.name}, thank you for joining our marketplace. We're excited to have you as part of our community!`
  }),

  // Order confirmation email
  orderConfirmation: (order, user) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Order Confirmation</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for your order! We've received your order and it's being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Items Ordered:</h3>
          ${order.items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${item.name}</strong></p>
              <p>Quantity: ${item.quantity} | Price: $${item.price.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
          <p>${order.shippingAddress.street}</p>
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
          <p>${order.shippingAddress.country}</p>
        </div>

        <p>You can track your order status in your account dashboard.</p>
        <p>Thank you for shopping with Marketly!</p>
        <p>The Marketly Team</p>
      </div>
    `,
    text: `Order Confirmation - ${order.orderNumber}. Hi ${user.name}, thank you for your order! Order Number: ${order.orderNumber}, Total: $${order.total.toFixed(2)}`
  }),

  // Order status update
  orderStatusUpdate: (order, user, newStatus) => ({
    subject: `Order Update - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Order Status Update</h1>
        <p>Hi ${user.name},</p>
        <p>Your order status has been updated!</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${order.orderNumber}</p>
          <p><strong>New Status:</strong> <span style="color: #28a745; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
          ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        </div>

        ${newStatus === 'shipped' ? `
          <p>Your order is on its way! You can track your package using the tracking number provided above.</p>
        ` : ''}

        ${newStatus === 'delivered' ? `
          <p>Your order has been delivered! We hope you enjoy your purchase.</p>
          <p>Please consider leaving a review for the products you purchased.</p>
        ` : ''}

        <p>You can view your order details in your account dashboard.</p>
        <p>Thank you for shopping with Marketly!</p>
        <p>The Marketly Team</p>
      </div>
    `,
    text: `Order Update - ${order.orderNumber}. Hi ${user.name}, your order status has been updated to: ${newStatus.toUpperCase()}`
  }),

  // Password reset email
  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request - Marketly',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Password Reset Request</h1>
        <p>Hi ${user.name},</p>
        <p>You recently requested to reset your password for your Marketly account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
             style="background-color: #1DA1F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">
          ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}
        </p>

        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>The Marketly Team</p>
      </div>
    `,
    text: `Password Reset Request - Hi ${user.name}, you requested to reset your password. Use this link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  }),

  // Email verification
  emailVerification: (user, verificationToken) => ({
    subject: 'Verify Your Email - Marketly',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Verify Your Email Address</h1>
        <p>Hi ${user.name},</p>
        <p>Please verify your email address to complete your account setup.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">
          ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}
        </p>

        <p>If you didn't create this account, please ignore this email.</p>
        <p>The Marketly Team</p>
      </div>
    `,
    text: `Verify Your Email - Hi ${user.name}, please verify your email address: ${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
  })
};

// Send specific email types
const sendWelcomeEmail = async (user) => {
  // Skip email sending in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Skipping welcome email for user: ${user.email}`);
    return null;
  }
  
  if (!transporter) return null;
  
  const template = emailTemplates.welcome(user);
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

const sendOrderConfirmationEmail = async (order, user) => {
  if (!transporter) return null;
  
  const template = emailTemplates.orderConfirmation(order, user);
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

const sendOrderStatusUpdateEmail = async (order, user, newStatus) => {
  if (!transporter) return null;
  
  const template = emailTemplates.orderStatusUpdate(order, user, newStatus);
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  // Skip email sending in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Skipping password reset email for user: ${user.email}`);
    return null;
  }
  
  if (!transporter) return null;
  
  const template = emailTemplates.passwordReset(user, resetToken);
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

const sendEmailVerificationEmail = async (user, verificationToken) => {
  // Skip email sending in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Skipping email verification email for user: ${user.email}`);
    return null;
  }
  
  if (!transporter) return null;
  
  const template = emailTemplates.emailVerification(user, verificationToken);
  return await sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// Bulk email sending (for newsletters, promotions, etc.)
const sendBulkEmail = async (recipients, template, options = {}) => {
  if (!transporter) return null;

  const {
    batchSize = 50,
    delay = 1000 // 1 second delay between batches
  } = options;

  const results = [];
  
  // Process recipients in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (recipient) => {
      try {
        return await sendEmail({
          to: recipient.email,
          subject: template.subject,
          html: template.html.replace(/{{name}}/g, recipient.name || 'Customer'),
          text: template.text.replace(/{{name}}/g, recipient.name || 'Customer')
        });
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        return { success: false, email: recipient.email, error: error.message };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);

    // Delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
};

// Test email function
const sendTestEmail = async (toEmail) => {
  if (!transporter) {
    throw createError.internal('Email service not configured');
  }

  return await sendEmail({
    to: toEmail,
    subject: 'Marketly - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1DA1F2; text-align: center;">Test Email</h1>
        <p>This is a test email from Marketly.</p>
        <p>If you received this email, the email configuration is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `,
    text: 'This is a test email from Marketly. Email configuration is working correctly!'
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendBulkEmail,
  sendTestEmail,
  verifyEmailConfig,
  emailTemplates
}; 