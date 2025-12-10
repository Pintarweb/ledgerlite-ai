import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'
      }`}>
        {type === 'success' ? <CheckCircle size={20} className="text-emerald-500" /> : <Info size={20} className="text-indigo-500" />}
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};