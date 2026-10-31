"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Check, AlertTriangle, Info, XCircle, X } from "lucide-react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION_MS = 3700;
const TOAST_EXIT_MS = 280;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, exiting: true } : item))
    );

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, TOAST_EXIT_MS);
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);

      window.setTimeout(() => {
        dismissToast(id);
      }, TOAST_DURATION_MS);
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string) => showToast(message, "success"),
    [showToast]
  );
  const warning = useCallback(
    (message: string) => showToast(message, "warning"),
    [showToast]
  );
  const error = useCallback(
    (message: string) => showToast(message, "error"),
    [showToast]
  );
  const info = useCallback(
    (message: string) => showToast(message, "info"),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, warning, error, info }}>
      {children}

      {/* Global Floating Toast Stack (Top-Right) */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          let badgeClasses = "bg-primary text-ink border-ink";
          let progressBarColor = "bg-primary";
          let IconComponent = Info;

          if (item.variant === "success") {
            badgeClasses = "bg-primary text-ink border-ink";
            progressBarColor = "bg-primary";
            IconComponent = Check;
          } else if (item.variant === "warning") {
            badgeClasses = "bg-[#ffd11a] text-[#0e0f0c] border-[#0e0f0c]";
            progressBarColor = "bg-[#ffd11a]";
            IconComponent = AlertTriangle;
          } else if (item.variant === "error") {
            badgeClasses = "bg-negative text-white border-negative";
            progressBarColor = "bg-negative";
            IconComponent = XCircle;
          }

          return (
            <div
              key={item.id}
              role="status"
              className={`group relative overflow-hidden pointer-events-auto bg-ink text-canvas border border-border rounded-[18px] px-4 py-3.5 shadow-2xl flex items-center gap-3 ${
                item.exiting ? "toast-exit" : "toast-enter"
              }`}
            >
              <span
                className={`toast-icon-pop w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${badgeClasses}`}
              >
                <IconComponent className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <p className="text-xs font-semibold leading-snug flex-1">
                {item.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="text-canvas/60 hover:text-canvas p-1 rounded-full transition cursor-pointer shrink-0 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Animated Toastify-style Bottom Countdown Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden">
                <div
                  className={`h-full w-full toast-progress-bar ${progressBarColor}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
