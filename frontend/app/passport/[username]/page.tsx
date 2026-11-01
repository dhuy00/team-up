"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { PassportPageView } from "@/components/navigation/routes";

function PublicPassportRouteContent() {
  const params = useParams<{ username?: string }>();
  const username =
    typeof params?.username === "string" ? params.username : undefined;

  return <PassportPageView username={username} />;
}

export default function PublicPassportRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" />
      }
    >
      <PublicPassportRouteContent />
    </Suspense>
  );
}
