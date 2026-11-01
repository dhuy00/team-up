"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { ChatPageView } from "@/components/navigation/routes";

function ChatChannelRouteContent() {
  const params = useParams<{ channelId?: string }>();
  const rawId = params?.channelId ? Number(params.channelId) : null;
  const channelId = rawId && Number.isFinite(rawId) ? rawId : null;

  return <ChatPageView focusedChannelId={channelId} />;
}

export default function ChatChannelRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" />
      }
    >
      <ChatChannelRouteContent />
    </Suspense>
  );
}
