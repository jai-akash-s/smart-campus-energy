import React from 'react';

const getColor = (type) => {
  switch (type) {
    case 'error':
      return 'bg-red-600';
    case 'warning':
      return 'bg-amber-500';
    case 'success':
      return 'bg-emerald-600';
    default:
      return 'bg-blue-600';
  }
};

const ToastStack = ({ toasts = [], onClose }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-24 right-4 z-[70] space-y-2 w-80">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${getColor(toast.type)} text-white rounded-lg shadow-lg px-4 py-3`}>
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-bold text-sm">{toast.title}</p>
              <p className="text-xs opacity-95 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => onClose(toast.id)} className="text-xs font-bold">
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastStack;
