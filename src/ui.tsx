import { useEffect, useRef, useState, type ReactNode } from "react";
import { drawChart, getJSON, redrawChart } from "./charts";

type Kids = { children: ReactNode };

/* ---------- type and spacing primitives ---------- */

export function H2({ children }: Kids) {
  return <h2 className="max-w-[20em] text-balance text-[clamp(1.7rem,3vw,2.3rem)] font-[620] leading-[1.1] tracking-[-0.03em]">{children}</h2>;
}

export function H3({ children }: Kids) {
  return <h3 className="text-balance text-[1.3rem] font-semibold leading-tight tracking-[-0.02em]">{children}</h3>;
}

export function P({ children }: Kids) {
  return <p className="mt-[18px] max-w-[38em] text-body">{children}</p>;
}

/* the small grey line under a heading */
export function Meta({ children }: Kids) {
  return <p className="mt-[10px] text-[14.5px] text-mute">{children}</p>;
}

/* a note under an equation or grid */
export function Note({ children }: Kids) {
  return <p className="mt-[10px] max-w-[38em] text-[14px] text-mute">{children}</p>;
}

export function Links({ children }: Kids) {
  return <p className="mt-[18px] flex flex-wrap gap-x-6 gap-y-2 text-[15.5px]">{children}</p>;
}

/* a key figure inside a sentence */
export function Hl({ children }: Kids) {
  return <span className="hl">{children}</span>;
}

export function Section({ id, children }: Kids & { id: string }) {
  return <section id={id} className="scroll-mt-6 pt-20 wide:pt-28">{children}</section>;
}

export function Sub({ id, children }: Kids & { id: string }) {
  return <section id={id} className="scroll-mt-6 pt-14 wide:pt-[72px]">{children}</section>;
}

export function Duo({ children }: Kids) {
  return <div className="grid grid-cols-1 gap-x-8 wide:grid-cols-2">{children}</div>;
}

/* ---------- figures ---------- */

export function Figure({ caption, tools, children }: Kids & { caption: ReactNode; tools?: ReactNode }) {
  return (
    <figure className="mt-11 min-w-0 border-t border-ink pt-[10px]">
      {tools}
      {children}
      <figcaption className="mt-[14px] max-w-[46em] text-[14px] leading-[1.55] text-mute">{caption}</figcaption>
    </figure>
  );
}

type ChartProps = { id: string; label: string; tall?: boolean; variant?: string };

/* Draws nothing until the chart nears the viewport, so Plotly never blocks first paint.
   A chart inside the closed appendix has no box and waits until the reader opens it. */
export function Chart({ id, label, tall, variant }: ChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const plot = useRef<HTMLDivElement>(null);
  const data = useRef<unknown>(null);
  const wanted = useRef(variant);
  const drawn = useRef(variant);
  const [state, setState] = useState<"waiting" | "ready" | "failed">("waiting");
  wanted.current = variant;

  useEffect(() => {
    const el = box.current;
    const target = plot.current;
    if (!el || !target) return;
    let cancelled = false;
    const start = () => {
      const v = wanted.current;
      drawChart(id, target, v)
        .then((d) => {
          if (cancelled) return;
          data.current = d;
          drawn.current = v;
          setState("ready");
        })
        .catch((err) => {
          console.error(err);
          if (!cancelled) setState("failed");
        });
    };
    if (!("IntersectionObserver" in window)) {
      start();
      return () => { cancelled = true; };
    }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [id]);

  /* a new variant (the symbol toggle) redraws from the data already fetched */
  useEffect(() => {
    if (state !== "ready" || !plot.current || variant === drawn.current) return;
    redrawChart(id, plot.current, data.current, variant);
    drawn.current = variant;
  }, [id, state, variant]);

  const height = tall ? "h-[320px] sm:h-[420px]" : "h-[260px] sm:h-[320px]";
  return (
    <div ref={box} id={id} role="img" aria-label={label} className={"relative w-full " + height}>
      {state !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-2 text-[13.5px] text-mute">
          {state === "failed" ? "chart data unavailable" : "loading chart"}
        </div>
      )}
      <div ref={plot} data-ready={state === "ready"} className="h-full w-full" />
    </div>
  );
}

const SYMBOLS = ["BTCUSDT", "ETHUSDT"];

/* the 3D surface with its BTC / ETH toggle */
export function SurfaceFigure({ label, caption }: { label: string; caption: ReactNode }) {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const tools = (
    <div className="flex justify-end gap-1.5 pb-1.5">
      {SYMBOLS.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={symbol === s}
          onClick={() => setSymbol(s)}
          className={
            "cursor-pointer rounded-[4px] border px-[10px] py-1 text-[12.5px] font-medium transition-colors duration-200 ease-out-expo " +
            (symbol === s
              ? "border-ink bg-ink text-paper"
              : "border-rule-strong bg-transparent text-body hover:border-ink hover:text-ink")
          }
        >
          {s}
        </button>
      ))}
    </div>
  );
  return (
    <Figure caption={caption} tools={tools}>
      <Chart id="chart-acf-surface" tall variant={symbol} label={label} />
    </Figure>
  );
}

