import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastStack from '../components/ToastStack';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = toast.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = {
      id,
      type: toast.type || 'info',
      title: toast.title || 'Notification',
      message: toast.message || '',
      duration: Number.isFinite(toast.duration) ? toast.duration : 3500
    };
    setToasts((prev) => [next, ...prev].slice(0, 5));
    if (next.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, next.duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onClose={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
