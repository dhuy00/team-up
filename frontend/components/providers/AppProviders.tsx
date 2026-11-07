"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <LanguageProvider>
        <ToastProvider>
          <NotificationProvider>
            <AuthProvider>{children}</AuthProvider>
          </NotificationProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
