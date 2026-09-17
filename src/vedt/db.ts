import { VIDEOS, type Video } from "./data";

const env: Record<string, string | undefined> =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/**
 * Homepage catalogue source: the live Supabase `videos` table when reachable,
 * otherwise the static seed bundled in ./data (SSR-safe, works offline).
 */
export async function loadVideos(): Promise<Video[]> {
  const url = env["VITE_SUPABASE_URL"];
  const key = env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return VIDEOS;
  try {
    const res = await fetch(`${url}/rest/v1/videos?select=*&order=position.asc`, {
      headers: { apikey: key, accept: "application/json" },
    });
    if (!res.ok) return VIDEOS;
    const rows = (await res.json()) as Video[];
    return rows.length > 0 ? rows : VIDEOS;
  } catch {
    return VIDEOS;
  }
}