/* KaTeX HTML compiled from a .tex file at build time */
export function Equation({ html }: { html: string }) {
  return (
    <div
      className="equation mb-[10px] mt-7 overflow-x-auto overflow-y-hidden border-l-2 border-accent py-2 pl-[22px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type CoverageData = {
  symbols: string[];
  months: string[];
  rows: { symbol: string; month: string; day: string; status: string }[];
};

const symShort = (s: string) => (s === "BTCUSDT" ? "BTC" : "ETH");

/* month by symbol grid, drawn from data/coverage.json */
export function Coverage({ label }: { label: string }) {
  const [d, setD] = useState<CoverageData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let off = false;
    getJSON("data/coverage.json")
      .then((json: CoverageData) => { if (!off) setD(json); })
      .catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, []);

  const cells = d ? new Map(d.rows.map((r) => [r.symbol + "|" + r.month, r])) : null;
  return (
    <div className="overflow-x-auto pb-2 pt-4">
      <div id="coverage-grid" role="img" aria-label={label} className="flex w-max gap-[3px]">
        {failed && <span className="text-[14px] text-mute">coverage data unavailable</span>}
        {d && cells && (
          <>
            <div className="cov-col">
              {d.symbols.map((s) => <span key={s} className="cov-head">{symShort(s)}</span>)}
              <span />
            </div>
            {d.months.map((m) => (
              <div key={m} className="cov-col">
                {d.symbols.map((s) => {
                  const r = cells.get(s + "|" + m);
                  return (
                    <i
                      key={s}
                      className={"cov-cell" + (r && r.status === "excluded" ? " cov-miss" : "")}
                      title={r ? symShort(s) + " " + r.day + ": " + r.status : "absent"}
                    />
                  );
                })}
                <span className="cov-label">{m.slice(5) === "01" || m.slice(5) === "07" ? m : ""}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- page furniture ---------- */

const NAV: [id: string, label: string][] = [
  ["research", "Microstructure"],
  ["allocations", "Allocation"],
  ["mag7", "Mag 7"],
  ["systems", "Systems"],
  ["about", "About"]
];

const railLink =
  "inline-block py-[7px] text-mute no-underline hover:text-ink wide:block wide:py-[5px] " +
  "[&[aria-current]]:font-[580] [&[aria-current]]:text-ink";

/* Contents rail. Marks the section being read; on narrow screens it is one run of links. */
export function Rail() {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const inBand: Record<string, boolean> = {};
    let atEnd = false;
    const mark = () => {
      let cur: string | null = null;
      for (const [id] of NAV) if (!cur && inBand[id]) cur = id;
      /* the last section is too short to reach the reading band, so the footer stands in for it */
      if (atEnd) cur = NAV[NAV.length - 1][0];
      setCurrent(cur);
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { inBand[e.target.id] = e.isIntersecting; });
      mark();
    }, { rootMargin: "-12% 0px -78% 0px" });
    NAV.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    const end = new IntersectionObserver((entries) => {
      atEnd = entries[0].isIntersecting;
      mark();
    });
    const foot = document.getElementById("foot");
    if (foot) end.observe(foot);
    return () => {
      spy.disconnect();
      end.disconnect();
    };
  }, []);

  return (
    <aside className="pt-[18px] text-[14.5px] wide:sticky wide:top-0 wide:row-span-2 wide:flex wide:h-dvh wide:flex-col wide:justify-between wide:self-start wide:pb-10 wide:pt-[84px]">
      <nav aria-label="Main" className="inline wide:block">
        <ul className="inline wide:block">
          {NAV.map(([id, label]) => (
            <li key={id} className="mr-5 inline-block wide:mr-0 wide:block">
              <a href={"#" + id} aria-current={current === id ? "true" : undefined} className={railLink}>{label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mr-5 inline-block wide:mr-0 wide:block">
        <a href="https://github.com/yushingtoncity" rel="me" className={railLink}>GitHub</a>
      </p>
    </aside>
  );
}

/* Methods detail, closed by default so the note stays readable.
   A link to anything inside it (#validation, #dataset) opens it first. */
export function Appendix({ title, hint, children }: Kids & { title: string; hint: string }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const openForHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      const box = ref.current;
      if (box && target && box.contains(target) && !box.open) {
        box.open = true;
        target.scrollIntoView();
      }
    };
    openForHash();
    window.addEventListener("hashchange", openForHash);
    return () => window.removeEventListener("hashchange", openForHash);
  }, []);

  return (
    <details ref={ref} id="methods" className="group mt-14 border-y border-rule open:pb-16 wide:mt-[72px]">
      <summary className="grid cursor-pointer list-none grid-cols-1 items-center gap-x-6 gap-y-0.5 py-[22px] sm:grid-cols-[minmax(0,1fr)_auto] [&::-webkit-details-marker]:hidden">
        <span className="text-[1.3rem] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</span>
        <span className="text-[14.5px] text-mute sm:col-start-1">{hint}</span>
        <span className="mt-1.5 text-[14.5px] text-ink underline decoration-mute decoration-1 underline-offset-[3px] transition-colors duration-200 ease-out-expo group-hover:text-accent-ink group-hover:decoration-accent sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:mt-0">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      {children}
    </details>
  );
}

/* one row of the systems list: name and meta on the left, text on the right */
export function Entry({ title, meta, children }: Kids & { title: string; meta: string }) {
  return (
    <article className="grid grid-cols-1 gap-y-3 border-t border-rule pb-9 pt-7 wide:grid-cols-[250px_minmax(0,1fr)] wide:gap-x-8 wide:gap-y-0">
      <header>
        <h3 className="text-[1.1rem] font-semibold leading-tight tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-[13.5px] text-mute">{meta}</p>
      </header>
      {children}
    </article>
  );
}

export function EntryBody({ children, more }: Kids & { more?: boolean }) {
  return <div className={"space-y-3.5" + (more ? " wide:col-start-2" : "")}>{children}</div>;
}

export function EntryP({ children }: Kids) {
  return <p className="max-w-[38em] text-[16px] text-body">{children}</p>;
}

export function Facts({ items }: { items: string[] }) {
  return (
    <ul className="grid max-w-[38em] list-disc gap-1.5 pl-[1.1em] text-[15.5px] text-body marker:text-accent">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
