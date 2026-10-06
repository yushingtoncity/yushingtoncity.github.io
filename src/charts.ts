// @ts-nocheck
/* Chart specs. Plotly is lazy loaded when the first chart nears the viewport.
   Every chart reads a JSON exported by the source repo's own pipeline.
   Colours are not defined here: they come from the @theme tokens in styles.css.
   The data files are untyped JSON, so this file opts out of type checking. */

/* ---------- palette (read from the styles.css tokens on first use) ---------- */
function alpha(color, a) {
  const hex = color.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const n = parseInt(full, 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

let cached = null;
function theme() {
  if (cached) return cached;
  const css = getComputedStyle(document.documentElement);
  const tok = (name) => css.getPropertyValue(name).trim();
  const C = {
    s1: tok("--color-c1"), s2: tok("--color-c2"), s3: tok("--color-c3"), s4: tok("--color-c4"), s5: tok("--color-c5"),
    ink: tok("--color-ink"), body: tok("--color-body"), mute: tok("--color-mute"),
    paper: tok("--color-paper"), rule: tok("--color-rule-strong"),
    grid: tok("--color-grid"), axisline: tok("--color-axis")
  };
  cached = {
    C,
    SERIES: [C.s1, C.s2, C.s3, C.s4, C.s5],
    SEQ: [[0, tok("--color-seq0")], [0.4, tok("--color-seq1")], [0.75, tok("--color-seq2")], [1, tok("--color-seq3")]],
    SYMCOLOR: { BTCUSDT: C.s1, ETHUSDT: C.s2 },
    ZERO: alpha(C.ink, 0.45),
    GRID3D: alpha(C.ink, 0.14)
  };
  return cached;
}

const FONT = "Geist, system-ui, sans-serif";
const CONFIG = { displayModeBar: false, responsive: true };

function axisTitle(text) { return { text, font: { size: 11.5, color: theme().C.mute } }; }

function deepMerge(a, b) {
  const out = { ...a };
  Object.keys(b).forEach((k) => {
    const both = a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) &&
                 b[k] && typeof b[k] === "object" && !Array.isArray(b[k]);
    out[k] = both ? deepMerge(a[k], b[k]) : b[k];
  });
  return out;
}

function layout(overrides) {
  const { C } = theme();
  const axis = { gridcolor: C.grid, zerolinecolor: C.axisline, linecolor: C.axisline, ticks: "outside", tickcolor: C.axisline };
  return deepMerge({
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: FONT, size: 12, color: C.body },
    margin: { l: 54, r: 12, t: 8, b: 42 },
    xaxis: { ...axis },
    yaxis: { ...axis },
    hoverlabel: { bgcolor: C.paper, bordercolor: C.rule, font: { family: FONT, size: 12.5, color: C.ink } },
    legend: { orientation: "h", y: 1.1, x: 0, font: { size: 12 } },
    hovermode: "x unified",
    showlegend: true
  }, overrides || {});
}

const pickOls = (series) => series.filter((s) => s.model === "ols");
const symShort = (s) => (s === "BTCUSDT" ? "BTC" : "ETH");
const draw = (el, traces, lay) => window.Plotly.react(el, traces, lay, CONFIG);

