/**
 * Shared YouTube helpers for the Cloudflare Pages Functions.
 * Same logic as the Vercel handlers in /api (which stay untouched): oEmbed for
 * titles, the playlist page for the signed custom cover + track count.
 */

export const PLAYLISTS = {
  "PL-fWIzgBd5AweOlOuudT-f9fqY1x-bR_O": "tuZty35Fk7M", // Japanese
  "PL-fWIzgBd5Az5euaBV1M5HElAKC8kzdYC": "8BiLurrzFRw", // English
  "PL-fWIzgBd5AyeDYfArAo6ZEKl3xxeG7mc": "HcOBSj_uSvM", // Hindi
  "PL-fWIzgBd5AxneK5vQfmaQskYmuwbXZ_k": "NT4eF9YsYnM", // Phonk
  "PL-fWIzgBd5Aw0-x8aDOYMOZcoD6jmzPWs": "QygzZXrHcdo", // Mix
};
export const IDS = Object.keys(PLAYLISTS);

const TIMEOUT_MS = 6000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function timed(url, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function exists(url) {
  try {
    return (await timed(url, { method: "HEAD" })).ok;
  } catch (_) {
    return false;
  }
}

/** First video's 16:9 frame without letterbox bars. */
export async function videoFrame(videoId) {
  if (!videoId) return null;
  for (const size of ["maxresdefault", "mqdefault"]) {
    const u = `https://i.ytimg.com/vi/${videoId}/${size}.jpg`;
    if (await exists(u)) return u;
  }
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

async function playlistPage(id) {
  const r = await timed("https://www.youtube.com/playlist?list=" + id, {
    headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": UA },
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.text();
}

function parseCover(html) {
  const covers = [...html.matchAll(/"url":"(https:\/\/i\.ytimg\.com\/pl_c\/[^"]+)","width":(\d+)/g)].map((m) => ({
    url: m[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"),
    width: Number(m[2]),
  }));
  if (covers.length) return { custom: covers.sort((a, b) => b.width - a.width)[0].url };
  const og = html.match(/<meta property="og:image" content="([^"]+)"/);
  const vid = og && og[1].match(/i\.ytimg\.com\/vi\/([\w-]{6,})\//);
  return { video: vid ? vid[1] : null };
}

function parseCount(html) {
  const m = html.match(/"text":"([\d,]+)"\},\{"text":" videos"/) || html.match(/([\d,]+) videos/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

export async function resolveCover(id) {
  try {
    const c = parseCover(await playlistPage(id));
    if (c.custom) return c.custom;
    if (c.video) return videoFrame(c.video);
  } catch (_) {
    /* fall through */
  }
  return videoFrame(PLAYLISTS[id]);
}

export async function playlistInfo(id) {
  const out = { id, title: null, thumbnail: null, itemCount: null };
  const pageUrl = "https://www.youtube.com/playlist?list=" + id;
  try {
    const r = await timed("https://www.youtube.com/oembed?url=" + encodeURIComponent(pageUrl) + "&format=json");
    if (r.ok) out.title = (await r.json()).title || null;
  } catch (_) {
    /* keep null */
  }
  try {
    const html = await playlistPage(id);
    const c = parseCover(html);
    out.thumbnail = c.custom || (await videoFrame(c.video || PLAYLISTS[id]));
    out.itemCount = parseCount(html);
  } catch (_) {
    out.thumbnail = await videoFrame(PLAYLISTS[id]);
  }
  return out;
}
