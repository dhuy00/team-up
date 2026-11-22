import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import {
  ensurePostgresSynced,
  pgDeleteChatChannel,
  pgUpsertChatChannel,
} from "@/db/postgres";
import type { ChatChannel } from "@/types/models";
import { enforceApiRateLimit } from "@/lib/apiSecurity";

export async function GET(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "chats:get", {
    windowMs: 60_000,
    maxRequests: 120,
  });
  if (rateLimitRes) return rateLimitRes;

  const db = await ensurePostgresSynced(getDbState());
  return NextResponse.json({ channels: db.chatChannels });
}

export async function POST(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "chats:write", {
    windowMs: 60_000,
    maxRequests: 60,
  });
  if (rateLimitRes) return rateLimitRes;

  try {
    const db = await ensurePostgresSynced(getDbState());
    const body = await req.json();

    if (body.action === "send_message" && body.channelId && body.message) {
      const text = String(body.message.text || "").trim().slice(0, 1000);
      if (!text) {
        return NextResponse.json(
          { error: "Message text cannot be empty" },
          { status: 400 }
        );
      }
      let updatedChannel: ChatChannel | undefined;
      db.chatChannels = db.chatChannels.map((c) => {
        if (c.id !== body.channelId) return c;
        updatedChannel = {
          ...c,
          lastMessage: body.lastMessage || text,
          lastTime: body.message.time || "Just now",
          messages: [...c.messages, { ...body.message, text }],
        };
        return updatedChannel;
      });
      if (updatedChannel) {
        await pgUpsertChatChannel(updatedChannel).catch(() => {});
      }
      return NextResponse.json({ channels: db.chatChannels });
    }

    const newChannel = body as ChatChannel;
    if (!newChannel || typeof newChannel.id !== "number" || !newChannel.title) {
      return NextResponse.json(
        { error: "Invalid chat channel payload" },
        { status: 400 }
      );
    }
    if (!db.chatChannels.some((c) => c.id === newChannel.id)) {
      db.chatChannels = [newChannel, ...db.chatChannels];
    } else {
      db.chatChannels = db.chatChannels.map((c) =>
        c.id === newChannel.id ? newChannel : c
      );
    }
    await pgUpsertChatChannel(newChannel).catch(() => {});
    return NextResponse.json(
      { channel: newChannel, channels: db.chatChannels },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid chat payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimitRes = enforceApiRateLimit(req, "chats:write", {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (rateLimitRes) return rateLimitRes;

  const db = await ensurePostgresSynced(getDbState());
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  db.chatChannels = db.chatChannels.filter((c) => c.id !== id);
  if (Number.isFinite(id)) {
    await pgDeleteChatChannel(id).catch(() => {});
  }
  return NextResponse.json({ channels: db.chatChannels });
}
