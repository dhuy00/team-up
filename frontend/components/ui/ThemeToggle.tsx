"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-canvas-soft border border-border" />
    );
  }

  const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      title={`Current: ${theme}. Click to switch theme`}
      aria-label="Toggle color theme"
      className="w-9 h-9 rounded-full bg-canvas border border-border flex items-center justify-center text-ink hover:bg-canvas-soft transition-colors cursor-pointer"
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4 text-primary" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4 text-warning-deep" />
      ) : (
        <Monitor className="w-4 h-4 text-mute" />
      )}
    </button>
  );
}

export default ThemeToggle;
