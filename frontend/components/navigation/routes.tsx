"use client";

import React from "react";
import { Compass, Shield, MessageSquare, User } from "lucide-react";
import { EventActivity } from "@/types/models";
import { QuickFilterState } from "@/constants/explore";
import { HeroSection } from "@/components/home/HeroSection";
import { ExploreSection } from "@/components/explore/ExploreSection";
import { SquadsSection } from "@/components/squads/SquadsSection";
import { ChatSection } from "@/components/chat/ChatSection";
import { PassportSection } from "@/components/passport/PassportSection";

/**
 * Route & Tab Identifiers
 */
export const NAV_TAB_IDS = {
  EXPLORE: 1,
  SQUADS: 2,
  CHATS: 3,
  PASSPORT: 4,
} as const;

export type NavTabId = (typeof NAV_TAB_IDS)[keyof typeof NAV_TAB_IDS];

/**
 * Shared props provided to each route page component
 */
export interface AppPageProps {
  events: EventActivity[];
  onToggleJoin: (eventId: number) => void;
  quickFilter: QuickFilterState;
  onQuickFind: (sport: string, distanceKm: number) => void;
  onExploreClick: () => void;
  onNavigateTab: (tabId: number) => void;
  onOpenCreateEvent: () => void;
}

/**
 * Route 1: Explore Games & Match Finder Page
 */
export const ExplorePageView: React.FC<AppPageProps> = ({
  events,
  onToggleJoin,
  quickFilter,
  onQuickFind,
  onExploreClick,
  onNavigateTab,
}) => {
  return (
    <>
      <HeroSection
        onExploreClick={onExploreClick}
        onBrowseSquadsClick={() => onNavigateTab(NAV_TAB_IDS.SQUADS)}
        onQuickFind={onQuickFind}
      />
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExploreSection
          events={events}
          onToggleJoin={onToggleJoin}
          selectedSport={quickFilter.sport}
          selectedRadius={quickFilter.radius}
        />
      </main>
    </>
  );
};

/**
 * Route 2: Clubs & Squads Page
 */
export const SquadsPageView: React.FC<AppPageProps> = ({
  onOpenCreateEvent,
}) => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SquadsSection onOpenCreateSquad={onOpenCreateEvent} />
    </main>
  );
};

/**
 * Route 3: Match & Squad Chat Page
 */
export const ChatPageView: React.FC<AppPageProps> = () => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ChatSection />
    </main>
  );
};

/**
 * Route 4: Sports Passport & Reliability Karma Page
 */
export const PassportPageView: React.FC<AppPageProps> = () => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PassportSection />
    </main>
  );
};

/**
 * Unified Route Definition
 */
export interface NavRoute {
  id: number;
  key: string;
  nameKey: string;
  icon: (props?: { className?: string }) => React.ReactNode;
  component: React.ComponentType<AppPageProps>;
}

export const APP_ROUTES: NavRoute[] = [
  {
    id: NAV_TAB_IDS.EXPLORE,
    key: "explore",
    nameKey: "nav.exploreGames",
    icon: (props) => <Compass className={props?.className || "w-4 h-4"} />,
    component: ExplorePageView,
  },
  {
    id: NAV_TAB_IDS.SQUADS,
    key: "squads",
    nameKey: "nav.clubsAndSquads",
    icon: (props) => <Shield className={props?.className || "w-4 h-4"} />,
    component: SquadsPageView,
  },
  {
    id: NAV_TAB_IDS.CHATS,
    key: "chats",
    nameKey: "nav.chats",
    icon: (props) => <MessageSquare className={props?.className || "w-4 h-4"} />,
    component: ChatPageView,
  },
  {
    id: NAV_TAB_IDS.PASSPORT,
    key: "passport",
    nameKey: "nav.sportsPassport",
    icon: (props) => <User className={props?.className || "w-4 h-4"} />,
    component: PassportPageView,
  },
];

/**
 * Current Page Renderer
 * Renders the active route's component dynamically without condition chaining in page.tsx
 */
export interface CurrentPageRendererProps extends AppPageProps {
  activeTab: number;
}

export const CurrentPageRenderer: React.FC<CurrentPageRendererProps> = ({
  activeTab,
  ...pageProps
}) => {
  const currentRoute =
    APP_ROUTES.find((route) => route.id === activeTab) || APP_ROUTES[0];
  const Component = currentRoute.component;

  return <Component {...pageProps} />;
};

export default APP_ROUTES;
