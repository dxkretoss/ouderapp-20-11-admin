import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

/**
 * Production builds get a strict Content-Security-Policy in index.html (only this origin and the Supabase
 * project may be contacted). The dev server skips it, because Vite injects inline scripts for hot reload.
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabase = (() => {
    try {
      return new URL(env.VITE_SUPABASE_URL).origin;
    } catch {
      return "";
    }
  })();
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${supabase}`.trim(),
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join("; ");
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "admin-csp",
        transformIndexHtml(html) {
          return command === "build"
            ? html.replace("<!--CSP-->", `<meta http-equiv="Content-Security-Policy" content="${csp}" />`)
            : html.replace("<!--CSP-->", "");
        },
      },
    ],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
    server: { port: 5174, strictPort: true },
    preview: { port: 4174 },
    build: { sourcemap: false },
  };
});
