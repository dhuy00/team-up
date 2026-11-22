"use client";

import { useCallback } from "react";
import type { SportPassportItem, UserProfile } from "@/types/models";
import { mockUserProfile } from "@/lib/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/context/ToastContext";
import {
  PASSPORT_STORAGE_KEY,
  appendSportToProfile,
  computeNextAvailability,
  removeSportFromProfile,
} from "@/services/passport";
import { endorseSportOnProfile } from "@/lib/karma";

export function usePassport() {
  const { t } = useTranslation();
  const toast = useToast();
  const [profile, setProfile] = usePersistentState<UserProfile>(
    PASSPORT_STORAGE_KEY,
    mockUserProfile
  );

  const syncProfileToServer = useCallback((nextProfile: UserProfile) => {
    fetch("/api/passport", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextProfile),
    }).catch(() => {});
  }, []);

  const updateBio = useCallback(
    (nextBio: string) => {
      setProfile((prev) => {
        const next = {
          ...prev,
          bio: nextBio,
        };
        syncProfileToServer(next);
        return next;
      });
      toast.success(t("toast.bioSaved"));
    },
    [setProfile, syncProfileToServer, t, toast]
  );

  const addSport = useCallback(
    (newSport: SportPassportItem) => {
      setProfile((prev) => {
        const next = appendSportToProfile(prev, newSport);
        syncProfileToServer(next);
        return next;
      });
      toast.success(t("toast.sportAdded", { sport: newSport.name }));
    },
    [setProfile, syncProfileToServer, t, toast]
  );

  const removeSport = useCallback(
    (sportId: number) => {
      setProfile((prev) => {
        const next = removeSportFromProfile(prev, sportId);
        syncProfileToServer(next);
        return next;
      });
      toast.info(t("toast.sportRemoved"));
    },
    [setProfile, syncProfileToServer, t, toast]
  );

  const endorseSport = useCallback(
    (sportId: number) => {
      setProfile((prev) => {
        const next = endorseSportOnProfile(prev, sportId);
        syncProfileToServer(next);
        return next;
      });
      toast.success(t("toast.skillEndorsed"));
    },
    [setProfile, syncProfileToServer, t, toast]
  );

  const toggleDayStatus = useCallback(
    (dayIndex: number) => {
      setProfile((prev) => {
        const next = {
          ...prev,
          availability: computeNextAvailability(prev.availability, dayIndex, {
            busy: t("passport.statusBusy"),
            preferred: t("passport.statusPreferred"),
            primary: t("passport.statusPrimary"),
          }),
        };
        syncProfileToServer(next);
        return next;
      });
    },
    [setProfile, syncProfileToServer, t]
  );

  return {
    profile,
    updateBio,
    addSport,
    removeSport,
    endorseSport,
    toggleDayStatus,
  };
}
