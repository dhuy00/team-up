"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, Pin, PinOff } from "lucide-react";
import { ChatChannel } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatMessageListProps {
  channel: ChatChannel;
  onTogglePinMessage?: (text: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  channel,
  onTogglePinMessage,
}) => {
  const { t } = useTranslation();
  const feedRef = useRef<HTMLDivElement>(null);
  const [isPinsExpanded, setIsPinsExpanded] = useState(false);

  const pinnedList =
    channel.pinnedMessages ??
    (channel.pinnedAnnouncement ? [channel.pinnedAnnouncement] : []);

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
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-[900] text-ink text-base tracking-tight flex items-center gap-1.5">
            <span>{channel.sportIcon}</span>
            <span>{channel.title}</span>
          </h3>
          <p className="text-xs text-mute mt-0.5">{channel.subtitle}</p>
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedList.length > 0 && (
        <div
          className={`bg-[#fff8d6] dark:bg-[#3d320a] border-b border-[#ebdca2] dark:border-[#57460c] divide-y divide-[#ebdca2]/60 dark:divide-[#57460c]/60 shrink-0 ${
            showAllPins ? "max-h-28 overflow-y-auto" : ""
          }`}
        >
          {visiblePins.map((pinnedText, idx) => (
            <div
              key={`${pinnedText}-${idx}`}
              className="px-5 py-2 flex items-center justify-between gap-2 text-xs text-warning-content dark:text-[#fef08a]"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Pin className="w-3.5 h-3.5 text-warning-deep shrink-0" />
                <span className="truncate">
                  <strong>{t("chat.pinnedLabel")}</strong> {pinnedText}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onTogglePinMessage && (
                  <button
                    type="button"
                    onClick={() => onTogglePinMessage(pinnedText)}
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
        className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4 bg-canvas-soft/20"
      >
        {channel.messages.map((msg) => {
          const isPinned = pinnedList.includes(msg.text);
          return (
            <div key={msg.id} className="group flex items-start space-x-3">
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
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
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
                  {onTogglePinMessage && (
                    <button
                      type="button"
                      onClick={() => onTogglePinMessage(msg.text)}
                      title={isPinned ? t("chat.unpinMessage") : t("chat.pinMessage")}
                      aria-label={isPinned ? t("chat.unpinMessage") : t("chat.pinMessage")}
                      className={`p-1.5 rounded-full border transition cursor-pointer ${
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
