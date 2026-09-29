"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "@/context/LanguageContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
