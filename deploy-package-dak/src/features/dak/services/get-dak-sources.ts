import { createAdminClient } from "@/lib/supabase/admin";

export interface DakSourceOption {
  id: string;
  source_name: string;
  source_category: string;
}

const DEFAULT_SOURCES = [
  { source_name: "Chief Secretary", source_category: "executive" },
  { source_name: "CMO", source_category: "executive" },
  { source_name: "Secretariat", source_category: "executive" },
  { source_name: "Minister", source_category: "executive" },
  { source_name: "MP", source_category: "elected" },
  { source_name: "MLA", source_category: "elected" },
  { source_name: "Jan Sunwai", source_category: "public" },
  { source_name: "Ratri Chaupal", source_category: "public" },
  { source_name: "CM Helpline", source_category: "public" },
  { source_name: "Public Grievance", source_category: "public" },
  { source_name: "Court", source_category: "legal" },
  { source_name: "Department", source_category: "administrative" },
  { source_name: "Public", source_category: "public" },
  { source_name: "Email", source_category: "digital" },
  { source_name: "Other", source_category: "general" },
] as const;

async function seedSourcesIfEmpty() {
  const supabase = createAdminClient();
  await supabase.from("dak_sources").insert([...DEFAULT_SOURCES]);
}

/** Load active DAK sources alphabetically by name. */
export async function getDakSources(): Promise<DakSourceOption[]> {
  try {
    const supabase = createAdminClient();

    let { data, error } = await supabase
      .from("dak_sources")
      .select("id, source_name, source_category")
      .eq("is_active", true)
      .order("source_name", { ascending: true });

    if (error) {
      console.error("[getDakSources]", error.message);
      return [];
    }

    if (!data?.length) {
      await seedSourcesIfEmpty();

      const retry = await supabase
        .from("dak_sources")
        .select("id, source_name, source_category")
        .eq("is_active", true)
        .order("source_name", { ascending: true });

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[getDakSources]", error.message);
      return [];
    }

    return (data ?? []).sort((a, b) =>
      a.source_name.localeCompare(b.source_name, undefined, {
        sensitivity: "base",
      })
    );
  } catch (error) {
    console.error("[getDakSources]", error);
    return [];
  }
}

/** Resolve a source id by exact name (for report shortcuts). */
export async function getDakSourceIdByName(
  sourceName: string
): Promise<string | null> {
  const sources = await getDakSources();
  return sources.find((s) => s.source_name === sourceName)?.id ?? null;
}
