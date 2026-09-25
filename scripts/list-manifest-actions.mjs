import fs from "node:fs";

const manifest = JSON.parse(fs.readFileSync("d:/aj/Dak/.next/server/server-reference-manifest.json", "utf8"));
for (const [id, meta] of Object.entries(manifest.node || {})) {
  const workers = Object.keys(meta.workers || {});
  if (workers.some(w => w.includes("login") || w.includes("auth"))) {
    console.log(`Action ID: ${id} -> Workers: ${workers.join(", ")}`);
  }
}

