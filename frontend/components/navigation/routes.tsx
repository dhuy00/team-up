"use client";

import React from "react";
import { Compass, Shield, MessageSquare, User } from "lucide-react";
import { EventActivity } from "@/types/models";
import { ExplorePageView } from "@/components/explore/ExplorePageView";
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
 * General props passed to active route views
 */
export interface AppPageProps {
  onNavigateTab?: (tabId: number) => void;
  onOpenCreateEvent?: () => void;
  onOpenMatchChat?: (event: EventActivity) => void;
  createdEvent?: EventActivity | null;
  focusedChatEvent?: EventActivity | null;
}

/**
 * Route 2: Clubs & Squads Page Wrapper
 */
export const SquadsPageView: React.FC<
  AppPageProps & { initialSquadId?: number | null }
> = ({ initialSquadId }) => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SquadsSection initialSquadId={initialSquadId} />
    </main>
  );
};

/**
 * Route 3: Match & Squad Chat Page Wrapper
 */
export const ChatPageView: React.FC<
  AppPageProps & {
    focusedChannelId?: number | null;
    focusedEventId?: number | null;
  }
> = ({ focusedChatEvent, focusedChannelId, focusedEventId }) => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <ChatSection
        focusedEvent={focusedChatEvent}
        focusedChannelId={focusedChannelId}
        focusedEventId={focusedEventId}
      />
    </main>
  );
};

/**
 * Route 4: Sports Passport & Reliability Karma Page Wrapper
 */
export const PassportPageView: React.FC<
  AppPageProps & { username?: string }
> = ({ username }) => {
  return (
    <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <PassportSection username={username} />
    </main>
  );
};

/**
 * Unified Route Definition
 */
export interface NavRoute {
  id: number;
  key: string;
  href: string;
  nameKey: string;
  icon: (props?: { className?: string }) => React.ReactNode;
}

export const APP_ROUTES: NavRoute[] = [
  {
    id: NAV_TAB_IDS.EXPLORE,
    key: "explore",
    href: "/",
    nameKey: "nav.exploreGames",
    icon: (props) => <Compass className={props?.className || "w-4 h-4"} />,
  },
  {
    id: NAV_TAB_IDS.SQUADS,
    key: "squads",
    href: "/squads",
    nameKey: "nav.clubsAndSquads",
    icon: (props) => <Shield className={props?.className || "w-4 h-4"} />,
  },
  {
    id: NAV_TAB_IDS.CHATS,
    key: "chats",
    href: "/chats",
    nameKey: "nav.chats",
    icon: (props) => <MessageSquare className={props?.className || "w-4 h-4"} />,
  },
  {
    id: NAV_TAB_IDS.PASSPORT,
    key: "passport",
    href: "/passport",
    nameKey: "nav.sportsPassport",
    icon: (props) => <User className={props?.className || "w-4 h-4"} />,
  },
];

/**
 * Resolve NAV_TAB_IDS from a Next.js pathname
 */
export function getRouteIdFromPathname(pathname: string | null): number {
  if (!pathname || pathname === "/" || pathname.startsWith("/explore")) {
    return NAV_TAB_IDS.EXPLORE;
  }
  if (pathname.startsWith("/squads")) {
    return NAV_TAB_IDS.SQUADS;
  }
  if (pathname.startsWith("/chats")) {
    return NAV_TAB_IDS.CHATS;
  }
  if (pathname.startsWith("/passport")) {
    return NAV_TAB_IDS.PASSPORT;
  }
  return NAV_TAB_IDS.EXPLORE;
}

/**
 * Resolve href from a tab ID
 */
export function getRouteHrefById(tabId: number): string {
  const found = APP_ROUTES.find((r) => r.id === tabId);
  return found ? found.href : "/";
}

/**
 * Current Page Renderer
 */
export interface CurrentPageRendererProps extends AppPageProps {
  activeTab: number;
}

export const CurrentPageRenderer: React.FC<CurrentPageRendererProps> = ({
  activeTab,
  ...pageProps
}) => {
  switch (activeTab) {
    case NAV_TAB_IDS.SQUADS:
      return <SquadsPageView {...pageProps} />;
    case NAV_TAB_IDS.CHATS:
      return <ChatPageView {...pageProps} />;
    case NAV_TAB_IDS.PASSPORT:
      return <PassportPageView {...pageProps} />;
    case NAV_TAB_IDS.EXPLORE:
    default:
      return <ExplorePageView {...pageProps} />;
  }
};

export default APP_ROUTES;
