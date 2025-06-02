import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ShoppingBagIcon, 
  HeartIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const UserDropdown = ({ user, onClose, onLogout }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const menuItems = [
    {
      icon: UserIcon,
      label: 'Profile',
      href: '/profile',
      description: 'Manage your account'
    },
    {
      icon: ShoppingBagIcon,
      label: 'My Orders',
      href: '/orders',
      description: 'Track your purchases'
    },
    {
      icon: HeartIcon,
      label: 'Wishlist',
      href: '/wishlist',
      description: 'Your saved items'
    },
    {
      icon: Cog6ToothIcon,
      label: 'Settings',
      href: '/profile/settings',
      description: 'Account preferences'
    }
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      icon: ShieldCheckIcon,
      label: 'Admin Dashboard',
      href: '/admin',
      description: 'Manage your store'
    });
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {user?.email}
            </p>
            {user?.role === 'admin' && (
              <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded-full mt-1">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <item.icon className="w-5 h-5 text-gray-400 mr-3" />
            <div className="flex-1">
              <p className="font-medium">{item.label}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 py-2">
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-400 mr-3" />
          <div className="flex-1 text-left">
            <p className="font-medium">Sign out</p>
            <p className="text-xs text-gray-500">Sign out of your account</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default UserDropdown; 