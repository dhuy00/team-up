"use client";

import React, { useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface ChatComposerProps {
  onSendMessage: (text: string, options?: { isUrgentBroadcast?: boolean }) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
}) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState("");
  const [isUrgentBroadcast, setIsUrgentBroadcast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, { isUrgentBroadcast });
    setInputText("");
    setIsUrgentBroadcast(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-border flex items-center gap-2 bg-canvas shrink-0"
    >
      <button
        type="button"
        onClick={() => setIsUrgentBroadcast((prev) => !prev)}
        title={t("chat.urgentBroadcastBtn")}
        aria-label={t("chat.urgentBroadcastBtn")}
        aria-pressed={isUrgentBroadcast}
        className={`p-2.5 rounded-[14px] border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
          isUrgentBroadcast
            ? "bg-[#fff8d6] dark:bg-[#3d320a] border-warning-deep text-warning-deep shadow-2xs"
            : "bg-canvas-soft border-border text-mute hover:text-ink"
        }`}
      >
        <Megaphone className="w-4 h-4" />
        <span className="hidden sm:inline">{t("chat.urgentBroadcastBtn")}</span>
      </button>
      <input
        type="text"
        placeholder={t("chat.inputPlaceholder")}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="flex-1 px-4 py-2.5 bg-canvas-soft border border-border rounded-[14px] text-xs text-ink placeholder:text-mute focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t("common.confirm")}
        className="btn-primary px-4 py-2.5 rounded-[14px] flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer"
      >
        <Send className="w-4 h-4 stroke-[2.5]" />
      </button>
    </form>
  );
};
