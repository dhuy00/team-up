import React, { Suspense } from "react";
import { AuthPageView } from "@/components/auth/AuthPageView";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas-soft" />}>
      <AuthPageView defaultMode="signin" />
    </Suspense>
  );
}
