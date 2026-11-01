"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Award, Check, Pencil } from "lucide-react";
import { UserProfile } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface KarmaIdentityCardProps {
  profile: UserProfile;
  onUpdateBio: (nextBio: string) => void;
}

export const KarmaIdentityCard: React.FC<KarmaIdentityCardProps> = ({
  profile,
  onUpdateBio,
}) => {
  const { t } = useTranslation();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState(profile.bio);

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftBio.trim()) {
      onUpdateBio(draftBio.trim());
    }
    setIsEditingBio(false);
  };

  return (
    <div className="lg:col-span-4 flex flex-col gap-5">
      <div className="bg-canvas p-5 rounded-[24px] border border-border text-center shadow-sm transition-colors duration-200 flex-1 flex flex-col justify-between">
        <div>
          <div className="relative w-20 h-20 mx-auto mb-2.5">
            <Image
              src={profile.avatar}
              alt={profile.name}
              width={80}
              height={80}
              className="w-full h-full rounded-full object-cover border-2 border-ink shadow-sm"
              unoptimized
            />
            <span className="absolute bottom-0 right-0 bg-primary text-ink p-1 rounded-full border border-ink">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          </div>

          <h2 className="text-xl font-[900] text-ink tracking-tight">
            {profile.name}
          </h2>
          <p className="text-xs text-mute mb-2.5">
            @{profile.username} &bull; {profile.location}
          </p>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-xs font-semibold mb-2.5">
            <Award className="w-3.5 h-3.5" />
            <span>
              {t("passport.reliabilityKarma")}: {profile.karma}% ({profile.tier})
            </span>
          </div>

          {isEditingBio ? (
            <form onSubmit={handleSaveBio} className="space-y-2 text-left mt-1">
              <textarea
                rows={2}
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                className="w-full px-3 py-2 bg-canvas-soft border border-border rounded-[12px] text-xs text-ink focus:border-ink focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftBio(profile.bio);
                    setIsEditingBio(false);
                  }}
                  className="px-3 py-1 text-xs text-mute hover:text-ink font-semibold cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary px-3.5 py-1 rounded-[14px] text-xs font-bold cursor-pointer"
                >
                  {t("passport.saveBio")}
                </button>
              </div>
            </form>
          ) : (
            <div className="group relative">
              <p className="text-xs text-body leading-relaxed">
                &ldquo;{profile.bio}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => {
                  setDraftBio(profile.bio);
                  setIsEditingBio(true);
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-mute hover:text-ink font-semibold cursor-pointer transition"
              >
                <Pencil className="w-3 h-3" />
                <span>{t("passport.editBio")}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border text-center">
          <div className="p-2 bg-canvas-soft rounded-[12px] border border-border">
            <span className="block font-[900] text-ink text-base leading-tight">
              {profile.matchesCount}
            </span>
            <span className="text-[10px] text-mute uppercase font-semibold">
              {t("passport.matches")}
            </span>
          </div>
          <div className="p-2 bg-canvas-soft rounded-[12px] border border-border">
            <span className="block font-[900] text-positive-deep text-base leading-tight">
              {profile.noShowsCount}
            </span>
            <span className="text-[10px] text-mute uppercase font-semibold">
              {t("passport.noShows")}
            </span>
          </div>
          <div className="p-2 bg-canvas-soft rounded-[12px] border border-border">
            <span className="block font-[900] text-ink text-base leading-tight">
              {profile.endorsedCount}
            </span>
            <span className="text-[10px] text-mute uppercase font-semibold">
              {t("passport.endorsed")}
            </span>
          </div>
        </div>
      </div>

      {/* Peer Badges */}
      <div className="bg-canvas p-5 rounded-[24px] border border-border shadow-sm transition-colors duration-200 shrink-0">
        <h3 className="font-[900] text-xs text-ink uppercase tracking-wider mb-2.5">
          {t("passport.fairPlayBadges")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {profile.badges.map((b, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-canvas-soft text-ink text-xs font-semibold rounded-full border border-border"
            >
              {b.label} ({b.count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
