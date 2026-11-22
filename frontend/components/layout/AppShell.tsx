"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CreateEventModal } from "@/components/explore/CreateEventModal";
import { AuthModal } from "@/components/auth/AuthModal";
import { OnboardingWizardModal } from "@/components/auth/OnboardingWizardModal";
import { EventActivity } from "@/types/models";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/context/AuthContext";

const emptySubscribe = () => () => {};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { createEvent } = useEvents();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isStandaloneAuthPage =
    pathname === "/auth" || pathname === "/signin" || pathname === "/signup";

  const isProtectedRoute =
    Boolean(pathname?.startsWith("/passport")) ||
    Boolean(pathname?.startsWith("/chats"));

  useEffect(() => {
    if (!isHydrated) return;
    if (!user && isProtectedRoute) {
      router.replace("/signin");
    } else if (user && isStandaloneAuthPage) {
      router.replace("/");
    }
  }, [isHydrated, isProtectedRoute, isStandaloneAuthPage, router, user]);

  const handleHostGameClick = () => {
    if (!user) {
      router.push("/signin");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleEventCreated = (newEvent: EventActivity) => {
    createEvent(newEvent);
    router.push("/");
  };

  if (isStandaloneAuthPage) {
    return (
      <>
        {isHydrated && !user ? (
          children
        ) : (
          <div className="min-h-screen bg-canvas-soft" />
        )}
        <OnboardingWizardModal />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink transition-colors duration-200">
      <Navigation onHostGameClick={handleHostGameClick} />

      {isHydrated && (!isProtectedRoute || Boolean(user)) ? (
        children
      ) : (
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" />
      )}

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <AuthModal />
      <OnboardingWizardModal />

      <Footer />
    </div>
  );
};

export default AppShell;
