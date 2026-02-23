import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const baseItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/sensors', label: 'Sensors' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin', label: 'Admin', adminOnly: true }
];

const SidebarNav = () => {
  const ADMIN_EMAIL = 'akash.saravanan1797@gmail.com';
  const { user } = useAuth();
  const canAccessAdmin = user?.role === 'admin' && String(user?.email || '').toLowerCase() === ADMIN_EMAIL;
  const items = baseItems.filter((item) => !item.adminOnly || canAccessAdmin);

  return (
    <aside className="hidden md:block fixed top-[73px] left-0 h-[calc(100vh-73px)] w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-30">
      <nav className="p-4 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarNav;
