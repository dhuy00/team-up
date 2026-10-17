"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Award, Check, Plus } from "lucide-react";
import { UserProfile, SportPassportItem } from "@/types/models";
import { mockUserProfile } from "@/lib/mockData";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect, CustomSelectOption } from "@/components/ui/CustomSelect";

const TIER_OPTIONS: CustomSelectOption[] = [
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

export const PassportSection: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>(mockUserProfile);
  const [isAddingSport, setIsAddingSport] = useState(false);
  const [newSportName, setNewSportName] = useState("");
  const [newSportRole, setNewSportRole] = useState("");
  const [newSportTier, setNewSportTier] = useState("Intermediate");

  const handleAddSport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSportName) return;

    const newSport: SportPassportItem = {
      id: Date.now(),
      name: newSportName,
      icon: "🏅",
      role: newSportRole || "Player",
      skillTier: newSportTier,
      verifications: "Self-assessed",
    };

    setProfile({
      ...profile,
      sports: [...profile.sports, newSport],
    });

    setNewSportName("");
    setNewSportRole("");
    setIsAddingSport(false);
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Identity & Reliability Karma */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-canvas p-6 rounded-[24px] border border-border text-center shadow-sm transition-colors duration-200">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover border-2 border-ink shadow-sm"
                unoptimized
              />
              <span className="absolute bottom-0 right-0 bg-primary text-ink p-1 rounded-full border border-ink">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>

            <h2 className="text-2xl font-[900] text-ink tracking-tight">
              {profile.name}
            </h2>
            <p className="text-xs text-mute mb-3">
              @{profile.username} &bull; {profile.location}
            </p>

            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-xs font-semibold mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>{t("passport.reliabilityKarma")}: {profile.karma}% ({profile.tier})</span>
            </div>

            <p className="text-xs text-body leading-relaxed">
              &ldquo;{profile.bio}&rdquo;
            </p>

            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-border text-center">
              <div className="p-2.5 bg-canvas-soft rounded-[12px] border border-border">
                <span className="block font-[900] text-ink text-lg">{profile.matchesCount}</span>
                <span className="text-[10px] text-mute uppercase font-semibold">{t("passport.matches")}</span>
              </div>
              <div className="p-2.5 bg-canvas-soft rounded-[12px] border border-border">
                <span className="block font-[900] text-positive-deep text-lg">{profile.noShowsCount}</span>
                <span className="text-[10px] text-mute uppercase font-semibold">{t("passport.noShows")}</span>
              </div>
              <div className="p-2.5 bg-canvas-soft rounded-[12px] border border-border">
                <span className="block font-[900] text-ink text-lg">{profile.endorsedCount}</span>
                <span className="text-[10px] text-mute uppercase font-semibold">{t("passport.endorsed")}</span>
              </div>
            </div>
          </div>

          {/* Peer Badges */}
          <div className="bg-canvas p-6 rounded-[24px] border border-border shadow-sm transition-colors duration-200">
            <h3 className="font-[900] text-xs text-ink uppercase tracking-wider mb-3">
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

        {/* Right: Sports Passport & Skill Matrix */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-canvas p-6 sm:p-7 rounded-[24px] border border-border space-y-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-[900] text-ink tracking-tight">
                  {t("passport.sportsPassportTitle")}
                </h3>
                <p className="text-xs text-mute mt-0.5">
                  {t("passport.sportsPassportSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsAddingSport(!isAddingSport)}
                className="text-xs text-ink font-semibold underline hover:text-mute cursor-pointer"
              >
                {t("passport.addSport")}
              </button>
            </div>

            {/* Optional Add Sport Form */}
            {isAddingSport && (
              <form onSubmit={handleAddSport} className="p-4 bg-canvas-soft rounded-[16px] border border-border space-y-3 text-xs">
                <div className="font-bold text-ink">Add a New Verified Sport</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Sport Name (e.g. Tennis)"
                    value={newSportName}
                    onChange={(e) => setNewSportName(e.target.value)}
                    className="px-3 py-2 bg-canvas border border-border rounded-[10px] text-ink focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Preferred Role / Style"
                    value={newSportRole}
                    onChange={(e) => setNewSportRole(e.target.value)}
                    className="px-3 py-2 bg-canvas border border-border rounded-[10px] text-ink focus:outline-none"
                  />
                  <CustomSelect
                    options={TIER_OPTIONS}
                    value={newSportTier}
                    onChange={(val) => setNewSportTier(val)}
                    triggerClassName="py-2 px-3 text-xs bg-canvas rounded-[10px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingSport(false)}
                    className="px-3 py-1.5 text-body font-semibold hover:text-ink cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-4 py-1.5 font-bold rounded-[16px] text-xs shadow-xs"
                  >
                    Save Sport
                  </button>
                </div>
              </form>
            )}

            {/* Activity Rows */}
            <div className="space-y-3">
              {profile.sports.map((sport) => (
                <div
                  key={sport.id}
                  className="p-4 rounded-[16px] bg-canvas-soft border border-border flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-[12px] bg-canvas text-ink flex items-center justify-center text-xl border border-ink shadow-xs">
                      {sport.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink">{sport.name}</h4>
                      <p className="text-xs text-mute">{sport.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-ink text-canvas text-xs font-bold rounded-full">
                      {sport.skillTier}
                    </span>
                    <span className="block text-[10px] text-mute mt-1 font-mono">
                      {sport.verifications}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Availability Calendar Matrix */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-xs font-[900] text-ink uppercase tracking-wider mb-3">
                {t("passport.availabilityTitle")}
              </h4>
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {profile.availability.map((item, idx) => {
                  let styleClass = "bg-canvas-soft text-mute font-medium border border-border";
                  if (item.statusType === "preferred") {
                    styleClass = "bg-primary-pale text-positive-deep font-semibold border border-primary-neutral";
                  } else if (item.statusType === "primary") {
                    styleClass = "bg-primary text-ink font-bold border border-ink";
                  }

                  return (
                    <div key={idx} className={`p-2.5 rounded-[12px] ${styleClass}`}>
                      <div>{item.day}</div>
                      <span className="text-[10px] block mt-0.5">{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
