import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const TrackOrder = () => {
  const [trackingData, setTrackingData] = useState({
    orderNumber: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTrackingData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    
    if (!trackingData.orderNumber.trim()) {
      setError('Please enter your order number');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      // Mock tracking data
      if (trackingData.orderNumber.toLowerCase() === 'ord123' || trackingData.orderNumber === '12345') {
        setTrackingResult({
          orderNumber: trackingData.orderNumber.toUpperCase(),
          status: 'in_transit',
          estimatedDelivery: '2025-06-02',
          trackingNumber: 'TRK789456123',
          carrier: 'FastShip Express',
          items: [
            {
              name: 'Wireless Bluetooth Headphones',
              quantity: 1,
              price: 79.99,
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'
            },
            {
              name: 'Programming JavaScript Applications',
              quantity: 1,
              price: 34.99,
              image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200'
            }
          ],
          timeline: [
            {
              status: 'order_placed',
              title: 'Order Placed',
              description: 'Your order has been received and confirmed',
              timestamp: '2025-05-30T10:30:00Z',
              completed: true
            },
            {
              status: 'processing',
              title: 'Processing',
              description: 'Your order is being prepared for shipment',
              timestamp: '2025-05-30T14:15:00Z',
              completed: true
            },
            {
              status: 'shipped',
              title: 'Shipped',
              description: 'Your order has been dispatched from our warehouse',
              timestamp: '2025-05-31T09:45:00Z',
              completed: true
            },
            {
              status: 'in_transit',
              title: 'In Transit',
              description: 'Your package is on its way to the delivery address',
              timestamp: '2025-05-31T16:20:00Z',
              completed: true,
              current: true
            },
            {
              status: 'out_for_delivery',
              title: 'Out for Delivery',
              description: 'Your package is out for delivery',
              timestamp: null,
              completed: false
            },
            {
              status: 'delivered',
              title: 'Delivered',
              description: 'Package has been delivered successfully',
              timestamp: null,
              completed: false
            }
          ],
          shippingAddress: {
            name: 'John Doe',
            address: '123 Main Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          }
        });
      } else {
        setError('Order not found. Please check your order number and try again.');
        setTrackingResult(null);
      }
      setIsLoading(false);
    }, 1500);
  };

  const getStatusIcon = (status, completed, current) => {
    if (completed) {
      return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
    } else if (current) {
      return <ClockIcon className="h-6 w-6 text-blue-600" />;
    } else {
      return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'in_transit':
      case 'out_for_delivery':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <TruckIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-lg text-gray-600">
              Enter your order details below to track your package
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tracking Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleTrackOrder} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number *
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  required
                  value={trackingData.orderNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., ORD123 or 12345"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={trackingData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Tracking...
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Track Order
                </>
              )}
            </button>
          </form>

          {/* Sample Order Numbers */}
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Try these sample order numbers:</strong> ORD123, 12345
            </p>
          </div>
        </div>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Order #{trackingResult.orderNumber}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingResult.status)}`}>
                      {trackingResult.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-gray-600">
                      Tracking: {trackingResult.trackingNumber}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 text-right">
                  <p className="text-sm text-gray-600">Estimated Delivery</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(trackingResult.estimatedDelivery)}
                  </p>
                  <p className="text-sm text-gray-600">via {trackingResult.carrier}</p>
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items in this order</h3>
                <div className="space-y-4">
                  {trackingResult.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Tracking Timeline</h3>
              
              <div className="space-y-6">
                {trackingResult.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    {getStatusIcon(event.status, event.completed, event.current)}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${event.completed || event.current ? 'text-gray-900' : 'text-gray-500'}`}>
                          {event.title}
                        </h4>
                        {event.timestamp && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {formatDate(event.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${event.completed || event.current ? 'text-gray-600' : 'text-gray-400'}`}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Delivery Address
              </h3>
              
              <div className="text-gray-600">
                <p className="font-medium text-gray-900">{trackingResult.shippingAddress.name}</p>
                <p>{trackingResult.shippingAddress.address}</p>
                <p>
                  {trackingResult.shippingAddress.city}, {trackingResult.shippingAddress.state} {trackingResult.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder; 