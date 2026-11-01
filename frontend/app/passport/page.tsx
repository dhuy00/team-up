"use client";

import React, { Suspense } from "react";
import { PassportPageView } from "@/components/navigation/routes";

export default function PassportRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" />
      }
    >
      <PassportPageView />
    </Suspense>
  );
}
