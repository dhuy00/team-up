"use client";

import React from "react";
import Image from "next/image";
import { Pin } from "lucide-react";
import { ChatChannel } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatMessageListProps {
  channel: ChatChannel;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  channel,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Conversation Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-[900] text-ink text-base tracking-tight flex items-center gap-1.5">
            <span>{channel.sportIcon}</span>
            <span>{channel.title}</span>
          </h3>
          <p className="text-xs text-mute mt-0.5">{channel.subtitle}</p>
        </div>
      </div>

      {/* Pinned Announcement */}
      {channel.pinnedAnnouncement && (
        <div className="bg-[#fff8d6] dark:bg-[#3d320a] border-b border-[#ebdca2] dark:border-[#57460c] px-5 py-2.5 flex items-center justify-between text-xs text-warning-content dark:text-[#fef08a]">
          <div className="flex items-center space-x-2">
            <Pin className="w-3.5 h-3.5 text-warning-deep shrink-0" />
            <span>
              <strong>{t("chat.pinnedLabel")}</strong> {channel.pinnedAnnouncement}
            </span>
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-canvas-soft/20">
        {channel.messages.map((msg) => (
          <div key={msg.id} className="flex items-start space-x-3">
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
              <div className="bg-canvas p-3.5 rounded-[16px] rounded-tl-none border border-border text-xs text-body max-w-md leading-relaxed shadow-xs">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
