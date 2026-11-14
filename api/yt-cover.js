/**
 * GET /api/yt-cover?id=<playlist id>
 * 302-redirects to the playlist's *current* cover image.
 *
 * Custom playlist covers are signed `i.ytimg.com/pl_c/...` URLs that expire,
 * so they can never be stored in the site. This resolves a fresh one on each
 * (cached) request. Playlists without a custom cover get the first video's
 * 16:9 frame (maxresdefault, else mqdefault): both have no letterbox bars.
 */

const FALLBACK_VIDEO = {
  "PL-fWIzgBd5AweOlOuudT-f9fqY1x-bR_O": "tuZty35Fk7M", // Japanese
  "PL-fWIzgBd5Az5euaBV1M5HElAKC8kzdYC": "8BiLurrzFRw", // English
  "PL-fWIzgBd5AyeDYfArAo6ZEKl3xxeG7mc": "HcOBSj_uSvM", // Hindi
  "PL-fWIzgBd5AxneK5vQfmaQskYmuwbXZ_k": "NT4eF9YsYnM", // Phonk
  "PL-fWIzgBd5Aw0-x8aDOYMOZcoD6jmzPWs": "QygzZXrHcdo", // Mix
};

const TIMEOUT_MS = 6000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function timed(url, init) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** A real frame, not YouTube's 120×90 "missing" placeholder (which comes back as 404). */
async function exists(url) {
  try {
    const r = await timed(url, { method: "HEAD" });
    return r.ok;
  } catch (_) {
    return false;
  }
}

async function videoFrame(videoId) {
  if (!videoId) return null;
  for (const size of ["maxresdefault", "mqdefault"]) {
    const u = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
    if (await exists(u)) return u;
  }
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

async function resolveCover(id) {
  try {
    const r = await timed("https://www.youtube.com/playlist?list=" + id, {
      headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": UA },
    });
    if (r.ok) {
      const html = await r.text();
      const covers = [...html.matchAll(/"url":"(https:\/\/i\.ytimg\.com\/pl_c\/[^"]+)","width":(\d+)/g)].map((m) => ({
        url: m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"),
        width: Number(m[2]),
      }));
      if (covers.length) return covers.sort((a, b) => b.width - a.width)[0].url;
      const og = html.match(/<meta property="og:image" content="([^"]+)"/);
      const vid = og && og[1].match(/i\.ytimg\.com\/vi\/([\w-]{6,})\//);
      if (vid) return videoFrame(vid[1]);
    }
  } catch (_) {
    /* fall through */
  }
  return videoFrame(FALLBACK_VIDEO[id]);
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const id = url.searchParams.get("id") || "";
  if (!Object.prototype.hasOwnProperty.call(FALLBACK_VIDEO, id)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "unknown playlist" }));
    return;
  }
  let target = null;
  try {
    target = await resolveCover(id);
  } catch (_) {
    target = `https://i.ytimg.com/vi/${FALLBACK_VIDEO[id]}/mqdefault.jpg`;
  }
  res.statusCode = 302;
  res.setHeader("Location", target);
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.end();
};
