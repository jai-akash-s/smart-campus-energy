import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../hooks/useApi';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    roles: ['admin', 'operator', 'viewer'],
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    )
  },
  {
    to: '/sensors',
    label: 'Sensors',
    roles: ['admin', 'operator', 'viewer'],
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 2v2.07A8.004 8.004 0 004 12h2a6 6 0 1112 0h2a8.004 8.004 0 00-7-7.93V2h-2zm1 7a3 3 0 00-3 3c0 1.31.84 2.42 2 2.83V22h2v-7.17A3.001 3.001 0 0012 9z" />
      </svg>
    )
  },
  {
    to: '/alerts',
    label: 'Alerts',
    roles: ['admin', 'operator', 'viewer'],
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a7 7 0 00-7 7v4.59L3.29 15.3A1 1 0 004 17h16a1 1 0 00.71-1.7L19 13.59V9a7 7 0 00-7-7zm0 20a3 3 0 002.82-2H9.18A3 3 0 0012 22z" />
      </svg>
    )
  },
  {
    to: '/analytics',
    label: 'Analytics',
    roles: ['admin', 'operator', 'viewer'],
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M4 19h16v2H2V3h2v16zm3-2h2V9H7v8zm4 0h2V5h-2v12zm4 0h2v-6h-2v6z" />
      </svg>
    )
  },
  {
    to: '/admin',
    label: 'Admin',
    roles: ['admin'],
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1l3 3 4.24.76-.76 4.24L21 12l-2.52 2.99.76 4.24L15 20l-3 3-3-3-4.24-.76.76-4.24L3 12l2.52-2.99-.76-4.24L9 4l3-3zm0 6a5 5 0 100 10 5 5 0 000-10z" />
      </svg>
    )
  }
];

const SidebarNav = () => {
  const { user, logout } = useAuth();
  const { alerts } = useAlerts('active');
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const role = user?.role || 'viewer';
  const items = useMemo(() => NAV_ITEMS.filter((item) => item.roles.includes(role)), [role]);

  useEffect(() => {
    const onToggle = () => setMobileOpen((v) => !v);
    const onClose = () => setMobileOpen(false);
    window.addEventListener('toggle-sidebar', onToggle);
    window.addEventListener('close-sidebar', onClose);
    return () => {
      window.removeEventListener('toggle-sidebar', onToggle);
      window.removeEventListener('close-sidebar', onClose);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleCollapseToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar_collapsed', String(next));
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navClass = collapsed ? 'space-y-2' : 'space-y-1.5';
  const itemClass = collapsed ? 'justify-center' : 'justify-between';
  const asideWidth = collapsed ? 'w-20' : 'w-56';
  const contentPadding = collapsed ? 'p-3' : 'p-4';

  return (
    <>
      <div
        className={`md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`md:hidden fixed top-[73px] left-0 h-[calc(100vh-73px)] w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Sidebar navigation"
      >
        <div className="h-full flex flex-col p-4">
          <p className="px-1 mt-1 mb-2 text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">MAIN MENU</p>
          <nav className="space-y-1.5">
            {items.map((item) => (
              <NavLink
                key={`mobile-${item.to}`}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative block px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="inline-flex items-center justify-between w-full">
                    <span className="inline-flex items-center gap-2">
                      <span className={`absolute left-0 top-2 h-6 w-1 rounded-r ${isActive ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.to === '/alerts' && alerts.length > 0 && (
                      <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {alerts.length > 99 ? '99+' : alerts.length}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Logout"
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 17l1.41-1.41L14.83 13H21v-2h-6.17l2.58-2.59L16 7l-5 5 5 5zM4 5h7V3H4a2 2 0 00-2 2v14a2 2 0 002 2h7v-2H4V5z" />
                </svg>
                <span>Logout</span>
              </span>
            </button>
          </div>
        </div>
      </aside>

      <aside className={`hidden md:block fixed top-[73px] left-0 h-[calc(100vh-73px)] ${asideWidth} bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-r border-gray-200 dark:border-gray-700 z-30 transition-all duration-200`}>
        <div className={`h-full flex flex-col ${contentPadding}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} mb-3`}>
            {!collapsed && (
              <p className="px-1 text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400">MAIN MENU</p>
            )}
            <button
              onClick={handleCollapseToggle}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
              </svg>
            </button>
          </div>

          <nav className={navClass}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex ${itemClass} items-center px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                  }`
                }
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span className={`absolute left-0 top-2 h-6 w-1 rounded-r ${isActive ? 'bg-emerald-500' : 'bg-transparent'}`} />
                    <span className={`inline-flex items-center ${collapsed ? '' : 'gap-2'}`}>
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </span>
                    {!collapsed && item.to === '/alerts' && alerts.length > 0 && (
                      <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {alerts.length > 99 ? '99+' : alerts.length}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className={`w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 ${collapsed ? 'flex justify-center' : ''}`}
              aria-label="Logout"
              title={collapsed ? 'Logout' : undefined}
            >
              <span className={`inline-flex items-center ${collapsed ? '' : 'gap-2'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M16 17l1.41-1.41L14.83 13H21v-2h-6.17l2.58-2.59L16 7l-5 5 5 5zM4 5h7V3H4a2 2 0 00-2 2v14a2 2 0 002 2h7v-2H4V5z" />
                </svg>
                {!collapsed && <span>Logout</span>}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
