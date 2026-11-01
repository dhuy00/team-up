"use client";

import React, { Suspense } from "react";
import { ExplorePageView } from "@/components/explore/ExplorePageView";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      }
    >
      <ExplorePageView />
    </Suspense>
  );
}
