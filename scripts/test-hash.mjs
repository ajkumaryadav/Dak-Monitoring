import postgres from "../node_modules/postgres/src/index.js";

const sql = postgres(process.env.DATABASE_URL || "postgresql://postgres:12345@127.0.0.1:5432/dak_monitoring");

const hash = "$2a$10$D/RGld1hutAbGuWNV9zn/efQw1bL6.FmRC/OAsGf01Pt.zTNry6C.";

const candidates = [
  "123456", "12345", "12345678", "1234", "123456789", "password", "password123",
  "Admin@123", "admin", "admin123", "admin@123", "Admin123", "Admin@1234",
  "aj@123", "aj123", "aj@ktl.com", "aj", "ktl", "ktl123", "ktl@123", "dak123",
  "postgres", "test", "welcome", "welcome123", "Ajay@123", "ajay123", "ajay",
  "Ajay", "Ajay@1", "aj@1", "111111", "000000", "secret", "root", "user",
  "collector", "collector123", "Collector@123", "operator", "operator123"
];

async function run() {
  try {
    for (const p of candidates) {
      try {
        const res = await sql`SELECT (crypt(${p}, ${hash}) = ${hash}) as is_match`;
        if (res[0]?.is_match) {
          console.log("MATCH FOUND >>>", p);
          await sql.end();
          process.exit(0);
        }
      } catch (err) {
        console.log("crypt error:", err.message);
        break;
      }
    }
    console.log("Not in common candidate list.");
  } catch (err) {
    console.error("Postgres error:", err.message);
  } finally {
    await sql.end();
  }
}

run();
