/* Final build step. Renders the React app to static HTML and places it in dist/index.html,
   then copies the files the page fetches at runtime. The result needs no server runtime. */
import { cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const ssr = path.join(root, "dist-ssr");
const marker = "<!--app-->";

const { render } = await import(pathToFileURL(path.join(ssr, "entry-server.js")).href);
const page = path.join(dist, "index.html");
const template = await readFile(page, "utf8");
if (!template.includes(marker)) throw new Error("dist/index.html is missing the " + marker + " marker");

const html = render();
await writeFile(page, template.replace(marker, () => html));

/* Vite already bundles the fonts and favicon; the chart data is fetched by URL, so copy it as is. */
await cp(path.join(root, "data"), path.join(dist, "data"), { recursive: true });
await rm(ssr, { recursive: true, force: true });

console.log("prerendered " + html.length + " characters into dist/index.html");
