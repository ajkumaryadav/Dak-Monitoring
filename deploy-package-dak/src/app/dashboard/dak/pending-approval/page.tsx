import Link from "next/link";
import { RotateCcw, ShieldCheck } from "lucide-react";

import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import { getDaksAwaitingRework } from "@/features/dak/services/get-daks-awaiting-rework";
import {
  DAK_REQUEST_BADGE_STYLES,
  DAK_REQUEST_PENDING_LABELS,
  DAK_REQUEST_TYPE_LABELS,
} from "@/features/dak-requests/lib/request-types";
import { getPendingDakRequests } from "@/features/dak-requests/services/dak-requests";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REWORK_STATUS_OVERRIDE = {
  label: "Waiting for Revised Compliance",
  className:
    "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300 capitalize",
};

export default async function PendingApprovalPage() {
  await requireRole(["collector", "adm"]);

  const [dakEntries, pendingRequests, reworkEntries] = await Promise.all([
    getFilteredDakList("pending_approval"),
    getPendingDakRequests(),
    getDaksAwaitingRework(),
  ]);

  const reworkStatusOverrides = Object.fromEntries(
    reworkEntries.map((entry) => [entry.id, REWORK_STATUS_OVERRIDE])
  );

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Collector Review Queue"
        description="Compliance awaiting approval, requests requiring decision, and DAKs returned for rework."
        icon={ShieldCheck}
      />

      {pendingRequests.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/[0.03] p-5">
          <h2 className="text-sm font-semibold">
            Pending Requests ({pendingRequests.length})
          </h2>
          <ul className="space-y-2">
            {pendingRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(DAK_REQUEST_BADGE_STYLES[request.request_type])}
                  >
                    {DAK_REQUEST_PENDING_LABELS[request.request_type]}
                  </Badge>
                  <span className="text-muted-foreground">
                    {request.remarks.slice(0, 100)}
                    {request.remarks.length > 100 ? "…" : ""}
                  </span>
                </div>
                <Link
                  href={`/dashboard/dak/${request.dak_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  Review DAK
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reworkEntries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="size-4 text-red-600" />
            <h2 className="text-sm font-semibold">
              Returned for Rework — Waiting for Revised Compliance ({reworkEntries.length})
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-red-500/25 bg-red-500/[0.03] shadow-sm">
            <DakListTable
              entries={reworkEntries}
              statusOverrides={reworkStatusOverrides}
              emptyTitle="No DAK awaiting rework"
              emptyDescription="Returned DAKs will appear here until the department resubmits."
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Awaiting Closure Approval ({dakEntries.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
          <DakListTable
            entries={dakEntries}
            emptyTitle="No DAK pending approval"
            emptyDescription="Submitted compliance will appear here for review."
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Open a DAK to review compliance, act on pending requests, approve closure, or return for rework.
      </p>
    </div>
  );
}
