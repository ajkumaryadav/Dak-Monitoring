import { NextResponse, type NextRequest } from "next/server";
import { getPgClient } from "@/lib/db/pg-client";
import { mapNotificationRow } from "@/features/notifications/lib/notification-models";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const since = searchParams.get("since") || new Date(Date.now() - 60000).toISOString();
    const viewAll = searchParams.get("viewAll") === "1";

    if (!userId) {
      return NextResponse.json({ notifications: [], timestamp: new Date().toISOString() });
    }

    const sql = getPgClient();

    let rows: any[] = [];
    if (viewAll) {
      rows = await sql`
        SELECT * FROM public.notifications
        WHERE created_at > ${since}
        ORDER BY created_at ASC
        LIMIT 20
      `;
    } else {
      rows = await sql`
        SELECT * FROM public.notifications
        WHERE user_id = ${userId}
          AND created_at > ${since}
        ORDER BY created_at ASC
        LIMIT 20
      `;
    }

    const notifications = rows.map(mapNotificationRow);
    const timestamp = new Date().toISOString();

    return NextResponse.json({ notifications, timestamp });
  } catch (error: any) {
    return NextResponse.json(
      { notifications: [], timestamp: new Date().toISOString() },
      { status: 200 }
    );
  }
}
