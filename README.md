# yushingtoncity.github.io

Personal quant research portfolio. Static HTML, CSS, and JavaScript with no build step: Plotly.js and KaTeX load from CDN, fonts are self hosted, and every chart is rendered from a JSON file under `data/`.

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
python -m http.server 8613
```

Then open http://localhost:8613. A server is needed because the charts fetch their JSON files.

## Deploy

The site deploys to GitHub Pages from the repository `yushingtoncity/yushingtoncity.github.io`, main branch, root folder. See the repository history for the QA process: desktop and mobile Playwright passes checking chart rendering, keyboard navigation, horizontal overflow, and copy rules.

## Copy rules

Site copy contains no em or en dashes, no hype language, and no trading edge or P&L claims. The market-entropy numbers on the page come from a closed, verified list matching `report/v3_research_note.md` in that repository.
