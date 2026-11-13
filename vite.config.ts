import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Cloudflare Rocket Loader rewrites <script> tags it hasn't been told to skip,
 * which can break the inlined module script. `data-cfasync="false"` opts out.
 * vite-plugin-singlefile rebuilds the module tag, so stamp it after that runs.
 * The attribute is ignored by every browser and by Vercel.
 */
function cfAsyncOff(): Plugin {
  return {
    name: "cf-async-off",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler: (html) => html.replace(/<script(?![^>]*data-cfasync)/g, '<script data-cfasync="false"'),
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), cfAsyncOff()],
  server: {
    host: "0.0.0.0",
    allowedHosts: [".e2b.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
