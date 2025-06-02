import React, { useState } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Help = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqCategories = [
    {
      title: "Orders & Shipping",
      faqs: [
        {
          question: "How long does shipping take?",
          answer: "Standard shipping takes 3-7 business days. Express shipping takes 1-3 business days. Free shipping is available on orders over $50."
        },
        {
          question: "Can I track my order?",
          answer: "Yes! Once your order ships, you'll receive a tracking number via email. You can also track your order in the 'Track Order' section using your order number."
        },
        {
          question: "Can I change or cancel my order?",
          answer: "You can modify or cancel your order within 1 hour of placing it. After that, please contact customer service as soon as possible."
        },
        {
          question: "What shipping options are available?",
          answer: "We offer standard shipping (3-7 days), express shipping (1-3 days), and same-day delivery in select areas."
        }
      ]
    },
    {
      title: "Returns & Refunds",
      faqs: [
        {
          question: "What is your return policy?",
          answer: "We offer a 30-day return policy. Items must be unused and in original packaging. Return shipping is free for defective items."
        },
        {
          question: "How do I return an item?",
          answer: "Log into your account, go to 'My Orders', select the item you want to return, and follow the return process. Print the prepaid return label."
        },
        {
          question: "When will I receive my refund?",
          answer: "Refunds are processed within 5-7 business days after we receive your returned item. You'll receive an email confirmation."
        },
        {
          question: "Can I exchange an item?",
          answer: "Yes, you can exchange items for different sizes or colors. The exchange process is similar to returns."
        }
      ]
    },
    {
      title: "Account & Payment",
      faqs: [
        {
          question: "How do I create an account?",
          answer: "Click 'Sign Up' in the top navigation. You'll need to provide your email, create a password, and verify your email address."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay."
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, we use industry-standard SSL encryption to protect your payment information. We never store your full credit card details."
        },
        {
          question: "Can I save multiple addresses?",
          answer: "Yes, you can save multiple shipping and billing addresses in your account profile for faster checkout."
        }
      ]
    },
    {
      title: "Products & Inventory",
      faqs: [
        {
          question: "How do I know if an item is in stock?",
          answer: "Stock availability is shown on each product page. If an item is out of stock, you can sign up for restock notifications."
        },
        {
          question: "Are product images accurate?",
          answer: "We strive to show accurate product images. However, colors may vary slightly due to monitor settings."
        },
        {
          question: "How do I find product reviews?",
          answer: "Product reviews are displayed on each product page. You can filter reviews by rating and read detailed customer feedback."
        },
        {
          question: "Can I get product recommendations?",
          answer: "Yes, we provide personalized recommendations based on your browsing history and previous purchases."
        }
      ]
    }
  ];

  const supportOptions = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "Mon-Fri 9AM-6PM",
      action: "Start Chat"
    },
    {
      icon: PhoneIcon,
      title: "Phone Support",
      description: "Call us at (555) 123-4567",
      availability: "Mon-Fri 9AM-6PM",
      action: "Call Now"
    },
    {
      icon: EnvelopeIcon,
      title: "Email Support",
      description: "Send us an email",
      availability: "24/7 - Response within 24hrs",
      action: "Send Email"
    }
  ];

  const toggleFaq = (categoryIndex, faqIndex) => {
    const key = `${categoryIndex}-${faqIndex}`;
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
            <p className="text-lg text-gray-600">
              Find answers to common questions and get the support you need
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {category.title}
                    </h3>
                    
                    <div className="space-y-3">
                      {category.faqs.map((faq, faqIndex) => {
                        const isExpanded = expandedFaq === `${categoryIndex}-${faqIndex}`;
                        
                        return (
                          <div key={faqIndex} className="border border-gray-200 rounded-md">
                            <button
                              onClick={() => toggleFaq(categoryIndex, faqIndex)}
                              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <span className="font-medium text-gray-900">
                                {faq.question}
                              </span>
                              {isExpanded ? (
                                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                              )}
                            </button>
                            
                            {isExpanded && (
                              <div className="px-4 pb-3 border-t border-gray-200">
                                <p className="text-gray-600 pt-3">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Options */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Support</h2>
            
            <div className="space-y-4">
              {supportOptions.map((option, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <option.icon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {option.description}
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        {option.availability}
                      </p>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                        {option.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="/track-order" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  Track Your Order
                </a>
                <a href="/contact" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  Contact Us
                </a>
                <a href="/profile" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  My Account
                </a>
                <a href="/orders" className="block text-blue-600 hover:text-blue-800 transition-colors">
                  Order History
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help; 