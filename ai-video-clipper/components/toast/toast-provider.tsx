"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.duration ?? (toast.type === "error" ? 6000 : 4000);

      setToasts((prev) => [...prev, { ...toast, id }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: "success", title, message }),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: "error", title, message }),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: "warning", title, message }),
    [addToast]
  );
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: "info", title, message }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container ─────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ─── Individual Toast ────────────────────────────────────────────

const ICON_MAP: Record<ToastType, ReactNode> = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="16" y2="12" /><line x1="12" x2="12.01" y1="8" y2="8" />
    </svg>
  ),
};

const BG_MAP: Record<ToastType, string> = {
  success: "border-green-200 dark:border-green-900/40",
  error: "border-red-200 dark:border-red-900/40",
  warning: "border-yellow-200 dark:border-yellow-900/40",
  info: "border-blue-200 dark:border-blue-900/40",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      role="alert"
      className={`flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border bg-card p-4 shadow-lg animate-slide-in-right ${BG_MAP[toast.type]}`}
    >
      <div className="shrink-0 mt-0.5">{ICON_MAP[toast.type]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-1.5 text-xs font-medium text-primary hover:underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-secondary hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
        </svg>
      </button>
    </div>
  );
}
