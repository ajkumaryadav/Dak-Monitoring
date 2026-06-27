import { NextResponse } from "next/server";

import { runSlaMonitor } from "@/jobs/sla-monitor";

/** Cron/manual endpoint for SLA monitoring — protect with CRON_SECRET in production. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSlaMonitor();

  return NextResponse.json({
    ok: true,
    ...result,
    ranAt: new Date().toISOString(),
  });
}
