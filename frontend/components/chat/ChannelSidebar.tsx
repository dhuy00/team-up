"use client";

import React from "react";
import { Pin, PinOff } from "lucide-react";
import { ChatChannel } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { sortChatChannels } from "@/lib/chatUtils";

interface ChannelSidebarProps {
  channels: ChatChannel[];
  activeChannelId: number;
  onSelectChannel: (channelId: number) => void;
  onTogglePinChannel?: (channelId: number) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onTogglePinChannel,
}) => {
  const { t } = useTranslation();

  const sortedChannels = sortChatChannels(channels);

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
      <div
        className="space-y-2 flex-1 overflow-y-auto custom-scrollbar"
        role="listbox"
        aria-label={t("chat.squadMessages")}
      >
        {sortedChannels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const isPinned = Boolean(ch.isPinned);

          return (
            <div
              key={ch.id}
              role="option"
              tabIndex={0}
              aria-selected={isActive}
              onClick={() => onSelectChannel(ch.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectChannel(ch.id);
                }
              }}
              className={`group w-full text-left p-3.5 rounded-[16px] cursor-pointer transition border ${
                isActive
                  ? "bg-canvas border-ink shadow-xs"
                  : "border-transparent hover:bg-canvas"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 h-5">
                <span className="font-bold text-xs text-ink flex items-center gap-1.5 min-w-0 truncate">
                  <span className="shrink-0">{ch.sportIcon}</span>
                  <span className="truncate">{ch.title}</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0 h-5">
                  <span className="text-[10px] text-mute font-mono leading-none">
                    {ch.lastTime}
                  </span>
                  {onTogglePinChannel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePinChannel(ch.id);
                      }}
                      title={isPinned ? t("chat.unpinChat") : t("chat.pinChat")}
                      aria-label={
                        isPinned ? t("chat.unpinChat") : t("chat.pinChat")
                      }
                      className={`w-5 h-5 inline-flex rounded-full border items-center justify-center transition cursor-pointer ${
                        isPinned
                          ? "bg-[#fff8d6] dark:bg-[#3d320a] border-[#ebdca2] dark:border-[#57460c] text-warning-deep"
                          : "bg-canvas border-border text-mute hover:text-ink"
                      }`}
                    >
                      {isPinned ? (
                        <PinOff className="w-3 h-3" />
                      ) : (
                        <Pin className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-body truncate">{ch.lastMessage}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
