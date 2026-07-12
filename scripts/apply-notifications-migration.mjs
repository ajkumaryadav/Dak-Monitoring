/**
 * Apply migration 000011_notifications.sql using a direct Postgres connection.
 *
 * Add to .env.local:
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@...
 *
 * Then run: npm run db:apply-notifications
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL in .env.local.\n\n" +
      "Option A — add DATABASE_URL from Supabase → Settings → Database → Connection string (URI), then re-run.\n\n" +
      "Option B — paste this file into Supabase SQL Editor and run it:\n" +
      "  supabase/migrations/000013_notifications_setup_complete.sql\n"
  );
  process.exit(1);
}

const sqlPath = resolve(
  process.cwd(),
  "supabase/migrations/000011_notifications.sql"
);
const migrationSql = readFileSync(sqlPath, "utf8");

const db = postgres(databaseUrl, { max: 1 });

try {
const completePath = resolve(
  process.cwd(),
  "supabase/migrations/000013_notifications_setup_complete.sql"
);

if (existsSync(completePath)) {
  console.log("Applying 000013_notifications_setup_complete.sql...");
  await db.unsafe(readFileSync(completePath, "utf8"));
} else {
  console.log("Applying 000011_notifications.sql...");
  await db.unsafe(migrationSql);

  const fixPath = resolve(
    process.cwd(),
    "supabase/migrations/000012_notification_type_enum_fix.sql"
  );
  if (existsSync(fixPath)) {
    console.log("Applying 000012_notification_type_enum_fix.sql...");
    await db.unsafe(readFileSync(fixPath, "utf8"));
  }
}

  console.log("Done. notifications table is ready — refresh your app.");

  const dakCreatedPath = resolve(
    process.cwd(),
    "supabase/migrations/000014_notification_dak_created.sql"
  );
  if (existsSync(dakCreatedPath)) {
    console.log("Applying 000014_notification_dak_created.sql...");
    await db.unsafe(readFileSync(dakCreatedPath, "utf8"));
  }

  const typeTextPath = resolve(
    process.cwd(),
    "supabase/migrations/000015_notifications_type_text.sql"
  );
  if (existsSync(typeTextPath)) {
    console.log("Applying 000015_notifications_type_text.sql...");
    await db.unsafe(readFileSync(typeTextPath, "utf8"));
  }

  const messagePath = resolve(
    process.cwd(),
    "supabase/migrations/000016_notifications_message_column.sql"
  );
  if (existsSync(messagePath)) {
    console.log("Applying 000016_notifications_message_column.sql...");
    await db.unsafe(readFileSync(messagePath, "utf8"));
  }

  const realtimePath = resolve(
    process.cwd(),
    "supabase/migrations/000023_notifications_realtime.sql"
  );
  if (existsSync(realtimePath)) {
    console.log("Applying 000023_notifications_realtime.sql...");
    await db.unsafe(readFileSync(realtimePath, "utf8"));
  }

  const realtimeRepairPath = resolve(
    process.cwd(),
    "supabase/migrations/000037_notifications_realtime_repair.sql"
  );
  if (existsSync(realtimeRepairPath)) {
    console.log("Applying 000037_notifications_realtime_repair.sql...");
    await db.unsafe(readFileSync(realtimeRepairPath, "utf8"));
  }
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await db.end();
}
