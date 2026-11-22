import { NextResponse } from "next/server";
import { getDbState } from "@/db/store";
import { ensurePostgresSynced, pgCheckConnection } from "@/db/postgres";

export async function GET() {
  await ensurePostgresSynced(getDbState());
  const status = await pgCheckConnection();
  return NextResponse.json(status, {
    status: status.connected ? 200 : 503,
  });
}
