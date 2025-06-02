const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Sample categories
const sampleCategories = [
  'Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports & Outdoors',
  'Health & Beauty', 'Toys & Games', 'Food & Beverages', 'Automotive', 'Jewelry'
];

// Sample products data
const sampleProducts = [
  // Electronics Category (8 products)
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 79.99,
    originalPrice: 99.99,
    category: 'Electronics',
    brand: 'TechSound',
    stock: 50,
    images: [{
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      alt: 'Wireless Bluetooth Headphones'
    }],
    tags: ['wireless', 'bluetooth', 'noise-cancellation', 'music'],
    isFeatured: true
  },
  {
    name: 'Smartphone 128GB',
    description: 'Latest flagship smartphone with advanced camera system and all-day battery life.',
    price: 699.99,
    originalPrice: 799.99,
    category: 'Electronics',
    brand: 'TechMobile',
    stock: 30,
    images: [{
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
      alt: 'Smartphone 128GB'
    }],
    tags: ['smartphone', 'mobile', '5g', 'camera'],
    isFeatured: true
  },
  {
    name: 'Laptop 15.6" Ultra Thin',
    description: 'High-performance laptop with Intel i7 processor, 16GB RAM, and 512GB SSD.',
    price: 899.99,
    category: 'Electronics',
    brand: 'CompuTech',
    stock: 15,
    images: [{
      url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
      alt: 'Laptop Ultra Thin'
    }],
    tags: ['laptop', 'computer', 'intel', 'ssd'],
    isFeatured: false
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices.',
    price: 24.99,
    category: 'Electronics',
    brand: 'PowerTech',
    stock: 100,
    images: [{
      url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=500',
      alt: 'Wireless Charging Pad'
    }],
    tags: ['wireless', 'charging', 'qi', 'fast'],
    isFeatured: false
  },
  {
    name: 'Smart Watch Fitness Tracker',
    description: 'Advanced smartwatch with heart rate monitoring and GPS tracking.',
    price: 199.99,
    category: 'Electronics',
    brand: 'FitTech',
    stock: 40,
    images: [{
      url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
      alt: 'Smart Watch Fitness Tracker'
    }],
    tags: ['smartwatch', 'fitness', 'gps', 'health'],
    isFeatured: true
  },
  {
    name: 'Bluetooth Speaker Portable',
    description: 'Waterproof portable Bluetooth speaker with 360-degree sound.',
    price: 49.99,
    category: 'Electronics',
    brand: 'SoundWave',
    stock: 60,
    images: [{
      url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
      alt: 'Bluetooth Speaker Portable'
    }],
    tags: ['bluetooth', 'speaker', 'portable', 'waterproof'],
    isFeatured: false
  },
  {
    name: 'Gaming Mouse RGB',
    description: 'High-precision gaming mouse with customizable RGB lighting and programmable buttons.',
    price: 59.99,
    category: 'Electronics',
    brand: 'GameTech',
    stock: 45,
    images: [{
      url: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500',
      alt: 'Gaming Mouse RGB'
    }],
    tags: ['gaming', 'mouse', 'rgb', 'precision'],
    isFeatured: false
  },
  {
    name: 'USB-C Hub 7-in-1',
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, and fast charging support.',
    price: 39.99,
    category: 'Electronics',
    brand: 'ConnectPro',
    stock: 70,
    images: [{
      url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500',
      alt: 'USB-C Hub 7-in-1'
    }],
    tags: ['usb-c', 'hub', 'hdmi', 'adapter'],
    isFeatured: false
  },

  // Clothing Category (8 products)
  {
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt available in multiple colors.',
    price: 24.99,
    category: 'Clothing',
    brand: 'EcoWear',
    stock: 100,
    images: [{
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      alt: 'Organic Cotton T-Shirt'
    }],
    tags: ['organic', 'cotton', 'sustainable', 'fashion'],
    isFeatured: false
  },
  {
    name: 'Denim Jacket Classic',
    description: 'Timeless denim jacket made from premium denim with vintage wash.',
    price: 79.99,
    category: 'Clothing',
    brand: 'DenimCo',
    stock: 35,
    images: [{
      url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=500',
      alt: 'Denim Jacket Classic'
    }],
    tags: ['denim', 'jacket', 'vintage', 'classic'],
    isFeatured: true
  },
  {
    name: 'Running Shoes Athletic',
    description: 'Lightweight running shoes with advanced cushioning and breathable mesh.',
    price: 89.99,
    originalPrice: 119.99,
    category: 'Clothing',
    brand: 'SportFit',
    stock: 55,
    images: [{
      url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      alt: 'Running Shoes Athletic'
    }],
    tags: ['running', 'shoes', 'athletic', 'comfortable'],
    isFeatured: true
  },
  {
    name: 'Casual Hoodie Pullover',
    description: 'Cozy pullover hoodie made from soft cotton blend, perfect for casual wear.',
    price: 44.99,
    category: 'Clothing',
    brand: 'ComfortWear',
    stock: 80,
    images: [{
      url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      alt: 'Casual Hoodie Pullover'
    }],
    tags: ['hoodie', 'casual', 'comfortable', 'cotton'],
    isFeatured: false
  },
  {
    name: 'Formal Dress Shirt',
    description: 'Elegant formal dress shirt with wrinkle-resistant fabric and tailored fit.',
    price: 54.99,
    category: 'Clothing',
    brand: 'BusinessPro',
    stock: 40,
    images: [{
      url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500',
      alt: 'Formal Dress Shirt'
    }],
    tags: ['formal', 'shirt', 'business', 'wrinkle-resistant'],
    isFeatured: false
  },
  {
    name: 'Summer Dress Floral',
    description: 'Beautiful floral summer dress made from lightweight, breathable fabric.',
    price: 69.99,
    category: 'Clothing',
    brand: 'FloralFashion',
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1566479179817-c8d3b077a14e?w=500',
      alt: 'Summer Dress Floral'
    }],
    tags: ['dress', 'summer', 'floral', 'feminine'],
    isFeatured: true
  },
  {
    name: 'Winter Coat Insulated',
    description: 'Warm winter coat with synthetic insulation and water-resistant coating.',
    price: 149.99,
    originalPrice: 199.99,
    category: 'Clothing',
    brand: 'WinterGuard',
    stock: 20,
    images: [{
      url: 'https://images.unsplash.com/photo-1544923246-77307dd15f84?w=500',
      alt: 'Winter Coat Insulated'
    }],
    tags: ['winter', 'coat', 'insulated', 'warm'],
    isFeatured: false
  },
  {
    name: 'Sports Leggings High-Waist',
    description: 'High-performance leggings with moisture-wicking fabric and compression fit.',
    price: 34.99,
    category: 'Clothing',
    brand: 'ActiveWear',
    stock: 75,
    images: [{
      url: 'https://images.unsplash.com/photo-1506629905607-c1f99dfd4dd8?w=500',
      alt: 'Sports Leggings High-Waist'
    }],
    tags: ['leggings', 'sports', 'high-waist', 'activewear'],
    isFeatured: false
  },

  // Home & Kitchen Category (8 products)
  {
    name: 'Smart Garden Irrigation System',
    description: 'Automated irrigation system with smartphone control and weather monitoring.',
    price: 149.99,
    originalPrice: 199.99,
    category: 'Home & Garden',
    brand: 'SmartGarden',
    stock: 15,
    images: [{
      url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500',
      alt: 'Smart Garden Irrigation System'
    }],
    tags: ['smart', 'garden', 'irrigation', 'automation'],
    isFeatured: true
  },
  {
    name: 'Coffee Maker Programmable',
    description: '12-cup programmable coffee maker with thermal carafe and auto-brew feature.',
    price: 89.99,
    category: 'Home & Garden',
    brand: 'BrewMaster',
    stock: 30,
    images: [{
      url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500',
      alt: 'Coffee Maker Programmable'
    }],
    tags: ['coffee', 'maker', 'programmable', 'thermal'],
    isFeatured: false
  },
  {
    name: 'Air Fryer Digital',
    description: 'Large capacity digital air fryer with multiple cooking presets and easy cleanup.',
    price: 79.99,
    category: 'Home & Garden',
    brand: 'HealthyCook',
    stock: 40,
    images: [{
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      alt: 'Air Fryer Digital'
    }],
    tags: ['air-fryer', 'digital', 'healthy', 'cooking'],
    isFeatured: true
  },
  {
    name: 'Non-Stick Cookware Set',
    description: '10-piece non-stick cookware set with ergonomic handles and dishwasher-safe design.',
    price: 129.99,
    originalPrice: 179.99,
    category: 'Home & Garden',
    brand: 'ChefPro',
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
      alt: 'Non-Stick Cookware Set'
    }],
    tags: ['cookware', 'non-stick', 'set', 'dishwasher-safe'],
    isFeatured: false
  },
  {
    name: 'Vacuum Cleaner Robot',
    description: 'Smart robot vacuum with mapping technology and automatic charging.',
    price: 299.99,
    category: 'Home & Garden',
    brand: 'CleanBot',
    stock: 20,
    images: [{
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      alt: 'Vacuum Cleaner Robot'
    }],
    tags: ['vacuum', 'robot', 'smart', 'automatic'],
    isFeatured: true
  },
  {
    name: 'Blender High-Speed',
    description: 'Professional-grade high-speed blender with multiple speed settings.',
    price: 159.99,
    category: 'Home & Garden',
    brand: 'BlendMaster',
    stock: 35,
    images: [{
      url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=500',
      alt: 'Blender High-Speed'
    }],
    tags: ['blender', 'high-speed', 'professional', 'smoothie'],
    isFeatured: false
  },
  {
    name: 'Dinnerware Set Ceramic',
    description: 'Elegant 16-piece ceramic dinnerware set, microwave and dishwasher safe.',
    price: 79.99,
    category: 'Home & Garden',
    brand: 'TableElegance',
    stock: 50,
    images: [{
      url: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500',
      alt: 'Dinnerware Set Ceramic'
    }],
    tags: ['dinnerware', 'ceramic', 'elegant', 'dishwasher-safe'],
    isFeatured: false
  },
  {
    name: 'Knife Set Professional',
    description: '15-piece professional knife set with wooden block and sharpening steel.',
    price: 99.99,
    originalPrice: 149.99,
    category: 'Home & Garden',
    brand: 'CutMaster',
    stock: 30,
    images: [{
      url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=500',
      alt: 'Knife Set Professional'
    }],
    tags: ['knife', 'set', 'professional', 'sharp'],
    isFeatured: false
  },

  // Sports Category (6 products)
  {
    name: 'Yoga Mat Premium',
    description: 'Non-slip yoga mat made from eco-friendly materials, perfect for all types of yoga.',
    price: 39.99,
    category: 'Sports & Outdoors',
    brand: 'YogaLife',
    stock: 75,
    images: [{
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
      alt: 'Yoga Mat Premium'
    }],
    tags: ['yoga', 'fitness', 'eco-friendly', 'exercise'],
    isFeatured: false
  },
  {
    name: 'Dumbbells Adjustable Set',
    description: 'Space-saving adjustable dumbbells with quick-change weight system.',
    price: 199.99,
    category: 'Sports & Outdoors',
    brand: 'FitnessPro',
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      alt: 'Dumbbells Adjustable Set'
    }],
    tags: ['dumbbells', 'adjustable', 'fitness', 'strength'],
    isFeatured: true
  },
  {
    name: 'Basketball Official Size',
    description: 'Official size basketball with superior grip and durable construction.',
    price: 29.99,
    category: 'Sports & Outdoors',
    brand: 'SportsBall',
    stock: 60,
    images: [{
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500',
      alt: 'Basketball Official Size'
    }],
    tags: ['basketball', 'official', 'grip', 'durable'],
    isFeatured: false
  },
  {
    name: 'Resistance Bands Set',
    description: 'Complete resistance bands set with different resistance levels and accessories.',
    price: 24.99,
    category: 'Sports & Outdoors',
    brand: 'FlexFit',
    stock: 80,
    images: [{
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      alt: 'Resistance Bands Set'
    }],
    tags: ['resistance', 'bands', 'workout', 'portable'],
    isFeatured: false
  },
  {
    name: 'Exercise Bike Stationary',
    description: 'Indoor exercise bike with adjustable resistance and digital display.',
    price: 299.99,
    originalPrice: 399.99,
    category: 'Sports & Outdoors',
    brand: 'CycleFit',
    stock: 15,
    images: [{
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
      alt: 'Exercise Bike Stationary'
    }],
    tags: ['exercise', 'bike', 'stationary', 'cardio'],
    isFeatured: true
  },
  {
    name: 'Tennis Racket Professional',
    description: 'Professional tennis racket with lightweight frame and advanced string technology.',
    price: 149.99,
    category: 'Sports & Outdoors',
    brand: 'TennisAce',
    stock: 20,
    images: [{
      url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500',
      alt: 'Tennis Racket Professional'
    }],
    tags: ['tennis', 'racket', 'professional', 'lightweight'],
    isFeatured: false
  },

  // Books Category (6 products)
  {
    name: 'Programming JavaScript Applications',
    description: 'Comprehensive guide to building robust JavaScript applications with modern frameworks.',
    price: 34.99,
    category: 'Books',
    brand: 'TechBooks',
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
      alt: 'Programming JavaScript Applications Book'
    }],
    tags: ['programming', 'javascript', 'development', 'education'],
    isFeatured: true
  },
  {
    name: 'The Art of Cooking',
    description: 'Master cookbook featuring recipes and techniques from world-renowned chefs.',
    price: 29.99,
    category: 'Books',
    brand: 'CulinaryPress',
    stock: 40,
    images: [{
      url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
      alt: 'The Art of Cooking Book'
    }],
    tags: ['cooking', 'recipes', 'culinary', 'chef'],
    isFeatured: false
  },
  {
    name: 'Mindfulness and Meditation',
    description: 'A practical guide to developing mindfulness and meditation practices.',
    price: 19.99,
    category: 'Books',
    brand: 'WellnessBooks',
    stock: 50,
    images: [{
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      alt: 'Mindfulness and Meditation Book'
    }],
    tags: ['mindfulness', 'meditation', 'wellness', 'self-help'],
    isFeatured: false
  },
  {
    name: 'Financial Freedom Guide',
    description: 'Complete guide to achieving financial independence and smart investing.',
    price: 24.99,
    category: 'Books',
    brand: 'MoneyWise',
    stock: 35,
    images: [{
      url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500',
      alt: 'Financial Freedom Guide Book'
    }],
    tags: ['finance', 'investing', 'money', 'freedom'],
    isFeatured: true
  },
  {
    name: 'History of Ancient Civilizations',
    description: 'Fascinating exploration of ancient civilizations and their lasting impact.',
    price: 39.99,
    category: 'Books',
    brand: 'HistoryPress',
    stock: 20,
    images: [{
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
      alt: 'History of Ancient Civilizations Book'
    }],
    tags: ['history', 'ancient', 'civilizations', 'education'],
    isFeatured: false
  },
  {
    name: 'Data Science with Python',
    description: 'Learn data science and machine learning using Python and popular libraries.',
    price: 44.99,
    category: 'Books',
    brand: 'DataBooks',
    stock: 30,
    images: [{
      url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
      alt: 'Data Science with Python Book'
    }],
    tags: ['data-science', 'python', 'machine-learning', 'programming'],
    isFeatured: true
  },

  // Beauty Category (6 products)
  {
    name: 'Natural Face Moisturizer',
    description: 'Hydrating face moisturizer with natural ingredients suitable for all skin types.',
    price: 28.99,
    category: 'Health & Beauty',
    brand: 'NaturalGlow',
    stock: 60,
    images: [{
      url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
      alt: 'Natural Face Moisturizer'
    }],
    tags: ['skincare', 'natural', 'moisturizer', 'beauty'],
    isFeatured: false
  },
  {
    name: 'Vitamin C Serum',
    description: 'Brightening vitamin C serum that helps reduce dark spots and boost collagen.',
    price: 35.99,
    category: 'Health & Beauty',
    brand: 'GlowSkin',
    stock: 45,
    images: [{
      url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
      alt: 'Vitamin C Serum'
    }],
    tags: ['serum', 'vitamin-c', 'brightening', 'anti-aging'],
    isFeatured: true
  },
  {
    name: 'Makeup Brush Set Professional',
    description: '15-piece professional makeup brush set with premium synthetic bristles.',
    price: 49.99,
    originalPrice: 69.99,
    category: 'Health & Beauty',
    brand: 'BeautyPro',
    stock: 40,
    images: [{
      url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
      alt: 'Makeup Brush Set Professional'
    }],
    tags: ['makeup', 'brushes', 'professional', 'synthetic'],
    isFeatured: true
  },
  {
    name: 'Hair Care Treatment Set',
    description: 'Complete hair care set with shampoo, conditioner, and nourishing hair mask.',
    price: 42.99,
    category: 'Health & Beauty',
    brand: 'HairLux',
    stock: 35,
    images: [{
      url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500',
      alt: 'Hair Care Treatment Set'
    }],
    tags: ['hair-care', 'shampoo', 'conditioner', 'treatment'],
    isFeatured: false
  },
  {
    name: 'Sunscreen SPF 50',
    description: 'Broad-spectrum sunscreen with SPF 50 protection, lightweight and non-greasy.',
    price: 22.99,
    category: 'Health & Beauty',
    brand: 'SunGuard',
    stock: 70,
    images: [{
      url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500',
      alt: 'Sunscreen SPF 50'
    }],
    tags: ['sunscreen', 'spf-50', 'protection', 'lightweight'],
    isFeatured: false
  },
  {
    name: 'Perfume Floral Essence',
    description: 'Elegant floral perfume with notes of rose, jasmine, and white tea.',
    price: 89.99,
    category: 'Health & Beauty',
    brand: 'Essence',
    stock: 25,
    images: [{
      url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
      alt: 'Perfume Floral Essence'
    }],
    tags: ['perfume', 'floral', 'elegant', 'fragrance'],
    isFeatured: true
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('👤 Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@marketly.com',
      password: 'Admin123!',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    };

    const admin = await User.create(adminData);
    console.log('👤 Admin user created:', admin.email);
    console.log('🔐 Admin password: Admin123!');
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

const createSampleProducts = async (adminUser) => {
  try {
    // Clear existing products first
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      console.log(`📦 Clearing ${existingProducts} existing products...`);
      await Product.deleteMany({});
      console.log('✅ Existing products cleared');
    }

    // Create sample products
    const products = sampleProducts.map(product => ({
      ...product,
      createdBy: adminUser._id
    }));

    const createdProducts = await Product.insertMany(products);
    console.log(`📦 Created ${createdProducts.length} sample products`);
    
    // Display created products by category
    const categoryGroups = {};
    createdProducts.forEach(product => {
      if (!categoryGroups[product.category]) {
        categoryGroups[product.category] = [];
      }
      categoryGroups[product.category].push(product);
    });

    Object.keys(categoryGroups).forEach(category => {
      console.log(`   ${category}: ${categoryGroups[category].length} products`);
      categoryGroups[category].forEach(product => {
        console.log(`     - ${product.name} ($${product.price})`);
      });
    });

  } catch (error) {
    console.error('❌ Error creating sample products:', error);
    throw error;
  }
};

const setupDatabase = async () => {
  console.log('🚀 Starting Marketly database setup...\n');

  try {
    await connectDB();
    
    console.log('👤 Setting up admin user...');
    const adminUser = await createAdminUser();
    
    console.log('\n📦 Setting up sample products...');
    await createSampleProducts(adminUser);
    
    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('   - MongoDB connection established');
    console.log('   - Admin user created (admin@marketly.com / Admin123!)');
    console.log('   - Sample products added');
    console.log('\n🎉 Your Marketly application is ready!');
    console.log('\nNext steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test admin login with: admin@marketly.com / Admin123!');
    console.log('   3. Create your frontend and connect to the API');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = {
  setupDatabase,
  createAdminUser,
  createSampleProducts
}; 