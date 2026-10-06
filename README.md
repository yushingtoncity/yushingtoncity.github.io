# yushingtoncity.github.io

Personal quant research portfolio. Built with React, Tailwind CSS and Vite, then prerendered at build time to static HTML, so the published site needs no server. Plotly.js loads from a CDN only when a chart nears the screen, equations are compiled with KaTeX during the build, fonts are self hosted, and every chart is rendered from a JSON file under `data/`.

## Data provenance

No number on this site is hand typed. Each JSON in `data/` is produced by an additive `site_export.py` script that lives in the source repository and reuses its committed pipeline code:

| Source repository | Command | Produces |
|---|---|---|
| [market-entropy](https://github.com/yushingtoncity/market-entropy) | `python site_export.py` | decay_r2, perday_r2, cost_survival, entropy_ablation, leeready_accuracy, sign_acf, acf_surface, intraday_ushape, coverage |
| [portfolio-optimization](https://github.com/yushingtoncity/portfolio-optimization) | `python site_export.py` | growth10k, est_vs_realized_vol, rolling_corr_surface |
| [mag7-quant-pipeline](https://github.com/yushingtoncity/mag7-quant-pipeline) | `python site_export.py` | mag7_equity, mag7_rolling |

Each script is deterministic and offline: it reads only local data produced by the repository's own committed pipeline, embeds no timestamps, and two consecutive runs produce byte identical output. Exported headline values are cross checked against the committed report tables at export time. If an input is missing, the script says which pipeline command to run first; it never substitutes synthetic data.

## Local preview

```
npm install
npm run dev
```

Then open the address Vite prints. To check the exact files that get published, build and serve the output folder:

```
npm run build
python -m http.server 8613 --directory dist
```

`npm run build` type checks the code, bundles it, renders the page to static HTML in `dist/index.html`, and copies `data/` into `dist/`.

## Layout

| Path | Holds |
|---|---|
| `src/App.tsx` | The page content, section by section |
| `src/ui.tsx` | Shared components: figures, charts, the contents rail, the appendix |
| `src/charts.ts` | One Plotly spec per chart, each reading a file in `data/` |
| `src/styles.css` | Design tokens (colors, fonts) and the few styles Tailwind utilities do not cover |
| `src/equations/` | Equations as `.tex` files, compiled to HTML during the build |
| `scripts/prerender.mjs` | The last build step: static HTML and the data copy |

## Deploy

The site deploys to GitHub Pages from the repository `yushingtoncity/yushingtoncity.github.io`. The workflow in `.github/workflows/pages.yml` builds the site on every push to `main` and publishes the `dist` folder, so the repository's Pages source must be set to GitHub Actions. See the repository history for the QA process: desktop and mobile passes checking chart rendering, keyboard navigation, horizontal overflow, and copy rules.

## Copy rules

Site copy contains no em or en dashes, no hype language, and no trading edge or P&L claims. The market-entropy numbers on the page come from a closed, verified list matching `report/v3_research_note.md` in that repository.
