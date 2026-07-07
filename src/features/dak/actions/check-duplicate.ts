"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStatusLabel, normalizeDakStatus } from "@/features/dak/lib/workflow";
import { formatDakDate } from "@/features/dak/lib/dak-display";

export interface PriorApplicationRow {
  id: string;
  dak_number: string;
  subject: string;
  status: string;
  received_date: string | null;
  formattedDate: string;
}

/** Find prior DAK registrations for the same applicant mobile. */
export async function checkDuplicateApplications(
  mobile: string
): Promise<PriorApplicationRow[]> {
  const normalized = mobile.replace(/\D/g, "").slice(-10);
  if (normalized.length !== 10) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .select("id, dak_number, subject, status, received_date")
    .eq("applicant_mobile", normalized)
    .order("received_date", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    dak_number: row.dak_number as string,
    subject: row.subject as string,
    status: getStatusLabel(normalizeDakStatus(row.status as string)),
    received_date: row.received_date as string | null,
    formattedDate: formatDakDate(row.received_date as string | null),
  }));
}
