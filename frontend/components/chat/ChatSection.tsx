"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChatChannel, EventActivity } from "@/types/models";
import { useTranslation } from "@/hooks/useTranslation";
import { useChats } from "@/hooks/useChats";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ChannelSidebar } from "./ChannelSidebar";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";

interface ChatSectionProps {
  focusedEvent?: EventActivity | null;
  focusedChannelId?: number | null;
  focusedEventId?: number | null;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  focusedEvent,
  focusedChannelId,
  focusedEventId,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryChannelId = searchParams?.get("channelId")
    ? Number(searchParams.get("channelId"))
    : null;
  const queryEventId = searchParams?.get("eventId")
    ? Number(searchParams.get("eventId"))
    : null;

  const {
    channels,
    activeChannel,
    setActiveChannelId,
    sendMessage,
    togglePinMessage,
    togglePinChannel,
    getChannelKind,
    leaveChannel,
  } = useChats({
    focusedEvent,
    focusedChannelId: focusedChannelId ?? queryChannelId,
    focusedEventId: focusedEventId ?? queryEventId,
  });

  const [channelPendingLeave, setChannelPendingLeave] =
    useState<ChatChannel | null>(null);

  const handleSelectChannel = (channelId: number) => {
    setActiveChannelId(channelId);
    if (pathname?.startsWith("/chats")) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("channelId", String(channelId));
      params.delete("eventId");
      router.replace(`/chats?${params.toString()}`, { scroll: false });
    }
  };

  const getLeaveCopy = (channel?: ChatChannel | null) => {
    const kind = getChannelKind(channel);
    const name = channel?.title || "";
    if (kind === "squad") {
      return {
        buttonLabel: t("chat.leaveSquad"),
        dialogTitle: t("chat.leaveSquadConfirmTitle"),
        dialogMessage: t("chat.leaveSquadConfirmMessage", { name }),
      };
    }
    if (kind === "direct") {
      return {
        buttonLabel: t("chat.leaveChat"),
        dialogTitle: t("chat.leaveChatConfirmTitle"),
        dialogMessage: t("chat.leaveChatConfirmMessage", { name }),
      };
    }
    return {
      buttonLabel: t("chat.leaveMatch"),
      dialogTitle: t("chat.leaveMatchConfirmTitle"),
      dialogMessage: t("chat.leaveMatchConfirmMessage", { name }),
    };
  };

  const handleConfirmLeaveChannel = () => {
    if (!channelPendingLeave) return;
    leaveChannel(channelPendingLeave);
    setChannelPendingLeave(null);
  };

  const activeLeaveCopy = getLeaveCopy(activeChannel);
  const pendingLeaveCopy = getLeaveCopy(channelPendingLeave);

  return (
    <>
      <section className="bg-canvas rounded-[24px] border border-border overflow-hidden grid grid-cols-1 md:grid-cols-12 md:h-[calc(100vh-140px)] md:min-h-[480px] md:max-h-[680px] shadow-sm transition-colors duration-200">
        <ChannelSidebar
          channels={channels}
          activeChannelId={activeChannel?.id ?? -1}
          onSelectChannel={handleSelectChannel}
          onTogglePinChannel={togglePinChannel}
        />

        <div className="md:col-span-8 flex flex-col h-[calc(100vh-260px)] min-h-[420px] md:h-full md:min-h-0 bg-canvas overflow-hidden">
          {activeChannel ? (
            <>
              <ChatMessageList
                channel={activeChannel}
                onTogglePinMessage={togglePinMessage}
                onLeaveChannel={() => setChannelPendingLeave(activeChannel)}
                leaveLabel={activeLeaveCopy.buttonLabel}
              />
              <ChatComposer onSendMessage={sendMessage} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h3 className="font-[900] text-lg text-ink tracking-tight">
                {t("chat.noActiveChats")}
              </h3>
              <p className="text-xs sm:text-sm text-mute mt-1 max-w-sm">
                {t("chat.noActiveChatsDesc")}
              </p>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(channelPendingLeave)}
        title={pendingLeaveCopy.dialogTitle}
        message={pendingLeaveCopy.dialogMessage}
        confirmLabel={pendingLeaveCopy.buttonLabel}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmLeaveChannel}
        onCancel={() => setChannelPendingLeave(null)}
      />
    </>
  );
};
