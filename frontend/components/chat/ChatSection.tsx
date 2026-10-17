"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Send, Pin } from "lucide-react";
import { ChatChannel } from "@/types/models";
import { initialChatChannels } from "@/lib/mockData";

export const ChatSection: React.FC = () => {
  const [channels, setChannels] = useState<ChatChannel[]>(initialChatChannels);
  const [activeChannelId, setActiveChannelId] = useState<number>(1);
  const [inputText, setInputText] = useState("");

  const activeChannel = channels.find((c) => c.id === activeChannelId) || channels[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "Alex Morgan (You)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces",
      time: "Just now",
      text: inputText.trim(),
    };

    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === activeChannelId) {
          return {
            ...c,
            lastMessage: `You: ${inputText.trim()}`,
            lastTime: "Just now",
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    setInputText("");
  };

  return (
    <section className="bg-canvas rounded-[24px] border border-border overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] shadow-sm transition-colors duration-200">
      
      {/* Channels Sidebar */}
      <div className="md:col-span-4 border-r border-border p-5 space-y-4 flex flex-col bg-canvas-soft/30">
        <div className="flex items-center justify-between">
          <h2 className="font-[900] text-base text-ink tracking-tight">
            Squad Messages
          </h2>
          <span className="text-xs bg-canvas text-ink border border-border px-2.5 py-0.5 rounded-full font-bold">
            {channels.length} Active
          </span>
        </div>

        {/* Channel List */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {channels.map((ch) => {
            const isActive = ch.id === activeChannelId;
            return (
              <div
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`p-3.5 rounded-[16px] cursor-pointer transition border ${
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Conversation Area */}
      <div className="md:col-span-8 flex flex-col h-[620px] bg-canvas">
        
        {/* Conversation Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-[900] text-ink text-base tracking-tight flex items-center gap-1.5">
              <span>{activeChannel.sportIcon}</span>
              <span>{activeChannel.title}</span>
            </h3>
            <p className="text-xs text-mute mt-0.5">{activeChannel.subtitle}</p>
          </div>
        </div>

        {/* Pinned Announcement */}
        {activeChannel.pinnedAnnouncement && (
          <div className="bg-[#fff8d6] dark:bg-[#3d320a] border-b border-[#ebdca2] dark:border-[#57460c] px-5 py-2.5 flex items-center justify-between text-xs text-warning-content dark:text-[#fef08a]">
            <div className="flex items-center space-x-2">
              <Pin className="w-3.5 h-3.5 text-warning-deep shrink-0" />
              <span>
                <strong>Pinned:</strong> {activeChannel.pinnedAnnouncement}
              </span>
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-canvas-soft/20">
          {activeChannel.messages.map((msg) => (
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
                  <span className="text-[10px] text-mute font-mono">{msg.time}</span>
                </div>
                <div className="bg-canvas p-3.5 rounded-[16px] rounded-tl-none border border-border text-xs text-body max-w-md leading-relaxed shadow-xs">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-border flex items-center gap-2 bg-canvas"
        >
          <input
            type="text"
            placeholder="Type a message to the match roster..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-canvas-soft border border-border rounded-[14px] text-xs text-ink placeholder:text-mute focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            className="btn-primary px-4 py-2.5 rounded-[14px] flex items-center justify-center font-bold text-xs shadow-xs"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

      </div>

    </section>
  );
};
