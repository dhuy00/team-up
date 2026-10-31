"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  EVENT_CAPACITY_CONFIG,
  getSportIcon,
  buildSportSelectOptions,
  buildSkillSelectOptions,
} from "@/constants/explore";
import { DEFAULT_RADAR_CENTER } from "@/constants/radar";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventActivity) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("Soccer");
  const [skill, setSkill] = useState("All Levels");
  const [dateTime, setDateTime] = useState("");
  const [capacity, setCapacity] = useState<number>(EVENT_CAPACITY_CONFIG.DEFAULT);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("Free");
  const [notes, setNotes] = useState("");

  const sportOptions = buildSportSelectOptions(t, { includeAll: false });
  const skillOptions = buildSkillSelectOptions(t);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !venue) return;

    const newActivity: EventActivity = {
      id: Date.now(),
      title,
      sport,
      icon: getSportIcon(sport),
      skill,
      venue,
      address: venue,
      distanceKm: 1.0,
      lat: DEFAULT_RADAR_CENTER.lat,
      lng: DEFAULT_RADAR_CENTER.lng,
      dateTimeStr: dateTime ? new Date(dateTime).toLocaleString() : "This weekend",
      cost: cost || "Free",
      confirmedPlayers: 1,
      maxPlayers: Number(capacity) || 10,
      host: {
        name: "Alex Morgan (You)",
        karma: 98,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      },
      userJoined: true,
      roster: [{ name: "Alex Morgan (You)", role: "Host / Captain", karma: 98 }],
      notes,
    };

    onEventCreated(newActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-canvas rounded-[24px] max-w-lg w-full p-6 sm:p-7 border border-border shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-mute">
              New Activity
            </span>
            <h3 className="text-2xl font-[900] text-ink tracking-tight">
              Host a Game
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-mute hover:text-ink rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-ink mb-1">Activity Title</label>
            <input
              required
              type="text"
              placeholder="e.g., 5v5 Sunset Pickup Basketball"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Sport / Category</label>
              <CustomSelect
                options={sportOptions}
                value={sport}
                onChange={(val) => setSport(val)}
                triggerClassName="py-2.5 px-3 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Skill Requirement</label>
              <CustomSelect
                options={skillOptions}
                value={skill}
                onChange={(val) => setSkill(val)}
                triggerClassName="py-2.5 px-3 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink mb-1">Date & Time</label>
              <input
                required
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink mb-1">Player Capacity</label>
              <input
                required
                type="number"
                min={EVENT_CAPACITY_CONFIG.MIN}
                max={EVENT_CAPACITY_CONFIG.MAX}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Venue / Location Name</label>
            <input
              required
              type="text"
              placeholder="e.g., Central Sports Arena, Court 4"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Cost per Person</label>
            <input
              type="text"
              placeholder="Free or $5 (Court share)"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink mb-1">Host Notes / Equipment</label>
            <textarea
              rows={2}
              placeholder="e.g., Bring dark/light shirts. Cleats allowed on turf."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-canvas-soft border border-border rounded-[12px] text-ink focus:border-ink focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-body font-semibold hover:text-ink transition cursor-pointer text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5 rounded-[24px] text-sm shadow-sm"
            >
              Publish Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
