/* quant-site charts. Static, no build step.
   Plotly is lazy-loaded when the first chart nears the viewport.
   Every chart reads a JSON exported by the source repo's own pipeline. */
(function () {
  "use strict";

  /* ---------- palette (plasma family) ---------- */
  var C = {
    amber: "#fca636",
    rose: "#e16462",
    magenta: "#b12a90",
    purple: "#9c179e",
    salmon: "#ed7953",
    crimson: "#d8576b",
    pink: "#bd3786",
    gray: "#8a8a96",
    ink: "#ececf1",
    body: "#a9a9b5",
    mute: "#70707c",
    grid: "rgba(255,255,255,0.06)",
    axisline: "rgba(255,255,255,0.14)"
  };
  var PLASMA = [
    [0.0, "#0d0887"], [0.11, "#46039f"], [0.22, "#7201a8"], [0.33, "#9c179e"],
    [0.44, "#bd3786"], [0.56, "#d8576b"], [0.67, "#ed7953"], [0.78, "#fa9e3b"],
    [0.89, "#fdc926"], [1.0, "#f0f921"]
  ];
  var SYMCOLOR = { BTCUSDT: C.amber, ETHUSDT: C.rose };

  var FONT_MONO = "Geist Mono, ui-monospace, Consolas, monospace";

  function layout(overrides) {
    var base = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: FONT_MONO, size: 11.5, color: C.body },
      margin: { l: 54, r: 12, t: 8, b: 42 },
      xaxis: { gridcolor: C.grid, zerolinecolor: C.axisline, linecolor: C.axisline, ticks: "outside", tickcolor: C.axisline },
      yaxis: { gridcolor: C.grid, zerolinecolor: C.axisline, linecolor: C.axisline, ticks: "outside", tickcolor: C.axisline },
      hoverlabel: { bgcolor: "#16161f", bordercolor: "#32323f", font: { family: FONT_MONO, size: 12, color: C.ink } },
      legend: { orientation: "h", y: 1.1, x: 0, font: { size: 11 } },
      hovermode: "x unified",
      showlegend: true
    };
    return deepMerge(base, overrides || {});
  }
  function deepMerge(a, b) {
    var out = {};
    Object.keys(a).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b).forEach(function (k) {
      out[k] = (a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) &&
                b[k] && typeof b[k] === "object" && !Array.isArray(b[k]))
        ? deepMerge(a[k], b[k]) : b[k];
    });
    return out;
  }
  var CONFIG = { displayModeBar: false, responsive: true };
  function pickOls(series) {
    return series.filter(function (s) { return s.model === "ols"; });
  }
  function symShort(s) { return s === "BTCUSDT" ? "BTC" : "ETH"; }

  /* ---------- chart builders (id -> {src, build}) ---------- */
  var CHARTS = {

    /* ===== market-entropy ===== */

    "chart-decay": {
      src: "data/decay_r2.json",
      build: function (el, d) {
        var traces = pickOls(d.series).map(function (s) {
          return {
            type: "scatter", mode: "lines+markers", name: symShort(s.symbol),
            x: d.horizons_s, y: s.median_oos_r2_pct,
            line: { width: 2, color: SYMCOLOR[s.symbol] },
            marker: { size: 7 },
            hovertemplate: "%{y:.2f}% at %{x}s<extra>" + symShort(s.symbol) + "</extra>"
          };
        });
        Plotly.newPlot(el, traces, layout({
          xaxis: { type: "log", tickvals: d.horizons_s, ticktext: d.horizons_s.map(function (h) { return h + "s"; }), title: { text: "prediction horizon", font: { size: 11, color: C.mute } } },
          yaxis: { ticksuffix: "%", rangemode: "tozero" }
        }), CONFIG);
      }
    },

    "chart-costs": {
      src: "data/cost_survival.json",
      build: function (el, d) {
        var fee = d.grids.central.fee_bps;
        var traces = pickOls(d.series).map(function (s) {
          return {
            type: "bar", name: symShort(s.symbol),
            x: d.horizons_s.map(function (h) { return h + "s"; }),
            y: s.breakeven_bps_per_turn_permissive,
            marker: { color: SYMCOLOR[s.symbol] },
            hovertemplate: "%{y:.2f} bps per turn<extra>" + symShort(s.symbol) + "</extra>"
          };
        });
        Plotly.newPlot(el, traces, layout({
          barmode: "group",
          hovermode: "x",
          yaxis: { title: { text: "breakeven one-way cost, bps per turn", font: { size: 11, color: C.mute } }, range: [0, fee * 1.18] },
          shapes: [{
            type: "line", xref: "paper", x0: 0, x1: 1, y0: fee, y1: fee,
            line: { color: C.gray, width: 1.4, dash: "dash" }
          }],
          annotations: [{
            xref: "paper", x: 0.99, y: fee, yanchor: "bottom", xanchor: "right",
            text: "taker fee assumed in the study: " + fee + " bps",
            showarrow: false, font: { size: 11, color: C.body }
          }]
        }), CONFIG);
      }
    },

    "chart-perday": {
      src: "data/perday_r2.json",
      build: function (el, d) {
        var traces = Object.keys(d.symbols).map(function (sym) {
          var s = d.symbols[sym];
          var xs = [], ys = [];
          d.horizons_s.forEach(function (h) {
            s.oos_r2_pct[String(h)].forEach(function (v) { xs.push(h + "s"); ys.push(v); });
          });
          return {
            type: "box", name: symShort(sym) + " (" + s.n_days + " days)",
            x: xs, y: ys,
            marker: { color: SYMCOLOR[sym], size: 3, opacity: 0.5 },
            line: { width: 1.2 },
            fillcolor: "rgba(0,0,0,0)",
            boxpoints: "all", jitter: 0.5, pointpos: 0,
            hoverinfo: "skip"
          };
        });
        Plotly.newPlot(el, traces, layout({
          boxmode: "group",
          hovermode: false,
          yaxis: { ticksuffix: "%", zerolinecolor: "rgba(255,255,255,0.35)", zerolinewidth: 1.4, title: { text: "per-day OOS R²", font: { size: 11, color: C.mute } } },
          xaxis: { title: { text: "prediction horizon", font: { size: 11, color: C.mute } } }
        }), CONFIG);
      }
    },

    "chart-ablation": {
      src: "data/entropy_ablation.json",
      build: function (el, d) {
        var models = ["ols", "logit", "hgb"];
        /* multiplicative jitter: even spacing on a log axis */
        var jit = {
          "BTCUSDT|ols": 0.80, "BTCUSDT|logit": 0.88, "BTCUSDT|hgb": 0.96,
          "ETHUSDT|ols": 1.05, "ETHUSDT|logit": 1.15, "ETHUSDT|hgb": 1.26
        };
        var msym = { ols: "circle", logit: "diamond", hgb: "square" };
        var traces = [];
        ["BTCUSDT", "ETHUSDT"].forEach(function (sym) {
          models.forEach(function (m) {
            var rows = d.rows.filter(function (r) { return r.symbol === sym && r.model === m; });
            traces.push({
              type: "scatter", mode: "markers",
              name: symShort(sym) + " " + m,
              x: rows.map(function (r) { return r.horizon_s * jit[sym + "|" + m]; }),
              y: rows.map(function (r) { return r.delta_g3_minus_g2_pct; }),
              marker: { color: SYMCOLOR[sym], symbol: msym[m], size: 8, opacity: m === "ols" ? 1 : 0.55 },
              customdata: rows.map(function (r) { return [r.model, r.days_g3_gt_g2, r.n_days, r.p_value, r.horizon_s]; }),
              hovertemplate: "ΔR² %{y:.4f} pp at %{customdata[4]}s<br>%{customdata[0]}: entropy wins %{customdata[1]}/%{customdata[2]} days, p=%{customdata[3]:.2f}<extra>" + symShort(sym) + "</extra>"
            });
          });
        });
        var maxAbs = Math.max.apply(null, d.rows.map(function (r) { return Math.abs(r.delta_g3_minus_g2_pct); }));
        var lim = Math.max(0.01, maxAbs * 1.6);
        Plotly.newPlot(el, traces, layout({
          hovermode: "closest",
          xaxis: { type: "log", tickvals: [1, 5, 10, 30, 60], ticktext: ["1s", "5s", "10s", "30s", "60s"], title: { text: "prediction horizon", font: { size: 11, color: C.mute } } },
          yaxis: { range: [-lim, lim], zerolinecolor: "rgba(255,255,255,0.35)", zerolinewidth: 1.4, title: { text: "ΔR², percentage points", font: { size: 11, color: C.mute } } },
          legend: { y: 1.16 }
        }), CONFIG);
      }
    },

    "chart-leeready": {
      src: "data/leeready_accuracy.json",
      build: function (el, d) {
        var conds = [["visible_pct", "synchronized"], ["visible_lagged_quote_pct", "1s quote lag"], ["hidden_pct", "hidden executions"]];
        var colors = { lee_ready: C.amber, tick: C.rose, emo: C.magenta };
        var names = { lee_ready: "Lee-Ready", tick: "tick rule", emo: "EMO" };
        var traces = Object.keys(names).map(function (cls) {
          var rows = d.classifier_accuracy.filter(function (r) { return r.classifier === cls; });
          var xs = [], ys = [], tickers = [];
          conds.forEach(function (c) {
            rows.forEach(function (r) { xs.push(c[1]); ys.push(r[c[0]]); tickers.push(r.ticker); });
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
        Plotly.newPlot(el, traces, layout({
          boxmode: "group", hovermode: "closest",
          yaxis: { ticksuffix: "%", title: { text: "accuracy vs true aggressor", font: { size: 11, color: C.mute } } }
        }), CONFIG);
      }
    },

    "chart-tickgroup": {
      src: "data/leeready_accuracy.json",
      build: function (el, d) {
        var colors = { lee_ready: C.amber, tick: C.rose, emo: C.magenta };
        var names = { lee_ready: "Lee-Ready", tick: "tick rule", emo: "EMO" };
        var locs = ["at_quote", "at_mid", "inside"];
        var groups = ["large_tick", "small_tick"];
        var cats = [];
        groups.forEach(function (g) { locs.forEach(function (l) { cats.push(g.replace("_tick", " tick") + "<br>" + l.replace("_", " ")); }); });
        var traces = Object.keys(names).map(function (cls) {
          var ys = [], ns = [];
          groups.forEach(function (g) {
            locs.forEach(function (l) {
              var row = d.location_accuracy.find(function (r) { return r.classifier === cls && r.tick_group === g && r.location === l; });
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
        Plotly.newPlot(el, traces, layout({
          barmode: "group", hovermode: "x",
          yaxis: { ticksuffix: "%", title: { text: "accuracy vs true aggressor", font: { size: 11, color: C.mute } } },
          xaxis: { tickfont: { size: 10 } }
        }), CONFIG);
      }
    },

    "chart-acf": {
      src: "data/sign_acf.json",
      build: function (el, d) {
        var traces = [];
        Object.keys(d.symbols).forEach(function (sym) {
          var s = d.symbols[sym];
          var col = SYMCOLOR[sym];
          var band = sym === "BTCUSDT" ? "rgba(252,166,54,0.07)" : "rgba(225,100,98,0.07)";
          traces.push({ type: "scatter", mode: "lines", x: d.lags_trades, y: s.p90, line: { width: 0 }, showlegend: false, hoverinfo: "skip" });
          traces.push({ type: "scatter", mode: "lines", x: d.lags_trades, y: s.p10, line: { width: 0 }, fill: "tonexty", fillcolor: band, showlegend: false, hoverinfo: "skip" });
          traces.push({
            type: "scatter", mode: "lines", name: symShort(sym) + " mean (" + s.n_days + " days)",
            x: d.lags_trades, y: s.mean, line: { width: 2, color: col },
            hovertemplate: "lag %{x}: %{y:.3f}<extra>" + symShort(sym) + "</extra>"
          });
        });
        Plotly.newPlot(el, traces, layout({
          legend: { traceorder: "normal" },
          xaxis: { title: { text: "lag, trades", font: { size: 11, color: C.mute } } },
          yaxis: { title: { text: "trade-sign autocorrelation", font: { size: 11, color: C.mute } }, rangemode: "tozero" }
        }), CONFIG);
      }
    },

    "chart-acf-surface": {
      src: "data/acf_surface.json",
      build: function (el, d) {
        function surfaceFor(sym) {
          var s = d.symbols[sym];
          return {
            type: "surface",
            x: d.lags_trades,
            y: s.days.map(function (_, i) { return i; }),
            z: s.acf,
            colorscale: PLASMA, showscale: false,
            cmin: 0, cmax: 0.45,
            lighting: { ambient: 0.85, diffuse: 0.4, specular: 0.06 },
            hovertemplate: "%{text}<br>lag %{x}: %{z:.3f}<extra>" + symShort(sym) + "</extra>",
            text: s.days.map(function (day) { return d.lags_trades.map(function () { return day; }); })
          };
        }
        function sceneFor(sym) {
          var s = d.symbols[sym];
          var step = Math.ceil(s.days.length / 7);
          return {
            xaxis: { title: { text: "lag (trades)", font: { size: 10 } }, gridcolor: C.grid, color: C.mute, showspikes: false },
            yaxis: {
              title: { text: "" }, gridcolor: C.grid, color: C.mute, showspikes: false,
              tickvals: s.days.map(function (_, i) { return i; }).filter(function (i) { return i % step === 0; }),
              ticktext: s.days.filter(function (_, i) { return i % step === 0; }).map(function (day) { return day.slice(0, 7); }),
              tickfont: { size: 9 }
            },
            zaxis: { title: { text: "ACF", font: { size: 10 } }, gridcolor: C.grid, color: C.mute, showspikes: false },
            camera: { eye: { x: 1.75, y: -1.45, z: 0.75 } },
            aspectratio: { x: 1.5, y: 1.1, z: 0.5 }
          };
        }
        function show(sym) {
          Plotly.react(el, [surfaceFor(sym)], layout({
            margin: { l: 0, r: 0, t: 4, b: 0 },
            showlegend: false,
            scene: sceneFor(sym)
          }), CONFIG);
        }
        show("BTCUSDT");
        var fig = el.closest("figure");
        if (fig) fig.querySelectorAll(".seg-btn").forEach(function (btn) {
          btn.addEventListener("click", function () {
            fig.querySelectorAll(".seg-btn").forEach(function (b) {
              var on = b === btn;
              b.classList.toggle("is-active", on);
              b.setAttribute("aria-pressed", String(on));
            });
            show(btn.dataset.symbol);
          });
        });
      }
    },

    "chart-ushape": {
      src: "data/intraday_ushape.json",
      build: function (el, d) {
        var shades = ["#fca636", "#ed7953", "#d8576b", "#bd3786", "#9c179e"];
        var tickers = Object.keys(d.tickers);
        var traces = tickers.map(function (t, i) {
          var v = d.tickers[t].volume;
          return {
            type: "scatter", mode: "lines+markers", name: t,
            x: v.hour_center, y: v.share_pct,
            line: { width: 1.6, color: shades[i % shades.length] },
            marker: { size: 4 },
            hovertemplate: "%{y:.1f}% of day volume<extra>" + t + "</extra>"
          };
        });
        Plotly.newPlot(el, traces, layout({
          xaxis: { title: { text: "hour of day (ET)", font: { size: 11, color: C.mute } }, dtick: 1 },
          yaxis: { ticksuffix: "%", title: { text: "volume share per 15 min", font: { size: 11, color: C.mute } } }
        }), CONFIG);
      }
    },

    /* ===== portfolio-optimization ===== */

    "chart-growth": {
      src: "data/growth10k.json",
      build: function (el, d) {
        var names = {
          equal_weight: "Equal weight", inverse_volatility: "Inverse volatility",
          min_variance: "Min variance", sixty_forty: "60/40 reference"
        };
        var colors = { equal_weight: C.amber, inverse_volatility: C.rose, min_variance: C.magenta, sixty_forty: C.gray };
        var traces = Object.keys(names).map(function (k) {
          return {
            type: "scatter", mode: "lines", name: names[k],
            x: d.dates, y: d.series[k].map(function (v) { return v == null ? null : v * 10000; }),
            line: { width: k === "sixty_forty" ? 1.4 : 1.8, color: colors[k], dash: k === "sixty_forty" ? "dot" : "solid" },
            hovertemplate: "%{y:$,.0f}<extra>" + names[k] + "</extra>"
          };
        });
        Plotly.newPlot(el, traces, layout({
          yaxis: { tickformat: "$,.0f" }
        }), CONFIG);
      }
    },

    "chart-vol": {
      src: "data/est_vs_realized_vol.json",
      build: function (el, d) {
        var order = ["equal_weight", "inverse_volatility", "min_variance", "sixty_forty"];
        var labels = ["Equal<br>weight", "Inverse<br>vol", "Min<br>variance", "60/40<br>ref"];
        var pred = order.map(function (k) { return d.allocations[k].predicted; });
        var real = order.map(function (k) { return d.allocations[k].realized; });
        Plotly.newPlot(el, [
          { type: "bar", name: "Predicted (2019-2022 cov)", x: labels, y: pred,
            marker: { color: "rgba(156,23,158,0.55)", line: { color: C.purple, width: 1 } },
            hovertemplate: "%{y:.1%}<extra>predicted</extra>" },
          { type: "bar", name: "Realized (2023-2024)", x: labels, y: real,
            marker: { color: C.amber },
            hovertemplate: "%{y:.1%}<extra>realized</extra>" }
        ], layout({
          barmode: "group", bargroupgap: 0.08,
          yaxis: { tickformat: ".0%" },
          hovermode: "x"
        }), CONFIG);
      }
    },

    "chart-corr-surface": {
      src: "data/rolling_corr_surface.json",
      build: function (el, d) {
        Plotly.newPlot(el, [{
          type: "surface",
          x: d.dates,
          y: d.tickers.map(function (_, i) { return i; }),
          z: d.corr,
          colorscale: PLASMA, cmin: -0.2, cmax: 1,
          showscale: false,
          hovertemplate: "%{x}<br>corr %{z:.2f}<extra>%{text}</extra>",
          text: d.tickers.map(function (t) { return d.dates.map(function () { return t; }); }),
          lighting: { ambient: 0.85, diffuse: 0.4, specular: 0.06 }
        }], layout({
          margin: { l: 0, r: 0, t: 0, b: 0 },
          showlegend: false,
          scene: {
            xaxis: { title: { text: "" }, gridcolor: C.grid, color: C.mute, showspikes: false },
            yaxis: { title: { text: "" }, gridcolor: C.grid, color: C.mute, showspikes: false,
                     tickvals: d.tickers.map(function (_, i) { return i; }), ticktext: d.tickers, tickfont: { size: 9 } },
            zaxis: { title: { text: "corr vs SPY", font: { size: 10 } }, gridcolor: C.grid, color: C.mute, showspikes: false },
            camera: { eye: { x: 1.7, y: -1.5, z: 0.7 } },
            aspectratio: { x: 1.6, y: 1, z: 0.55 }
          }
        }), CONFIG);
      }
    },

    /* ===== mag7 ===== */

    "chart-mag7-equity": {
      src: "data/mag7_equity.json",
      build: function (el, d) {
        Plotly.newPlot(el, [
          { type: "scatter", mode: "lines", name: "Mag 7 equal weight", x: d.Date, y: d.MAG7_eqw_equity,
            line: { width: 1.8, color: C.amber }, hovertemplate: "%{y:.3f}<extra>Mag 7</extra>" },
          { type: "scatter", mode: "lines", name: "SPY", x: d.Date, y: d.SPY_equity,
            line: { width: 1.4, color: C.gray, dash: "dot" }, hovertemplate: "%{y:.3f}<extra>SPY</extra>" }
        ], layout({}), CONFIG);
      }
    },

    "chart-mag7-rolling": {
      src: "data/mag7_rolling.json",
      build: function (el, d) {
        Plotly.newPlot(el, [
          { type: "scatter", mode: "lines", name: "20d vol (ann.)", x: d.Date, y: d.MAG7_vol_20_ann,
            line: { width: 1.6, color: C.rose }, yaxis: "y",
            hovertemplate: "%{y:.1%}<extra>20d vol</extra>" },
          { type: "scatter", mode: "lines", name: "60d corr vs SPY", x: d.Date, y: d.MAG7_SPY_corr_60,
            line: { width: 1.6, color: C.magenta }, yaxis: "y2",
            hovertemplate: "%{y:.2f}<extra>60d corr</extra>" }
        ], layout({
          xaxis: { anchor: "y2" },
          yaxis: { domain: [0.58, 1], tickformat: ".0%" },
          yaxis2: { domain: [0, 0.42], gridcolor: C.grid, zerolinecolor: C.axisline, linecolor: C.axisline, ticks: "outside", tickcolor: C.axisline },
          margin: { l: 54, r: 12, t: 8, b: 36 }
        }), CONFIG);
      }
    }
  };

  /* ---------- plumbing ---------- */
  var plotlyPromise = null;
  function loadPlotly() {
    if (plotlyPromise) return plotlyPromise;
    plotlyPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/plotly.js-dist-min@3.1.1/plotly.min.js";
      s.crossOrigin = "anonymous";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return plotlyPromise;
  }

  function renderChart(el) {
    var spec = CHARTS[el.id];
    if (!spec || el.dataset.rendered) return;
    el.dataset.rendered = "1";
    Promise.all([
      loadPlotly(),
      fetch(spec.src).then(function (r) {
        if (!r.ok) throw new Error(spec.src + " " + r.status);
        return r.json();
      })
    ]).then(function (res) {
      el.textContent = "";
      spec.build(el, res[1]);
    }).catch(function (err) {
      var fb = el.querySelector(".chart-fallback");
      if (fb) fb.textContent = "chart data unavailable";
      console.error(err);
    });
  }

  var io = ("IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { io.unobserve(e.target); renderChart(e.target); }
        });
      }, { rootMargin: "600px 0px" })
    : null;

  function initCharts() {
    Object.keys(CHARTS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (io) io.observe(el); else renderChart(el);
    });
  }

  /* ---------- coverage grid (plain DOM, no plotly) ---------- */
  function initCoverage() {
    var host = document.getElementById("coverage-grid");
    if (!host) return;
    fetch("data/coverage.json").then(function (r) {
      if (!r.ok) throw new Error("coverage " + r.status);
      return r.json();
    }).then(function (d) {
      var bySym = {};
      d.rows.forEach(function (r) { bySym[r.symbol + "|" + r.month] = r; });
      /* header column with symbol labels */
      var head = document.createElement("div");
      head.className = "cov-col";
      d.symbols.forEach(function (sym) {
        var lab = document.createElement("span");
        lab.className = "cov-head";
        lab.textContent = symShort(sym);
        head.appendChild(lab);
      });
      head.appendChild(document.createElement("span"));
      host.appendChild(head);
      d.months.forEach(function (m) {
        var col = document.createElement("div");
        col.className = "cov-col";
        d.symbols.forEach(function (sym) {
          var r = bySym[sym + "|" + m];
          var c = document.createElement("i");
          c.className = "cov-cell" + (r && r.status === "excluded" ? " cov-miss" : "");
          c.title = r ? (symShort(sym) + " " + r.day + ": " + r.status) : "absent";
          col.appendChild(c);
        });
        var lab = document.createElement("span");
        lab.className = "cov-label";
        lab.textContent = (m.slice(5) === "01" || m.slice(5) === "07") ? m : "";
        col.appendChild(lab);
        host.appendChild(col);
      });
    }).catch(function () {
      host.textContent = "coverage data unavailable";
    });
  }

  /* ---------- katex ---------- */
  function initKatex() {
    if (typeof katex === "undefined") { setTimeout(initKatex, 120); return; }
    document.querySelectorAll("[data-tex]").forEach(function (el) {
      try {
        katex.render(el.getAttribute("data-tex"), el, { displayMode: true, throwOnError: false });
      } catch (e) { el.textContent = el.getAttribute("data-tex"); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initCharts(); initCoverage(); initKatex(); });
  } else {
    initCharts(); initCoverage(); initKatex();
  }
})();