/* ---------- chart builders (id -> {src, build}) ---------- */
const CHARTS = {

  /* ===== market-entropy ===== */

  "chart-decay": {
    src: "data/decay_r2.json",
    build(el, d) {
      const { SYMCOLOR } = theme();
      /* two lines, labelled at their first point instead of in a legend */
      const traces = pickOls(d.series).map((s) => {
        const name = symShort(s.symbol);
        return {
          type: "scatter", mode: "lines+markers+text", name,
          x: d.horizons_s, y: s.median_oos_r2_pct,
          text: d.horizons_s.map((_, i) => (i === 0 ? name : "")),
          textposition: "top right",
          textfont: { family: FONT, size: 12.5, color: SYMCOLOR[s.symbol] },
          line: { width: 2, color: SYMCOLOR[s.symbol] },
          marker: { size: 7, color: SYMCOLOR[s.symbol] },
          cliponaxis: false,
          hovertemplate: "%{y:.2f}% at %{x}s<extra>" + name + "</extra>"
        };
      });
      draw(el, traces, layout({
        showlegend: false,
        margin: { t: 24 },
        xaxis: { type: "log", tickvals: d.horizons_s, ticktext: d.horizons_s.map((h) => h + "s"), title: axisTitle("prediction horizon") },
        yaxis: { ticksuffix: "%", rangemode: "tozero" }
      }));
    }
  },

  "chart-costs": {
    src: "data/cost_survival.json",
    build(el, d) {
      const { C, SYMCOLOR } = theme();
      const fee = d.grids.central.fee_bps;
      const traces = pickOls(d.series).map((s) => ({
        type: "bar", name: symShort(s.symbol),
        x: d.horizons_s.map((h) => h + "s"),
        y: s.breakeven_bps_per_turn_permissive,
        marker: { color: SYMCOLOR[s.symbol] },
        hovertemplate: "%{y:.2f} bps per turn<extra>" + symShort(s.symbol) + "</extra>"
      }));
      draw(el, traces, layout({
        barmode: "group",
        hovermode: "x",
        yaxis: { title: axisTitle("breakeven one-way cost, bps per turn"), range: [0, fee * 1.18] },
        shapes: [{
          type: "line", xref: "paper", x0: 0, x1: 1, y0: fee, y1: fee,
          line: { color: C.mute, width: 1.4, dash: "dash" }
        }],
        annotations: [{
          xref: "paper", x: 0.99, y: fee, yanchor: "bottom", xanchor: "right",
          text: "taker fee assumed in the study: " + fee + " bps",
          showarrow: false, font: { size: 12, color: C.body }
        }]
      }));
    }
  },

  "chart-perday": {
    src: "data/perday_r2.json",
    build(el, d) {
      const { SYMCOLOR, ZERO } = theme();
      const traces = Object.keys(d.symbols).map((sym) => {
        const s = d.symbols[sym];
        const xs = [], ys = [];
        d.horizons_s.forEach((h) => {
          s.oos_r2_pct[String(h)].forEach((v) => { xs.push(h + "s"); ys.push(v); });
        });
        return {
          type: "box", name: symShort(sym) + " (" + s.n_days + " days)",
          x: xs, y: ys,
          marker: { color: SYMCOLOR[sym], size: 3, opacity: 0.55 },
          line: { width: 1.2 },
          fillcolor: "rgba(0,0,0,0)",
          boxpoints: "all", jitter: 0.5, pointpos: 0,
          hoverinfo: "skip"
        };
      });
      draw(el, traces, layout({
        boxmode: "group",
        hovermode: false,
        yaxis: { ticksuffix: "%", zerolinecolor: ZERO, zerolinewidth: 1.4, title: axisTitle("per-day OOS R²") },
        xaxis: { title: axisTitle("prediction horizon") }
      }));
    }
  },

  "chart-ablation": {
    src: "data/entropy_ablation.json",
    build(el, d) {
      const { SYMCOLOR, ZERO } = theme();
      const models = ["ols", "logit", "hgb"];
      /* multiplicative jitter: even spacing on a log axis */
      const jit = {
        "BTCUSDT|ols": 0.80, "BTCUSDT|logit": 0.88, "BTCUSDT|hgb": 0.96,
        "ETHUSDT|ols": 1.05, "ETHUSDT|logit": 1.15, "ETHUSDT|hgb": 1.26
      };
      const msym = { ols: "circle", logit: "diamond", hgb: "square" };
      const traces = [];
      ["BTCUSDT", "ETHUSDT"].forEach((sym) => {
        models.forEach((m) => {
          const rows = d.rows.filter((r) => r.symbol === sym && r.model === m);
          traces.push({
            type: "scatter", mode: "markers",
            name: symShort(sym) + " " + m,
            x: rows.map((r) => r.horizon_s * jit[sym + "|" + m]),
            y: rows.map((r) => r.delta_g3_minus_g2_pct),
            marker: { color: SYMCOLOR[sym], symbol: msym[m], size: 8, opacity: m === "ols" ? 1 : 0.6 },
            customdata: rows.map((r) => [r.model, r.days_g3_gt_g2, r.n_days, r.p_value, r.horizon_s]),
            hovertemplate: "ΔR² %{y:.4f} pp at %{customdata[4]}s<br>%{customdata[0]}: entropy wins %{customdata[1]}/%{customdata[2]} days, p=%{customdata[3]:.2f}<extra>" + symShort(sym) + "</extra>"
          });
        });
      });
      const maxAbs = Math.max(...d.rows.map((r) => Math.abs(r.delta_g3_minus_g2_pct)));
      const lim = Math.max(0.01, maxAbs * 1.6);
      draw(el, traces, layout({
        hovermode: "closest",
        xaxis: { type: "log", tickvals: [1, 5, 10, 30, 60], ticktext: ["1s", "5s", "10s", "30s", "60s"], title: axisTitle("prediction horizon") },
        yaxis: { range: [-lim, lim], zerolinecolor: ZERO, zerolinewidth: 1.4, title: axisTitle("ΔR², percentage points") },
        legend: { y: 1.16 }
      }));
    }
  },

  "chart-leeready": {
    src: "data/leeready_accuracy.json",
    build(el, d) {
      const { C } = theme();
      const conds = [["visible_pct", "synchronized"], ["visible_lagged_quote_pct", "1s quote lag"], ["hidden_pct", "hidden executions"]];
      const colors = { lee_ready: C.s1, tick: C.s2, emo: C.s3 };
      const names = { lee_ready: "Lee-Ready", tick: "tick rule", emo: "EMO" };
      const traces = Object.keys(names).map((cls) => {
        const rows = d.classifier_accuracy.filter((r) => r.classifier === cls);
        const xs = [], ys = [], tickers = [];
        conds.forEach((c) => {
          rows.forEach((r) => { xs.push(c[1]); ys.push(r[c[0]]); tickers.push(r.ticker); });
        });
        return {
          type: "box", name: names[cls], x: xs, y: ys,
          marker: { color: colors[cls], size: 4, opacity: 0.7 },
          line: { width: 1.2 }, fillcolor: "rgba(0,0,0,0)",
          boxpoints: "all", jitter: 0.4, pointpos: 0,
          text: tickers,
          hovertemplate: "%{text}: %{y:.1f}%<extra>" + names[cls] + "</extra>"
        };
      });
      draw(el, traces, layout({
        boxmode: "group", hovermode: "closest",
        yaxis: { ticksuffix: "%", title: axisTitle("accuracy vs true aggressor") }
      }));
    }
  },

  "chart-tickgroup": {
    src: "data/leeready_accuracy.json",
    build(el, d) {
      const { C } = theme();
      const colors = { lee_ready: C.s1, tick: C.s2, emo: C.s3 };
      const names = { lee_ready: "Lee-Ready", tick: "tick rule", emo: "EMO" };
      const locs = ["at_quote", "at_mid", "inside"];
      const groups = ["large_tick", "small_tick"];
      const cats = [];
      groups.forEach((g) => { locs.forEach((l) => { cats.push(g.replace("_tick", " tick") + "<br>" + l.replace("_", " ")); }); });
      const traces = Object.keys(names).map((cls) => {
        const ys = [], ns = [];
        groups.forEach((g) => {
          locs.forEach((l) => {
            const row = d.location_accuracy.find((r) => r.classifier === cls && r.tick_group === g && r.location === l);
            ys.push(row ? row.accuracy_pct : null);
            ns.push(row ? row.n_trades : 0);
          });
        });
        return {
          type: "bar", name: names[cls], x: cats, y: ys,
          marker: { color: colors[cls] },
          customdata: ns,
          hovertemplate: "%{y:.1f}% on %{customdata:,} trades<extra>" + names[cls] + "</extra>"
        };
      });
      draw(el, traces, layout({
        barmode: "group", hovermode: "x",
        yaxis: { ticksuffix: "%", title: axisTitle("accuracy vs true aggressor") },
        xaxis: { tickfont: { size: 10.5 } }
      }));
    }
  },

  "chart-acf": {
    src: "data/sign_acf.json",
    build(el, d) {
      const { SYMCOLOR } = theme();
      const traces = [];
      Object.keys(d.symbols).forEach((sym) => {
        const s = d.symbols[sym];
        const col = SYMCOLOR[sym];
        traces.push({ type: "scatter", mode: "lines", x: d.lags_trades, y: s.p90, line: { width: 0 }, showlegend: false, hoverinfo: "skip" });
        traces.push({ type: "scatter", mode: "lines", x: d.lags_trades, y: s.p10, line: { width: 0 }, fill: "tonexty", fillcolor: alpha(col, 0.12), showlegend: false, hoverinfo: "skip" });
        traces.push({
          type: "scatter", mode: "lines", name: symShort(sym) + " mean (" + s.n_days + " days)",
          x: d.lags_trades, y: s.mean, line: { width: 2, color: col },
          hovertemplate: "lag %{x}: %{y:.3f}<extra>" + symShort(sym) + "</extra>"
        });
      });
      draw(el, traces, layout({
        legend: { traceorder: "normal" },
        xaxis: { title: axisTitle("lag, trades") },
        yaxis: { title: axisTitle("trade-sign autocorrelation"), rangemode: "tozero" }
      }));
    }
  },

  /* variant: which symbol's surface to show */
  "chart-acf-surface": {
    src: "data/acf_surface.json",
    build(el, d, variant) {
      const { C, SEQ, GRID3D } = theme();
      const sym = variant || "BTCUSDT";
      const s = d.symbols[sym];
      const step = Math.ceil(s.days.length / 7);
      const surface = {
        type: "surface",
        x: d.lags_trades,
        y: s.days.map((_, i) => i),
        z: s.acf,
        colorscale: SEQ, showscale: false,
        cmin: 0, cmax: 0.45,
        lighting: { ambient: 0.85, diffuse: 0.4, specular: 0.06 },
        hovertemplate: "%{text}<br>lag %{x}: %{z:.3f}<extra>" + symShort(sym) + "</extra>",
        text: s.days.map((day) => d.lags_trades.map(() => day))
      };
      draw(el, [surface], layout({
        margin: { l: 0, r: 0, t: 4, b: 0 },
        showlegend: false,
        scene: {
          xaxis: { title: { text: "lag (trades)", font: { size: 10.5 } }, gridcolor: GRID3D, color: C.mute, showspikes: false },
          yaxis: {
            title: { text: "" }, gridcolor: GRID3D, color: C.mute, showspikes: false,
            tickvals: s.days.map((_, i) => i).filter((i) => i % step === 0),
            ticktext: s.days.filter((_, i) => i % step === 0).map((day) => day.slice(0, 7)),
            tickfont: { size: 9.5 }
          },
          zaxis: { title: { text: "ACF", font: { size: 10.5 } }, gridcolor: GRID3D, color: C.mute, showspikes: false },
          camera: { eye: { x: 1.58, y: -1.3, z: 0.68 }, center: { x: 0, y: 0, z: -0.18 } },
          aspectratio: { x: 1.5, y: 1.1, z: 0.5 }
        }
      }));
    }
  },

  "chart-ushape": {
    src: "data/intraday_ushape.json",
    build(el, d) {
      const { SERIES } = theme();
      const traces = Object.keys(d.tickers).map((t, i) => {
        const v = d.tickers[t].volume;
        return {
          type: "scatter", mode: "lines+markers", name: t,
          x: v.hour_center, y: v.share_pct,
          line: { width: 1.6, color: SERIES[i % SERIES.length] },
          marker: { size: 4 },
          hovertemplate: "%{y:.1f}% of day volume<extra>" + t + "</extra>"
        };
      });
      draw(el, traces, layout({
        xaxis: { title: axisTitle("hour of day (ET)"), dtick: 1 },
        yaxis: { ticksuffix: "%", title: axisTitle("volume share per 15 min") }
      }));
    }
  },

  /* ===== portfolio-optimization ===== */

  "chart-growth": {
    src: "data/growth10k.json",
    build(el, d) {
      const { C } = theme();
      const names = {
        equal_weight: "Equal weight", inverse_volatility: "Inverse volatility",
        min_variance: "Min variance", sixty_forty: "60/40 reference"
      };
      const colors = { equal_weight: C.s1, inverse_volatility: C.s3, min_variance: C.s5, sixty_forty: C.s2 };
      const traces = Object.keys(names).map((k) => ({
        type: "scatter", mode: "lines", name: names[k],
        x: d.dates, y: d.series[k].map((v) => (v == null ? null : v * 10000)),
        line: { width: k === "sixty_forty" ? 1.4 : 1.8, color: colors[k], dash: k === "sixty_forty" ? "dot" : "solid" },
        hovertemplate: "%{y:$,.0f}<extra>" + names[k] + "</extra>"
      }));
      draw(el, traces, layout({
        margin: { l: 66 },
        yaxis: { tickformat: "$,.0f" }
      }));
    }
  },

  "chart-vol": {
    src: "data/est_vs_realized_vol.json",
    build(el, d) {
      const { C } = theme();
      const order = ["equal_weight", "inverse_volatility", "min_variance", "sixty_forty"];
      const labels = ["Equal<br>weight", "Inverse<br>vol", "Min<br>variance", "60/40<br>ref"];
      const pred = order.map((k) => d.allocations[k].predicted);
      const real = order.map((k) => d.allocations[k].realized);
      draw(el, [
        { type: "bar", name: "Predicted (2019-2022 cov)", x: labels, y: pred,
          marker: { color: alpha(C.s2, 0.28), line: { color: C.s2, width: 1 } },
          hovertemplate: "%{y:.1%}<extra>predicted</extra>" },
        { type: "bar", name: "Realized (2023-2024)", x: labels, y: real,
          marker: { color: C.s1 },
          hovertemplate: "%{y:.1%}<extra>realized</extra>" }
      ], layout({
        barmode: "group", bargroupgap: 0.08, bargap: 0.45,
        yaxis: { tickformat: ".0%" },
        hovermode: "x"
      }));
    }
  },

  "chart-corr-surface": {
    src: "data/rolling_corr_surface.json",
    build(el, d) {
      const { C, SEQ, GRID3D } = theme();
      draw(el, [{
        type: "surface",
        x: d.dates,
        y: d.tickers.map((_, i) => i),
        z: d.corr,
        colorscale: SEQ, cmin: -0.2, cmax: 1,
        showscale: false,
        hovertemplate: "%{x}<br>corr %{z:.2f}<extra>%{text}</extra>",
        text: d.tickers.map((t) => d.dates.map(() => t)),
        lighting: { ambient: 0.85, diffuse: 0.4, specular: 0.06 }
      }], layout({
        margin: { l: 0, r: 0, t: 0, b: 0 },
        showlegend: false,
        scene: {
          xaxis: { title: { text: "" }, gridcolor: GRID3D, color: C.mute, showspikes: false },
          yaxis: { title: { text: "" }, gridcolor: GRID3D, color: C.mute, showspikes: false,
                   tickvals: d.tickers.map((_, i) => i), ticktext: d.tickers, tickfont: { size: 9.5 } },
          zaxis: { title: { text: "corr vs SPY", font: { size: 10.5 } }, gridcolor: GRID3D, color: C.mute, showspikes: false },
          camera: { eye: { x: 1.53, y: -1.35, z: 0.63 }, center: { x: 0, y: 0, z: -0.18 } },
          aspectratio: { x: 1.6, y: 1, z: 0.55 }
        }
      }));
    }
  },

  /* ===== mag7 ===== */

  "chart-mag7-equity": {
    src: "data/mag7_equity.json",
    build(el, d) {
      const { C } = theme();
      draw(el, [
        { type: "scatter", mode: "lines", name: "Mag 7 equal weight", x: d.Date, y: d.MAG7_eqw_equity,
          line: { width: 1.8, color: C.s1 }, hovertemplate: "%{y:.3f}<extra>Mag 7</extra>" },
        { type: "scatter", mode: "lines", name: "SPY", x: d.Date, y: d.SPY_equity,
          line: { width: 1.4, color: C.s2, dash: "dot" }, hovertemplate: "%{y:.3f}<extra>SPY</extra>" }
      ], layout({}));
    }
  },

  "chart-mag7-rolling": {
    src: "data/mag7_rolling.json",
    build(el, d) {
      const { C } = theme();
      draw(el, [
        { type: "scatter", mode: "lines", name: "20d vol (ann.)", x: d.Date, y: d.MAG7_vol_20_ann,
          line: { width: 1.6, color: C.s1 }, yaxis: "y",
          hovertemplate: "%{y:.1%}<extra>20d vol</extra>" },
        { type: "scatter", mode: "lines", name: "60d corr vs SPY", x: d.Date, y: d.MAG7_SPY_corr_60,
          line: { width: 1.6, color: C.s2 }, yaxis: "y2",
          hovertemplate: "%{y:.2f}<extra>60d corr</extra>" }
      ], layout({
        xaxis: { anchor: "y2" },
        yaxis: { domain: [0.58, 1], tickformat: ".0%" },
        yaxis2: { domain: [0, 0.42], gridcolor: C.grid, zerolinecolor: C.axisline, linecolor: C.axisline, ticks: "outside", tickcolor: C.axisline },
        margin: { l: 54, r: 12, t: 8, b: 36 }
      }));
    }
  }
};

/* ---------- loading ---------- */
let plotlyPromise = null;
function loadPlotly() {
  if (plotlyPromise) return plotlyPromise;
  plotlyPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/plotly.js-dist-min@3.1.1/plotly.min.js";
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return plotlyPromise;
}

function getJSON(src) {
  return fetch(src).then((r) => {
    if (!r.ok) throw new Error(src + " " + r.status);
    return r.json();
  });
}

/* Loads Plotly and the chart's data, draws it, and resolves with the data so the caller
   can redraw the same data in another variant without fetching again. */
export function drawChart(id: string, el: HTMLElement, variant?: string): Promise<unknown> {
  const spec = CHARTS[id];
  if (!spec) return Promise.reject(new Error("unknown chart " + id));
  return Promise.all([loadPlotly(), getJSON(spec.src)]).then(([, data]) => {
    spec.build(el, data, variant);
    return data;
  });
}

export function redrawChart(id: string, el: HTMLElement, data: unknown, variant?: string): void {
  CHARTS[id].build(el, data, variant);
}

export { getJSON };
