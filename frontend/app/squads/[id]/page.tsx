"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { SquadsPageView } from "@/components/navigation/routes";

function SquadDetailRouteContent() {
  const params = useParams<{ id?: string }>();
  const rawId = params?.id ? Number(params.id) : null;
  const squadId = rawId && Number.isFinite(rawId) ? rawId : null;

  return <SquadsPageView initialSquadId={squadId} />;
}

export default function SquadDetailRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      }
    >
      <SquadDetailRouteContent />
    </Suspense>
  );
}
