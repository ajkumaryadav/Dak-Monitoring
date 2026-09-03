import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __pgSql: postgres.Sql | undefined;
}

function getDatabaseUrl(): string {
  let url =
    process.env.DATABASE_URL?.trim() ||
    "postgresql://postgres:12345@127.0.0.1:5433/dak_monitoring";

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "10.70.233.176" ||
      parsed.hostname === "10.70.12.73" ||
      parsed.hostname === "localhost"
    ) {
      parsed.hostname = "127.0.0.1";
    }
    // Standardize local port to 5433 if port was default 5432
    if (parsed.port === "5432" && !process.env.FORCE_PORT_5432) {
      parsed.port = "5433";
    }
    url = parsed.toString();
  } catch {
    // Ignore invalid url format and return as is
  }

  return url;
}

export function getPgClient(): postgres.Sql {
  if (global.__pgSql) {
    return global.__pgSql;
  }

  const databaseUrl = getDatabaseUrl();

  const client = postgres(databaseUrl, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 10,
    transform: {
      undefined: null,
    },
  });

  if (process.env.NODE_ENV !== "production") {
    global.__pgSql = client;
  }

  return client;
}

export const sql = getPgClient();
