import { NextResponse, type NextRequest } from "next/server";
import { getPgClient } from "@/lib/db/pg-client";
import { mapNotificationRow } from "@/features/notifications/lib/notification-models";
import { getSessionUser } from "@/lib/session";
import { logSafeError } from "@/lib/security/errors";

export async function GET(request: NextRequest) {
  try {
    // 1. Enforce Server-Side Authentication
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const rawSince = searchParams.get("since");
    const viewAllRequested = searchParams.get("viewAll") === "1" || searchParams.get("viewAll") === "true";

    // 2. Validate and bound the `since` timestamp (max 90 days ago)
    let sinceDate = new Date(Date.now() - 60000); // default 1 min ago
    if (rawSince && typeof rawSince === "string") {
      const parsedDate = new Date(rawSince);
      if (!Number.isNaN(parsedDate.getTime())) {
        const minDate = new Date(Date.now() - 90 * 24 * 3600 * 1000);
        sinceDate = parsedDate < minDate ? minDate : parsedDate;
      }
    }
    const since = sinceDate.toISOString();

    const isPrivilegedAdmin =
      sessionUser.role === "collector" ||
      sessionUser.role === "adm" ||
      sessionUser.roleSlug === "acp";

    // 3. Enforce Vertical Authorization for `viewAll`
    if (viewAllRequested && !isPrivilegedAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view all notifications." },
        { status: 403 }
      );
    }

    // 4. Enforce User Identity Isolation (User A cannot request User B's notifications)
    if (requestedUserId && requestedUserId !== sessionUser.id && !isPrivilegedAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Access to another user's notifications is denied." },
        { status: 403 }
      );
    }

    const effectiveUserId =
      isPrivilegedAdmin && requestedUserId ? requestedUserId : sessionUser.id;

    const sql = getPgClient();

    let rows: any[] = [];
    if (viewAllRequested && isPrivilegedAdmin) {
      rows = await sql`
        SELECT * FROM public.notifications
        WHERE created_at > ${since}
        ORDER BY created_at ASC
        LIMIT 50
      `;
    } else {
      rows = await sql`
        SELECT * FROM public.notifications
        WHERE user_id = ${effectiveUserId}
          AND created_at > ${since}
        ORDER BY created_at ASC
        LIMIT 50
      `;
    }

    const notifications = rows.map(mapNotificationRow);
    const timestamp = new Date().toISOString();

    return NextResponse.json({ notifications, timestamp }, { status: 200 });
  } catch (error: unknown) {
    logSafeError("GET /api/notifications/poll", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching notifications." },
      { status: 500 }
    );
  }
}
