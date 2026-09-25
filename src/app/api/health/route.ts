import { NextResponse } from "next/server";
import { sql } from "@/lib/db/pg-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sql`SELECT 1 as healthy, now() as timestamp`;
    if (result && result.length > 0) {
      return NextResponse.json(
        {
          status: "ok",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        status: "error",
        message: "Database unreachable",
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("[Health Check Error]:", error?.message || error);
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
      },
      { status: 503 }
    );
  }
}
