import { NextRequest, NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import type { ChatChannel } from "@/types/models";

export async function GET() {
  const db = getDbState();
  return NextResponse.json({ channels: db.chatChannels });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDbState();

    if (body.action === "send_message" && body.channelId && body.message) {
      db.chatChannels = db.chatChannels.map((c) => {
        if (c.id !== body.channelId) return c;
        return {
          ...c,
          lastMessage: body.lastMessage || body.message.text,
          lastTime: body.message.time || "Just now",
          messages: [...c.messages, body.message],
        };
      });
      return NextResponse.json({ channels: db.chatChannels });
    }

    const newChannel = body as ChatChannel;
    if (!db.chatChannels.some((c) => c.id === newChannel.id)) {
      db.chatChannels = [newChannel, ...db.chatChannels];
    }
    return NextResponse.json(
      { channel: newChannel, channels: db.chatChannels },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));
  const db = getDbState();
  db.chatChannels = db.chatChannels.filter((c) => c.id !== id);
  return NextResponse.json({ channels: db.chatChannels });
}
