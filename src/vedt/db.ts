import { VIDEOS, SECTIONS, type SectionMeta, type Video } from "./data";

const env: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

async function rest<T>(path: string): Promise<T | null> {
  const url = env["VITE_SUPABASE_URL"];
  const key = env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key, accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Homepage catalogue source: the live Supabase `videos` table when reachable,
 * otherwise the static seed bundled in ./data (SSR-safe, works offline).
 */
export async function loadVideos(): Promise<Video[]> {
  const rows = await rest<Video[]>("videos?select=*&order=position.asc");
  return rows && rows.length > 0 ? rows : VIDEOS;
}

type CategoryRow = { slug: string; label: string; subs: string[] | null; position: number };

/** Category order/labels come from the DB so the admin can rearrange niches. */
export async function loadSections(): Promise<SectionMeta[]> {
  const rows = await rest<CategoryRow[]>("categories?select=*&order=position.asc");
  if (!rows || rows.length === 0) return SECTIONS;
  return rows.map((r) => ({
    id: r.slug,
    label: r.label,
    ...(r.subs && r.subs.length > 0 ? { subs: r.subs } : {}),
  }));
}
