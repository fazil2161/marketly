# Marketly - E-Commerce Platform

A full-stack e-commerce platform built with the MERN stack (MongoDB, Express.js, React, Node.js) that allows users to browse products, manage shopping carts, and make purchases, while providing admins with comprehensive management tools.

## 🚀 Features

### User Features
- **Authentication**: Secure registration and login with JWT
- **Product Browsing**: Browse products with filtering, sorting, and search
- **Shopping Cart**: Add/remove items with persistent cart data
- **Checkout Process**: Multi-step checkout with payment integration (frontend only)
- **Order Management**: View order history and track order status
- **Product Reviews**: Rate and review purchased products
- **Profile Management**: Update profile information and view order history

### Admin Features
- **Product Management**: Add, edit, and delete products with image uploads
- **Order Management**: View and update order statuses
- **User Management**: View user list and manage user roles
- **Dashboard**: Comprehensive admin dashboard with analytics

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Security**: JWT authentication, password hashing, input sanitization
- **Performance**: Lazy loading, pagination, and optimized queries
- **Modern UI**: Clean, intuitive interface with loading states and notifications

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Axios, React Router
- **Backend**: Node.js, Express.js, JWT, Multer
- **Database**: MongoDB with Mongoose
- **Payment**: Frontend payment form (Stripe integration ready)
- **Deployment**: Render (Frontend & Backend), MongoDB Atlas

## 📁 Project Structure

```
marketly/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context
│   │   ├── services/      # API services
│   │   └── assets/        # Static assets
│   └── package.json
├── server/                # Node.js Backend
│   ├── config/           # Configuration files
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Custom middleware
│   ├── utils/           # Helper functions
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd marketly
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Setup Frontend**
```bash
cd ../client
npm install
```

4. **Environment Variables**

Create `.env` file in the server directory:
```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret
PORT=5000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloudinary_name (optional)
CLOUDINARY_API_KEY=your_cloudinary_key (optional)
CLOUDINARY_API_SECRET=your_cloudinary_secret (optional)
```

5. **Run the Application**

Backend (from server directory):
```bash
npm run dev
```

Frontend (from client directory):
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/:id` - Get single product
- `GET /api/products/search` - Search products
- `GET /api/products/filter` - Filter products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove item from cart

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order

### Reviews
- `POST /api/reviews` - Add product review
- `GET /api/reviews/:productId` - Get product reviews

### Admin Routes
- `GET /api/admin/products` - Get all products (admin)
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id` - Update order status
- `GET /api/admin/users` - Get all users

## 🎨 UI Components

The application uses Tailwind CSS for styling with a modern, clean design:
- **Color Scheme**: White background, blue accents (#1DA1F2), neutral grays
- **Responsive Design**: Mobile-first approach
- **Components**: Reusable components for consistency
- **Loading States**: Spinners and skeleton loaders
- **Notifications**: Toast notifications for user feedback

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Input Sanitization**: Protection against XSS and injection attacks
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Proper cross-origin resource sharing
- **Helmet**: Security headers for Express

## 📱 Responsive Design

- **Mobile**: Single column layout, touch-friendly interactions
- **Tablet**: Two-column product grid, optimized navigation
- **Desktop**: Three-four column grid, full feature access

## 🚀 Deployment

### Render Deployment

1. **Backend Deployment (Web Service)**
   - Connect your GitHub repository to Render
   - Set root directory to `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables in Render dashboard

2. **Frontend Deployment (Static Site)**
   - Connect your GitHub repository to Render
   - Set root directory to `client`
   - Build command: `npm install && npm run build`
   - Publish directory: `build`

3. **MongoDB Atlas**
   - Create MongoDB Atlas cluster
   - Add connection string to environment variables
   - Configure network access and database user

## 🧪 Testing

Run tests (when implemented):
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🚀 Future Enhancements

- Payment processing with Stripe integration
- Real-time notifications
- Advanced analytics dashboard
- Wishlist functionality
- Discount and coupon system
- Multi-language support
- Mobile app version 