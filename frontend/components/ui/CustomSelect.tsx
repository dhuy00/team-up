"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  id?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  triggerClassName = "",
  id,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      id={id}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between px-4 py-3 bg-canvas-soft border border-border rounded-[12px] text-sm font-semibold text-ink cursor-pointer transition-colors duration-150 hover:border-ink/60 focus:outline-none focus:border-ink ${
          isOpen ? "border-ink shadow-xs" : ""
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center text-sm leading-none">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate leading-snug">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-mute shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? "rotate-180 text-ink" : ""
          }`}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="dropdown-popover absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-canvas border border-border rounded-[16px] shadow-xl max-h-64 overflow-y-auto"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary-pale text-positive-deep font-bold"
                    : "text-ink hover:bg-canvas-soft"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {option.icon && (
                    <span className="shrink-0 flex items-center text-base">
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-positive-deep stroke-[2.5] shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
