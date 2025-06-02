import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowRightIcon, 
  StarIcon, 
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import * as productAPI from '../services/productAPI';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ProductCard from '../components/Products/ProductCard';

const Home = () => {
  const { addToCart } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch featured products
  const { data: featuredProducts, isLoading: featuredLoading } = useQuery(
    'featured-products',
    () => productAPI.getFeaturedProducts(8),
    {
      select: (response) => response.data.data,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch new arrivals
  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery(
    'new-arrivals',
    () => productAPI.getNewArrivals(8),
    {
      select: (response) => response.data.data,
      staleTime: 10 * 60 * 1000,
    }
  );

  // Fetch best sellers
  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery(
    'best-sellers',
    () => productAPI.getBestSellers(8),
    {
      select: (response) => response.data.data,
      staleTime: 10 * 60 * 1000,
    }
  );

  // Hero carousel slides
  const slides = [
    {
      id: 1,
      title: "Summer Collection 2024",
      subtitle: "Up to 50% Off",
      description: "Discover the latest trends in fashion, electronics, and more",
      cta: "Shop Now",
      link: "/products?category=Clothing",
      image: "/images/hero-1.jpg",
      gradient: "from-blue-600 to-purple-600"
    },
    {
      id: 2,
      title: "Tech Deals",
      subtitle: "Latest Gadgets",
      description: "Get the newest tech at unbeatable prices",
      cta: "Explore Tech",
      link: "/products?category=Electronics",
      image: "/images/hero-2.jpg",
      gradient: "from-green-600 to-blue-600"
    },
    {
      id: 3,
      title: "Home & Garden",
      subtitle: "Transform Your Space",
      description: "Quality home essentials for modern living",
      cta: "Shop Home",
      link: "/products?category=Home & Garden",
      image: "/images/hero-3.jpg",
      gradient: "from-purple-600 to-pink-600"
    }
  ];

  // Categories data
  const categories = [
    {
      name: "Electronics",
      slug: "Electronics",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500",
      count: "15+ items"
    },
    {
      name: "Clothing",
      slug: "Clothing",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      count: "25+ items"
    },
    {
      name: "Home & Garden",
      slug: "Home & Garden",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500",
      count: "20+ items"
    },
    {
      name: "Sports & Outdoors",
      slug: "Sports & Outdoors",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500",
      count: "12+ items"
    },
    {
      name: "Books",
      slug: "Books",
      image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500",
      count: "15+ items"
    },
    {
      name: "Health & Beauty",
      slug: "Health & Beauty",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500",
      count: "18+ items"
    }
  ];

  // Auto-rotate hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const features = [
    {
      icon: TruckIcon,
      title: "Free Shipping",
      description: "Free shipping on orders over $50"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure Payment",
      description: "100% secure payment processing"
    },
    {
      icon: CurrencyDollarIcon,
      title: "Money Back",
      description: "30-day money back guarantee"
    },
    {
      icon: PhoneIcon,
      title: "24/7 Support",
      description: "Dedicated customer support"
    }
  ];

  const handleAddToCart = async (productId) => {
    try {
      await addToCart(productId, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] lg:h-[600px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} opacity-90`} />
            
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
                    {slide.title}
                  </h1>
                  <p className="text-xl lg:text-2xl text-white/90 mb-2 animate-fade-in">
                    {slide.subtitle}
                  </p>
                  <p className="text-lg text-white/80 mb-8 animate-fade-in">
                    {slide.description}
                  </p>
                  <Link
                    to={slide.link}
                    className="btn btn-primary btn-lg inline-flex items-center space-x-2 animate-fade-in"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our wide range of products across different categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/products?category=${category.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.count}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600">
                Hand-picked products just for you
              </p>
            </div>
            <Link
              to="/products"
              className="btn btn-outline inline-flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts?.slice(0, 8).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product._id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                New Arrivals
              </h2>
              <p className="text-lg text-gray-600">
                Latest products in our collection
              </p>
            </div>
            <Link
              to="/products?sort=newest"
              className="btn btn-outline inline-flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {newArrivalsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="product-grid">
              {newArrivals?.slice(0, 8).map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product._id)}
                  showNewBadge
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products, 
            exclusive deals, and special offers.
          </p>
          
          <div className="max-w-md mx-auto">
            <form className="flex space-x-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 