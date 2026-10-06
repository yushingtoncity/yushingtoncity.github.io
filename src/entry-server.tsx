import { renderToString } from "react-dom/server";
import App from "./App";

/* Called once at build time by scripts/prerender.mjs. */
export function render(): string {
  return renderToString(<App />);
}
