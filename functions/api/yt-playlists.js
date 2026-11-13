// Cloudflare Pages Function: GET /api/yt-playlists → live title, cover and count (same shape as the Vercel handler).
import { IDS, playlistInfo } from "../_lib/yt.js";

export async function onRequestGet() {
  let playlists = [];
  try {
    playlists = await Promise.all(IDS.map(playlistInfo));
  } catch (_) {
    playlists = [];
  }
  return new Response(JSON.stringify({ playlists, fetchedAt: new Date().toISOString() }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" },
  });
}

export const onRequestHead = onRequestGet;
