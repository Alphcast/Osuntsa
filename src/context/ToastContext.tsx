import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastMethods = {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastMethods }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container & Presentation Component
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-60 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 rounded-xl shadow-2xl border p-4 flex items-start gap-3 text-xs backdrop-blur-md ${
              isSuccess
                ? 'bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-950/20'
                : isError
                ? 'bg-red-950/95 text-white border-red-500/50 shadow-red-950/20'
                : isWarning
                ? 'bg-amber-950/95 text-white border-amber-500/50 shadow-amber-950/20'
                : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess && (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                </div>
              )}
              {isError && (
                <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/40 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
              {isWarning && (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              {!isSuccess && !isError && !isWarning && (
                <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40 text-blue-400">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-white tracking-tight">
                  {toast.title}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                  TSA Alert
                </span>
              </div>
              {toast.message && (
                <p className="text-slate-300 leading-relaxed text-xs">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
