import { createAdminClient } from "@/lib/supabase/admin";

import type {
  DakRequestStatus,
  DakRequestType,
} from "@/features/dak-requests/lib/request-types";

export interface DakRequestRecord {
  id: string;
  dak_id: string;
  request_type: DakRequestType;
  status: DakRequestStatus;
  requested_by: string;
  reviewed_by: string | null;
  remarks: string;
  review_remarks: string | null;
  target_department_id: string | null;
  requested_due_date: string | null;
  created_at: string;
  reviewed_at: string | null;
  requester?: { name: string } | { name: string }[] | null;
  target_department?: { name: string } | { name: string }[] | null;
}

const REQUEST_SELECT = `
  id,
  dak_id,
  request_type,
  status,
  requested_by,
  reviewed_by,
  remarks,
  review_remarks,
  target_department_id,
  requested_due_date,
  created_at,
  reviewed_at,
  requester:users!dak_requests_requested_by_fkey(name),
  target_department:departments(name)
`;

let dakRequestsTableMissingLogged = false;

function isMissingDakRequestsTable(error: {
  message?: string;
  code?: string;
}): boolean {
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("dak_requests") ||
    message.includes("schema cache")
  );
}

function logDakRequestsTableMissing(context: string): void {
  if (dakRequestsTableMissingLogged) return;
  dakRequestsTableMissingLogged = true;
  console.warn(
    `[${context}] dak_requests table is not available. Run supabase/migrations/000031_dak_workflow_requests.sql in the Supabase SQL Editor, then reload the schema (NOTIFY pgrst or Dashboard → Settings → API → Reload).`
  );
}

function logDakRequestError(
  context: string,
  error: { message?: string; code?: string }
): void {
  if (isMissingDakRequestsTable(error)) {
    logDakRequestsTableMissing(context);
    return;
  }
  console.error(`[${context}]`, error.message ?? error);
}

export function isDakRequestsTableMissingError(error: {
  message?: string;
  code?: string;
}): boolean {
  return isMissingDakRequestsTable(error);
}

export async function getDakRequestsForDak(
  dakId: string
): Promise<DakRequestRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_requests")
    .select(REQUEST_SELECT)
    .eq("dak_id", dakId)
    .order("created_at", { ascending: false });

  if (error) {
    logDakRequestError("getDakRequestsForDak", error);
    return [];
  }

  return (data ?? []) as DakRequestRecord[];
}

export async function getPendingDakRequests(
  dakId?: string
): Promise<DakRequestRecord[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("dak_requests")
    .select(REQUEST_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (dakId) {
    query = query.eq("dak_id", dakId);
  }

  const { data, error } = await query;
  if (error) {
    logDakRequestError("getPendingDakRequests", error);
    return [];
  }

  return (data ?? []) as DakRequestRecord[];
}

export async function getDakRequestById(
  requestId: string
): Promise<DakRequestRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_requests")
    .select(REQUEST_SELECT)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    logDakRequestError("getDakRequestById", error);
    return null;
  }

  if (!data) return null;
  return data as DakRequestRecord;
}

export async function hasPendingRequest(
  dakId: string,
  requestType?: DakRequestType
): Promise<boolean> {
  const supabase = createAdminClient();
  let query = supabase
    .from("dak_requests")
    .select("id", { count: "exact", head: true })
    .eq("dak_id", dakId)
    .eq("status", "pending");

  if (requestType) {
    query = query.eq("request_type", requestType);
  }

  const { count, error } = await query;
  if (error) {
    logDakRequestError("hasPendingRequest", error);
    return false;
  }

  return (count ?? 0) > 0;
}
