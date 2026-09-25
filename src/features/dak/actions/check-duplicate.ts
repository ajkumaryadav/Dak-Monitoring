"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isOperatorDashboardRole } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/session";
import { getStatusLabel, normalizeDakStatus } from "@/features/dak/lib/workflow";
import { formatDakDate } from "@/features/dak/lib/dak-display";
import { logSafeError } from "@/lib/security/errors";

export interface PriorApplicationRow {
  id: string;
  dak_number: string;
  subject: string;
  status: string;
  received_date: string | null;
  formattedDate: string;
}

/** Find prior DAK registrations for the same applicant mobile. Requires authenticated user. */
export async function checkDuplicateApplications(
  mobile: string
): Promise<PriorApplicationRow[]> {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    if (!mobile || typeof mobile !== "string") return [];
    const normalized = mobile.replace(/\D/g, "").slice(-10);
    if (normalized.length !== 10) return [];

    const supabase = createAdminClient();

    let query = supabase
      .from("dak_entries")
      .select("id, dak_number, subject, status, received_date")
      .eq("applicant_mobile", normalized)
      .order("received_date", { ascending: false })
      .limit(20);

    if (isOperatorDashboardRole(user.role)) {
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id as string,
      dak_number: row.dak_number as string,
      subject: row.subject as string,
      status: getStatusLabel(normalizeDakStatus(row.status as string)),
      received_date: row.received_date as string | null,
      formattedDate: formatDakDate(row.received_date as string | null),
    }));
  } catch (err: unknown) {
    logSafeError("checkDuplicateApplications", err);
    return [];
  }
}
