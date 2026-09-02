import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "./src/lib/supabase/admin.ts";

async function test() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dak_entries")
    .select("id, dak_number, status")
    .eq("dak_number", "DAK-1783507568062")
    .maybeSingle();

  console.log("DAK record:", data, "Error:", error);
}

test();
