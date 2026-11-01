"use client";

import React from "react";
import { ChatChannel } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface ChannelSidebarProps {
  channels: ChatChannel[];
  activeChannelId: number;
  onSelectChannel: (channelId: number) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
}) => {
  const { t } = useTranslation();

  return (
    <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-border p-4 md:p-5 space-y-3 md:space-y-4 flex flex-col max-h-[220px] md:max-h-none md:h-full overflow-hidden bg-canvas-soft/30">
      <div className="flex items-center justify-between">
        <h2 className="font-[900] text-base text-ink tracking-tight">
          {t("chat.squadMessages")}
        </h2>
        <span className="text-xs bg-canvas text-ink border border-border px-2.5 py-0.5 rounded-full font-bold">
          {t("chat.activeCount", { count: channels.length })}
        </span>
      </div>

      {/* Channel List */}
      <div className="space-y-2 flex-1 overflow-y-auto" role="listbox" aria-label={t("chat.squadMessages")}>
        {channels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          return (
            <button
              key={ch.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelectChannel(ch.id)}
              className={`w-full text-left p-3.5 rounded-[16px] cursor-pointer transition border ${
                isActive
                  ? "bg-canvas border-ink shadow-xs"
                  : "border-transparent hover:bg-canvas"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-ink flex items-center gap-1.5 truncate">
                  <span>{ch.sportIcon}</span>
                  <span className="truncate">{ch.title}</span>
                </span>
                <span className="text-[10px] text-mute font-mono shrink-0 ml-2">
                  {ch.lastTime}
                </span>
              </div>
              <p className="text-xs text-body truncate">{ch.lastMessage}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
