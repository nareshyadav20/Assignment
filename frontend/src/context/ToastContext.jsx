import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', duration = 5000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          const isCritical = toast.type === 'critical';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-bottom-5 duration-300 ${
                isCritical
                  ? 'bg-slate-900 border-red-500/80 text-white cyber-glow-rose'
                  : isSuccess
                  ? 'bg-slate-900 border-emerald-500/80 text-white cyber-glow-emerald'
                  : isWarning
                  ? 'bg-slate-900 border-amber-500/80 text-white'
                  : 'bg-slate-900 border-indigo-500/80 text-white'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isCritical ? (
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-bounce" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 text-indigo-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-300 leading-relaxed break-words">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
