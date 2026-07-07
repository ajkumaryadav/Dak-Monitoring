import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { DakListTable } from "@/features/dak/components/dak-list-table";
import { DakPageHeader } from "@/features/dak/components/dak-page-header";
import { getFilteredDakList } from "@/features/dak/services/get-dak-stats";
import {
  DAK_REQUEST_TYPE_LABELS,
} from "@/features/dak-requests/lib/request-types";
import { getPendingDakRequests } from "@/features/dak-requests/services/dak-requests";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PendingApprovalPage() {
  await requireRole(["collector", "adm"]);

  const [dakEntries, pendingRequests] = await Promise.all([
    getFilteredDakList("pending_approval"),
    getPendingDakRequests(),
  ]);

  return (
    <div className="space-y-6">
      <DakPageHeader
        title="Pending Approval"
        description="ATR submissions and department requests awaiting Collector/ADM review."
        icon={ShieldCheck}
      />

      {pendingRequests.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold">
            Department Requests ({pendingRequests.length})
          </h2>
          <ul className="space-y-2">
            {pendingRequests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              >
                <div>
                  <Badge variant="outline" className="mr-2">
                    {DAK_REQUEST_TYPE_LABELS[request.request_type]}
                  </Badge>
                  <span className="text-muted-foreground">{request.remarks.slice(0, 80)}</span>
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

      <p className="text-sm text-muted-foreground">
        {dakEntries.length} DAK awaiting closure approval
      </p>
      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background shadow-sm">
        <DakListTable
          entries={dakEntries}
          emptyTitle="No DAK pending approval"
          emptyDescription="Submitted ATR records will appear here for review."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Open a DAK to review ATR, department requests, and approve closure or return for rework.
      </p>
    </div>
  );
}
