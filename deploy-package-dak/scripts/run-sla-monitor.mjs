import "dotenv/config";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3050";
const cronSecret = process.env.CRON_SECRET;

const headers = cronSecret
  ? { Authorization: `Bearer ${cronSecret}` }
  : undefined;

const response = await fetch(`${baseUrl}/api/jobs/sla-monitor`, { headers });
const body = await response.json();

if (!response.ok) {
  console.error("[sla:monitor] failed:", body);
  process.exit(1);
}

console.log("[sla:monitor] completed:", body);
