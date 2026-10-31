"use client";

import { useEffect } from "react";

let activeLockCount = 0;
let originalBodyOverflow = "";
let originalBodyPaddingRight = "";

/**
 * Locks outer page (`document.body`) scrolling while `isLocked` is true.
 * Uses a reference counter so stacked modals (e.g. EventDetailModal + ConfirmDialog)
 * keep the body locked until the last modal closes.
 */
export function useLockBodyScroll(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") {
      return;
    }

    if (activeLockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.style.overflow = "hidden";
    }

    activeLockCount += 1;

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      }
    };
  }, [isLocked]);
}
