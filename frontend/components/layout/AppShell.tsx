"use client";

import React, { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { EventActivity } from "@/types/models";
import { useEvents } from "@/hooks/useEvents";

const emptySubscribe = () => () => {};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { createEvent } = useEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleEventCreated = (newEvent: EventActivity) => {
    createEvent(newEvent);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink transition-colors duration-200">
      <Navigation onHostGameClick={() => setIsCreateModalOpen(true)} />

      {isHydrated ? (
        children
      ) : (
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      )}

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <Footer />
    </div>
  );
};

export default AppShell;
