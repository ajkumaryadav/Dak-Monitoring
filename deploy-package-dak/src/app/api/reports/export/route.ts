import { NextResponse } from "next/server";

import {
  fetchReportRowsForExport,
  getReportExportTitle,
  getReportFilenamePrefix,
} from "@/features/reports/services/report-export-data";
import { parseReportFilters } from "@/features/reports/lib/parse-report-filters";
import {
  generateExcelFile,
  generatePdfFile,
} from "@/features/reports/services/report-export.server";
import {
  canExportReportKind,
  type ReportExportKind,
} from "@/lib/auth/report-permissions";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    const reportKind = url.searchParams.get("reportKind") as ReportExportKind | null;

    if (format !== "pdf" && format !== "excel") {
      return NextResponse.json({ error: "Invalid format." }, { status: 400 });
    }

    if (
      !reportKind ||
      !["pending", "overdue", "source", "department", "section"].includes(
        reportKind
      )
    ) {
      return NextResponse.json({ error: "Invalid report type." }, { status: 400 });
    }

    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!canExportReportKind(user.role, reportKind)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const sourceName = url.searchParams.get("name") ?? undefined;
    const filters = parseReportFilters({
      department: url.searchParams.get("department") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      section: url.searchParams.get("section") ?? undefined,
      priority: url.searchParams.get("priority") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      dateFrom: url.searchParams.get("dateFrom") ?? undefined,
      dateTo: url.searchParams.get("dateTo") ?? undefined,
      overdue: url.searchParams.get("overdue") ?? undefined,
    });

    const rows = await fetchReportRowsForExport(
      user,
      reportKind,
      filters,
      sourceName
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "No records found for the current filters." },
        { status: 404 }
      );
    }

    const title = getReportExportTitle(reportKind, sourceName);
    const prefix = getReportFilenamePrefix(reportKind, sourceName);

    const file =
      format === "pdf"
        ? generatePdfFile(rows, prefix, title, user.name)
        : generateExcelFile(rows, prefix, title);

    return new NextResponse(new Uint8Array(file.buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/reports/export]", error);
    return NextResponse.json(
      { error: "Export failed due to an unexpected error." },
      { status: 500 }
    );
  }
}
