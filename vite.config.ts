import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import katex from "katex";

/* Compiles .tex files to KaTeX HTML at build time, so no KaTeX JavaScript ships to the browser. */
function tex(): Plugin {
  return {
    name: "tex-to-html",
    transform(code, id) {
      if (!id.endsWith(".tex")) return null;
      const html = katex.renderToString(code.trim(), { displayMode: true, throwOnError: true });
      return { code: `export default ${JSON.stringify(html)};`, map: null };
    }
  };
}

export default defineConfig({
  plugins: [tailwindcss(), tex()],
  /* No public folder: fonts/ and favicon.svg are bundled from the repo root, and
     scripts/prerender.mjs copies data/ into dist for the charts to fetch. */
  publicDir: false,
  build: { target: "es2020" }
});
