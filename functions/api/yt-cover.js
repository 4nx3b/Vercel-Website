// Cloudflare Pages Function: GET /api/yt-cover?id=<playlist id> → 302 to the current cover.
import { PLAYLISTS, resolveCover } from "../_lib/yt.js";

export async function onRequestGet({ request }) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!Object.prototype.hasOwnProperty.call(PLAYLISTS, id)) {
    return new Response(JSON.stringify({ error: "unknown playlist" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  let target;
  try {
    target = await resolveCover(id);
  } catch (_) {
    target = `https://i.ytimg.com/vi/${PLAYLISTS[id]}/mqdefault.jpg`;
  }
  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
