"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { SportPassportItem, UserProfile } from "@/types/models";
import { mockUserProfile } from "@/lib/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import { PASSPORT_STORAGE_KEY } from "@/services/passport";

export interface SessionUser {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile: UserProfile;
}

const DEMO_USERS: SessionUser[] = [
  {
    id: "usr-alex-morgan",
    email: "alex@teamup.app",
    onboardingCompleted: true,
    profile: mockUserProfile,
  },
  {
    id: "usr-marco-silva",
    email: "marco@teamup.app",
    onboardingCompleted: true,
    profile: {
      ...mockUserProfile,
      name: "Marco Silva",
      username: "@marcosilva",
      location: "North District • 2km radius",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
      karma: 96,
      tier: "Tier 1 • Verified Captain",
      bio: "7v7 Soccer midfielder and North District Thunder club captain. Always bring extra pinnies!",
      matchesCount: 64,
      noShowsCount: 0,
      endorsedCount: 51,
    },
  },
  {
    id: "usr-elena-rostova",
    email: "elena@teamup.app",
    onboardingCompleted: true,
    profile: {
      ...mockUserProfile,
      name: "Elena Rostova",
      username: "@elenarostova",
      location: "Eastside Courts • 5km radius",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
      karma: 100,
      tier: "Tier 1 • Perfect Attendance",
      bio: "Competitive badminton doubles player & weekend trail runner.",
      matchesCount: 38,
      noShowsCount: 0,
      endorsedCount: 36,
    },
  },
];

interface AuthContextValue {
  user: SessionUser | null;
  isAuthenticated: boolean;
  demoAccounts: SessionUser[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (input: {
    name: string;
    email: string;
    password?: string;
    username?: string;
    location?: string;
  }) => Promise<{ ok: boolean; errorKey?: string }>;
  switchDemoAccount: (account: SessionUser) => void;
  logout: () => void;
  completeOnboarding: (payload: {
    location: string;
    bio: string;
    sports: SportPassportItem[];
    availability: UserProfile["availability"];
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AUTH_SESSION_STORAGE_KEY = "teamup_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const toast = useToast();

  const [user, setUser] = usePersistentState<SessionUser | null>(
    AUTH_SESSION_STORAGE_KEY,
    DEMO_USERS[0]
  );
  const [, setPassportProfile] = usePersistentState<UserProfile>(
    PASSPORT_STORAGE_KEY,
    mockUserProfile
  );
  const [registeredAccounts, setRegisteredAccounts] = usePersistentState<
    SessionUser[]
  >("teamup_registered_accounts", DEMO_USERS);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const syncUserToPassport = useCallback(
    (nextUser: SessionUser) => {
      setUser(nextUser);
      setPassportProfile(nextUser.profile);
    },
    [setPassportProfile, setUser]
  );

  const login = useCallback(
    async (email: string, password?: string): Promise<boolean> => {
      const normalized = email.trim().toLowerCase();
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email: normalized, password }),
        });
        if (res.ok) {
          const data = (await res.json()) as { user: SessionUser };
          syncUserToPassport(data.user);
          toast.success(t("toast.signedInAs", { name: data.user.profile.name }));
          setIsAuthModalOpen(false);
          return true;
        }
      } catch {
        // Fallback to local accounts if offline
      }

      const localMatch = registeredAccounts.find(
        (acc) => acc.email.toLowerCase() === normalized
      );
      if (localMatch && (!password || password === "demo123")) {
        syncUserToPassport(localMatch);
        toast.success(t("toast.signedInAs", { name: localMatch.profile.name }));
        setIsAuthModalOpen(false);
        return true;
      }

      toast.error(t("auth.invalidCredentials"));
      return false;
    },
    [registeredAccounts, syncUserToPassport, t, toast]
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password?: string;
      username?: string;
      location?: string;
    }): Promise<{ ok: boolean; errorKey?: string }> => {
      const normalized = input.email.trim().toLowerCase();
      if (
        registeredAccounts.some((acc) => acc.email.toLowerCase() === normalized)
      ) {
        toast.error(t("auth.emailAlreadyExists"));
        return { ok: false, errorKey: "auth.emailAlreadyExists" };
      }

      let createdUser: SessionUser | null = null;
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", ...input }),
        });
        if (res.ok) {
          const data = (await res.json()) as { user: SessionUser };
          createdUser = data.user;
        }
      } catch {
        // Offline fallback
      }

      if (!createdUser) {
        const rawHandle = (
          input.username ||
          input.name.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "player"
        ).replace(/^@/, "");
        createdUser = {
          id: `usr-${Date.now()}`,
          email: normalized,
          onboardingCompleted: false,
          profile: {
            ...mockUserProfile,
            name: input.name.trim(),
            username: `@${rawHandle}`,
            location: input.location?.trim() || "Downtown & Metro Area",
            karma: 95,
            tier: "Tier 1 • New Member",
            matchesCount: 0,
            noShowsCount: 0,
            endorsedCount: 0,
          },
        };
      }

      setRegisteredAccounts((prev) => [...prev, createdUser!]);
      syncUserToPassport(createdUser);
      setIsAuthModalOpen(false);
      setIsOnboardingOpen(true);
      toast.success(t("toast.signedInAs", { name: createdUser.profile.name }));
      return { ok: true };
    },
    [registeredAccounts, setRegisteredAccounts, syncUserToPassport, t, toast]
  );

  const switchDemoAccount = useCallback(
    (account: SessionUser) => {
      syncUserToPassport(account);
      setIsAuthModalOpen(false);
      toast.success(t("toast.signedInAs", { name: account.profile.name }));
    },
    [syncUserToPassport, t, toast]
  );

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthModalOpen(false);
    toast.info(t("toast.signedOut"));
  }, [setUser, t, toast]);

  const completeOnboarding = useCallback(
    async (payload: {
      location: string;
      bio: string;
      sports: SportPassportItem[];
      availability: UserProfile["availability"];
    }) => {
      const targetUser = user ?? DEMO_USERS[0];
      const updatedProfile: UserProfile = {
        ...targetUser.profile,
        location: payload.location || targetUser.profile.location,
        bio: payload.bio || targetUser.profile.bio,
        sports:
          payload.sports.length > 0
            ? payload.sports
            : targetUser.profile.sports,
        availability: payload.availability,
      };
      const updatedSession: SessionUser = {
        ...targetUser,
        onboardingCompleted: true,
        profile: updatedProfile,
      };

      try {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "onboarding",
            userId: updatedSession.id,
            email: updatedSession.email,
            ...payload,
          }),
        });
      } catch {
        // Ignore network errors in offline mode
      }

      syncUserToPassport(updatedSession);
      setRegisteredAccounts((prev) =>
        prev.map((acc) =>
          acc.id === updatedSession.id ? updatedSession : acc
        )
      );
      setIsOnboardingOpen(false);
      toast.success(t("toast.onboardingCompleted"));
    },
    [setRegisteredAccounts, syncUserToPassport, t, toast, user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      demoAccounts: registeredAccounts,
      isAuthModalOpen,
      setIsAuthModalOpen,
      isOnboardingOpen,
      setIsOnboardingOpen,
      login,
      register,
      switchDemoAccount,
      logout,
      completeOnboarding,
    }),
    [
      user,
      registeredAccounts,
      isAuthModalOpen,
      isOnboardingOpen,
      login,
      register,
      switchDemoAccount,
      logout,
      completeOnboarding,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
