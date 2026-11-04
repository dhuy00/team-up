"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

export interface TruncatedPopoverProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p" | "h3" | "h4" | "strong" | "button";
  id?: string;
  side?: "top" | "bottom";
  align?: "left" | "center" | "right";
  delayMs?: number;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const emptySubscribe = () => () => {};

export const TruncatedPopover: React.FC<TruncatedPopoverProps> = ({
  text,
  children,
  className = "",
  as: Component = "span",
  id,
  side = "top",
  align = "left",
  delayMs = 2000,
  onClick,
  type,
  disabled,
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [actualSide, setActualSide] = useState<"top" | "bottom">(side);
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const checkOverflowAndShow = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;

    // Detect if content is clipped/overflowing horizontally or vertically
    const isOverflowing =
      el.scrollWidth > el.clientWidth + 1 ||
      el.scrollHeight > el.clientHeight + 1;

    if (!isOverflowing) {
      setIsVisible(false);
      return;
    }

    const rect = el.getBoundingClientRect();
    let computedSide = side;
    let top = rect.top - 8;
    if (side === "bottom" || top < 60) {
      top = rect.bottom + 8;
      computedSide = "bottom";
    } else {
      computedSide = "top";
    }

    let left = rect.left;
    if (align === "center") {
      left = rect.left + rect.width / 2;
    } else if (align === "right") {
      left = rect.right;
    }

    // Viewport padding safety bounds
    const maxLeft = window.innerWidth - 16;
    if (left > maxLeft) left = maxLeft;
    if (left < 16) left = 16;

    setActualSide(computedSide);
    setCoords({ top, left });
    setIsVisible(true);
  }, [side, align]);

  // Clear timer and hide on unmount, scroll, or window resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      clearTimer();
      setIsVisible(false);
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      clearTimer();
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [clearTimer]);

  const handleMouseEnter = () => {
    clearTimer();
    if (delayMs > 0) {
      timerRef.current = setTimeout(() => {
        checkOverflowAndShow();
      }, delayMs);
    } else {
      checkOverflowAndShow();
    }
  };

  const handleMouseLeave = () => {
    clearTimer();
    setIsVisible(false);
  };

  const popoverContent = text ?? children;

  let transformValue = "translate(0, -100%)";
  if (actualSide === "bottom") {
    if (align === "center") transformValue = "translate(-50%, 0)";
    else if (align === "right") transformValue = "translate(-100%, 0)";
    else transformValue = "translate(0, 0)";
  } else {
    if (align === "center") transformValue = "translate(-50%, -100%)";
    else if (align === "right") transformValue = "translate(-100%, -100%)";
    else transformValue = "translate(0, -100%)";
  }

  const renderTrigger = () => {
    const commonProps = {
      id,
      className,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    };

    if (Component === "button") {
      return (
        <button
          ref={(node) => {
            triggerRef.current = node;
          }}
          type={type || "button"}
          onClick={onClick}
          disabled={disabled}
          {...commonProps}
        >
          {children ?? text}
        </button>
      );
    }

    const Tag = Component;
    return (
      <Tag
        ref={(node: HTMLElement | null) => {
          triggerRef.current = node;
        }}
        onClick={onClick}
        {...commonProps}
      >
        {children ?? text}
      </Tag>
    );
  };

  return (
    <>
      {renderTrigger()}

      {isMounted && isVisible && createPortal(
        <div
          role="tooltip"
          className="fixed z-[9999] px-3.5 py-2 bg-ink text-canvas dark:bg-canvas dark:text-ink dark:border-border text-xs leading-relaxed font-medium rounded-[14px] shadow-2xl border border-ink/20 max-w-xs sm:max-w-sm md:max-w-md break-words whitespace-pre-wrap pointer-events-none transition-opacity duration-150 animate-in fade-in"
          style={{
            top: coords.top,
            left: coords.left,
            transform: transformValue,
          }}
        >
          {popoverContent}
        </div>,
        document.body
      )}
    </>
  );
};

export default TruncatedPopover;
