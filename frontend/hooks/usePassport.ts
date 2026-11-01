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

export function usePassport() {
  const { t } = useTranslation();
  const toast = useToast();
  const [profile, setProfile] = usePersistentState<UserProfile>(
    PASSPORT_STORAGE_KEY,
    mockUserProfile
  );

  const updateBio = useCallback(
    (nextBio: string) => {
      setProfile((prev) => ({
        ...prev,
        bio: nextBio,
      }));
      toast.success(t("toast.bioSaved"));
    },
    [setProfile, t, toast]
  );

  const addSport = useCallback(
    (newSport: SportPassportItem) => {
      setProfile((prev) => appendSportToProfile(prev, newSport));
      toast.success(t("toast.sportAdded", { sport: newSport.name }));
    },
    [setProfile, t, toast]
  );

  const removeSport = useCallback(
    (sportId: number) => {
      setProfile((prev) => removeSportFromProfile(prev, sportId));
      toast.info(t("toast.sportRemoved"));
    },
    [setProfile, t, toast]
  );

  const toggleDayStatus = useCallback(
    (dayIndex: number) => {
      setProfile((prev) => ({
        ...prev,
        availability: computeNextAvailability(prev.availability, dayIndex, {
          busy: t("passport.statusBusy"),
          preferred: t("passport.statusPreferred"),
          primary: t("passport.statusPrimary"),
        }),
      }));
    },
    [setProfile, t]
  );

  return {
    profile,
    updateBio,
    addSport,
    removeSport,
    toggleDayStatus,
  };
}
