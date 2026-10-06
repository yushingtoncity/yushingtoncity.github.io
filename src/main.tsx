import { createRoot, hydrateRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./styles.css";
import App from "./App";

const root = document.getElementById("root")!;

/* In the built site the HTML is already in the page (see scripts/prerender.mjs), so this only
   attaches behaviour to it. Under `npm run dev` the root is empty and React renders it. */
if (root.firstElementChild) hydrateRoot(root, <App />);
else createRoot(root).render(<App />);
