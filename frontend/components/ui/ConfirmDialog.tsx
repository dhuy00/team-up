"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="bg-canvas rounded-[24px] max-w-md w-full p-6 border border-border shadow-2xl space-y-5 transition-colors duration-200 dropdown-popover">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-negative/10 border border-negative/30 text-negative flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3
              id="confirm-dialog-title"
              className="text-lg font-[900] text-ink tracking-tight"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("common.close")}
            className="p-1.5 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p
          id="confirm-dialog-message"
          className="text-xs sm:text-sm text-body leading-relaxed"
        >
          {message}
        </p>

        <div className="pt-2 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-canvas-soft hover:bg-border/60 text-ink font-semibold rounded-[24px] border border-border transition cursor-pointer text-xs sm:text-sm"
          >
            {cancelLabel || t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 bg-negative hover:bg-negative-deep text-white font-semibold rounded-[24px] transition cursor-pointer text-xs sm:text-sm shadow-sm"
          >
            {confirmLabel || t("common.deleteMatch")}
          </button>
        </div>
      </div>
    </div>
  );
};
