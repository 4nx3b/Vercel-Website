const VERCEL_SITE_CONTENT_ORIGIN = "https://v3rsi0n.vercel.app";
const REMOTE_API_HOSTS = new Set(["v3rsi0n.miuka.moe", "v3rsi0n.wasmer.app"]);

/** Resolve the shared API URL for a specific site host (also easy to test in Node). */
export function siteContentApiUrlForHost(hostname: string, suffix = ""): string {
  const origin = REMOTE_API_HOSTS.has(hostname.toLowerCase()) ? VERCEL_SITE_CONTENT_ORIGIN : "";
  return `${origin}/api/site-content${suffix}`;
}

/** Use the local Vercel route on Vercel; use its allowlisted API on the other public hosts. */
export function siteContentApiUrl(suffix = ""): string {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  return siteContentApiUrlForHost(hostname, suffix);
}
