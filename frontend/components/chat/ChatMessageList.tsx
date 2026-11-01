"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, LogOut, Pin, PinOff } from "lucide-react";
import { ChatChannel } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import {
  getChannelPinnedItems,
  isOwnChatMessage,
} from "@/lib/chatUtils";

export { getChannelPinnedItems };

interface ChatMessageListProps {
  channel: ChatChannel;
  onTogglePinMessage?: (messageId: number | string, text: string) => void;
  onLeaveChannel?: () => void;
  leaveLabel?: string;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  channel,
  onTogglePinMessage,
  onLeaveChannel,
  leaveLabel,
}) => {
  const { t } = useTranslation();
  const feedRef = useRef<HTMLDivElement>(null);
  const [isPinsExpanded, setIsPinsExpanded] = useState(false);

  const pinnedList = getChannelPinnedItems(channel);

  const showAllPins = isPinsExpanded && pinnedList.length > 1;
  const visiblePins = showAllPins ? pinnedList : pinnedList.slice(0, 1);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [channel.id, channel.messages.length]);

  return (
    <>
      {/* Conversation Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="font-[900] text-ink text-base tracking-tight flex items-center gap-1.5 truncate">
            <span className="shrink-0">{channel.sportIcon}</span>
            <span className="truncate">{channel.title}</span>
          </h3>
          <p className="text-xs text-mute mt-0.5 truncate">{channel.subtitle}</p>
        </div>
        {onLeaveChannel && (
          <button
            type="button"
            onClick={onLeaveChannel}
            className="px-3.5 py-2 bg-negative/10 hover:bg-negative hover:text-white text-negative border border-negative/30 font-semibold rounded-[24px] text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{leaveLabel || t("chat.leaveSquad")}</span>
          </button>
        )}
      </div>

      {/* Pinned Announcements */}
      {pinnedList.length > 0 && (
        <div
          className={`bg-[#fff8d6] dark:bg-[#3d320a] border-b border-[#ebdca2] dark:border-[#57460c] divide-y divide-[#ebdca2]/60 dark:divide-[#57460c]/60 shrink-0 ${
            showAllPins ? "max-h-28 overflow-y-auto custom-scrollbar" : ""
          }`}
        >
          {visiblePins.map((pinnedItem, idx) => (
            <div
              key={`${pinnedItem.id}-${idx}`}
              className="px-5 py-2 flex items-center justify-between gap-2 text-xs text-warning-content dark:text-[#fef08a]"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Pin className="w-3.5 h-3.5 text-warning-deep shrink-0" />
                <span className="truncate">
                  <strong>{t("chat.pinnedLabel")}</strong> {pinnedItem.text}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onTogglePinMessage && (
                  <button
                    type="button"
                    onClick={() => onTogglePinMessage(pinnedItem.id, pinnedItem.text)}
                    title={t("chat.unpinMessage")}
                    aria-label={t("chat.unpinMessage")}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-warning-deep transition cursor-pointer"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                )}
                {idx === 0 && pinnedList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsPinsExpanded((prev) => !prev)}
                    aria-expanded={showAllPins}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-warning-deep font-bold text-[11px] transition cursor-pointer"
                  >
                    <span>+{pinnedList.length - 1}</span>
                    {showAllPins ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Messages Feed */}
      <div
        ref={feedRef}
        className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 bg-canvas-soft/20"
      >
        {channel.messages.map((msg) => {
          const isPinned = pinnedList.some((item) => item.id === msg.id);
          const isOwnMessage = isOwnChatMessage(msg, t("chat.youPrefix"));

          const pinButton = onTogglePinMessage ? (
            <button
              type="button"
              onClick={() => onTogglePinMessage(msg.id, msg.text)}
              title={isPinned ? t("chat.unpinMessage") : t("chat.pinMessage")}
              aria-label={isPinned ? t("chat.unpinMessage") : t("chat.pinMessage")}
              className={`p-1.5 rounded-full border shrink-0 transition cursor-pointer ${
                isPinned
                  ? "opacity-100 bg-[#fff8d6] dark:bg-[#3d320a] border-[#ebdca2] dark:border-[#57460c] text-warning-deep"
                  : "opacity-0 group-hover:opacity-100 focus:opacity-100 bg-canvas border-border text-mute hover:text-ink"
              }`}
            >
              {isPinned ? (
                <PinOff className="w-3.5 h-3.5" />
              ) : (
                <Pin className="w-3.5 h-3.5" />
              )}
            </button>
          ) : null;

          if (isOwnMessage) {
            return (
              <div
                key={msg.id}
                className="group flex items-start justify-end gap-3"
              >
                <div className="space-y-1 flex flex-col items-end max-w-[82%] sm:max-w-[75%]">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-[10px] text-mute font-mono">
                      {msg.time}
                    </span>
                    {msg.isHost && (
                      <span className="px-2 py-0.2 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-[10px] font-bold">
                        {t("chat.hostBadge")}
                      </span>
                    )}
                    <span className="text-xs font-bold text-ink">
                      {t("chat.youPrefix")}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    {pinButton}
                    <div
                      className={`bg-ink text-canvas p-3.5 rounded-[16px] rounded-tr-none border text-xs text-left max-w-md leading-relaxed shadow-xs transition ${
                        isPinned
                          ? "border-warning-deep ring-2 ring-warning/60"
                          : "border-ink"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
                <div className="relative w-8 h-8 shrink-0">
                  <Image
                    src={msg.avatar}
                    alt={msg.sender}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-ink"
                    unoptimized
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className="group flex items-start justify-start gap-3"
            >
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src={msg.avatar}
                  alt={msg.sender}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-ink"
                  unoptimized
                />
              </div>
              <div className="space-y-1 flex flex-col items-start max-w-[82%] sm:max-w-[75%]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink">{msg.sender}</span>
                  {msg.isHost && (
                    <span className="px-2 py-0.2 bg-primary-pale text-positive-deep border border-primary-neutral rounded-full text-[10px] font-bold">
                      {t("chat.hostBadge")}
                    </span>
                  )}
                  <span className="text-[10px] text-mute font-mono">{msg.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`bg-canvas p-3.5 rounded-[16px] rounded-tl-none border text-xs text-body max-w-md leading-relaxed shadow-xs transition ${
                      isPinned
                        ? "border-warning-deep ring-1 ring-warning/40"
                        : "border-border"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {pinButton}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
