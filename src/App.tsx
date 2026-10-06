import breakeven from "./equations/breakeven.tex";
import ofi from "./equations/ofi.tex";
import {
  Appendix, Chart, Coverage, Duo, Entry, EntryBody, EntryP, Equation, Facts, Figure,
  H2, H3, Hl, Links, Meta, Note, P, Rail, Section, Sub, SurfaceFigure
} from "./ui";

/* The whole page. Copy rules: no em or en dashes, no hype, no trading edge or P&L claims.
   Every number here also appears in the source repositories' committed reports. */
export default function App() {
  return (
    <>
      <a
        href="#main"
        className="absolute -left-[9999px] top-0 z-50 rounded-br-[4px] bg-ink px-4 py-[10px] text-[14px] text-paper no-underline hover:text-paper focus:left-0 focus:text-paper"
      >
        Skip to content
      </a>

      <div className="mx-auto grid max-w-[1128px] grid-cols-[minmax(0,1fr)] px-5 wide:grid-cols-[168px_minmax(0,1fr)] wide:gap-x-[72px] wide:px-6">
        <Rail />

        <main id="main" className="min-w-0 pt-10 wide:pt-[72px]">
          <TitleBlock />
          <Microstructure />
          <Allocation />
          <Mag7 />
          <Systems />
          <About />
        </main>

        <footer id="foot" className="mt-20 border-t border-rule pb-[72px] pt-6 wide:col-start-2 wide:mt-28">
          <p className="max-w-[46em] text-[14px] text-mute">Every chart on this page is rendered from JSON exported by the source repository&rsquo;s own committed pipeline.</p>
        </footer>
      </div>
    </>
  );
}

function TitleBlock() {
  return (
    <header id="top" className="title-rise scroll-mt-6">
      <h1 className="text-balance text-[clamp(2.4rem,4.6vw,3.6rem)] font-[620] leading-none tracking-[-0.04em]">Ayush Mukhi</h1>
      <p className="mt-[14px] text-[1rem] text-mute">Finance and business, George Mason University</p>
      <p className="mt-9 max-w-[30em] text-[clamp(1.2rem,1.9vw,1.45rem)] leading-[1.45] tracking-[-0.012em] text-ink">I work on market microstructure and portfolio allocation. I report what the tests show, including the hypothesis that failed.</p>
      {/* A resume link becomes the primary button here once the file is provided; email sits beside it. */}
      <p className="mt-8 flex flex-wrap items-center gap-6 text-[15.5px]">
        <a
          href="https://github.com/yushingtoncity"
          className="inline-block rounded-[4px] bg-ink px-[18px] py-[10px] text-[14.5px] font-[540] text-paper no-underline transition-[background-color,transform] duration-200 ease-out-expo hover:bg-ink-soft hover:text-paper active:translate-y-px"
        >
          GitHub
        </a>
      </p>
    </header>
  );
}

function Microstructure() {
  return (
    <Section id="research">
      <H2>Predictability exists. It dies at costs.</H2>
      <Meta>market-entropy, a pre-registered study</Meta>
      <P>Order flow predicts crypto price moves seconds ahead, consistently and out of sample. The effect is an order of magnitude too small to survive trading fees, and the entropy feature the study was built around added nothing. Both results are reported in full.</P>
      <P>Median out-of-sample R&sup2; at 1 second is <Hl>3.6%</Hl> for BTC and <Hl>2.6%</Hl> for ETH. It is positive on <Hl>97% of 75</Hl> held-out days, across <Hl>1,020</Hl> configurations enumerated in advance and all reported.</P>
      <Links>
        <a href="https://github.com/yushingtoncity/market-entropy/blob/main/report/v3_research_note.md">Read the research note</a>
        <a href="https://github.com/yushingtoncity/market-entropy">Source repository</a>
      </Links>
      <Figure caption={<>Median per-day out-of-sample R&sup2; by prediction horizon. Walk-forward, monthly refits, held-out days only. Decays toward zero: about 0.2 to 0.3% at 60 seconds.</>}>
        <Chart id="chart-decay" tall label="Line chart: median out-of-sample R squared versus prediction horizon for BTC and ETH. Both curves start near 3.6 and 2.6 percent at 1 second and decay toward zero by 60 seconds." />
      </Figure>

      <Sub id="costs">
        <H3>Gross predictability dies at trading costs</H3>
        <P>Turning the forecasts into a simple trading rule earns positive gross PnL on most days. Charging any realistic fee erases it. The breakeven one-way cost is 0.17 to 0.33 bps per unit of turnover, against multi-bp taker fees on the venue the data comes from.</P>
        <Equation html={breakeven} />
        <Note>The flat one-way cost in bps at which net PnL crosses zero, as computed in <code>src/study/costs.py</code>.</Note>
        <Figure caption={<>Breakeven one-way cost vs the study&rsquo;s fee assumption. OLS forecasts under the most permissive cost grid. The dashed line is the taker fee the pre-registered design assumes.</>}>
          <Chart id="chart-costs" tall label="Bar chart: the breakeven one-way cost per unit of turnover sits between 0.17 and 0.33 bps across horizons, far below the 2.5 bps taker fee the study assumes." />
        </Figure>
      </Sub>

      <Sub id="consistency">
        <H3>The signal shows up almost every day</H3>
        <P>Per-day out-of-sample R&sup2; across 38 BTC and 37 ETH held-out days. Positive on 97% of them. Sign accuracy reaches 69 to 76% at 1 second on bars where the mid moved at all.</P>
        <Figure caption={<>Per-day out-of-sample R&sup2; distribution, held-out days.</>}>
          <Chart id="chart-perday" tall label="Distribution of per-day out-of-sample R squared for BTC and ETH held-out days. Nearly all days are positive." />
        </Figure>
      </Sub>

      <Sub id="null">
        <H3>The founding hypothesis returned a null</H3>
        <P>The study exists because of a hunch that Shannon entropy of order flow carries information beyond the flow itself. It does not. Ablation &Delta;R&sup2; is roughly &minus;0.0002 percentage points and day-level wins are never distinguishable from a coin flip.</P>
        <P>The design was committed before any model was fit, so this null is reported with the same prominence as the positive results. A measurement study that cannot publish a null is not measuring.</P>
        <Figure caption={<>Entropy ablation: &Delta;R&sup2; from adding entropy features. &Delta;R&sup2; of flow plus entropy versus flow alone, per symbol and horizon.</>}>
          <Chart id="chart-ablation" label="Bar chart: change in out-of-sample R squared from adding entropy features. All bars sit at approximately zero." />
        </Figure>
      </Sub>

      <Appendix title="Validation and data" hint="How the pipeline was checked against ground truth, and what the dataset covers.">
        <section id="validation" className="scroll-mt-6 pt-8">
          <H3>The pipeline was validated before it was trusted</H3>
          <P>Phase v1 scored every component against LOBSTER NASDAQ ground truth: zero reconciliation violations across 500,000 sampled book events, and the trade-sign classifier scored against true aggressor labels. Lee-Ready holds 90 to 94% accuracy under a 1 second quote lag. Classic stylized facts replicate.</P>
          <Duo>
            <Figure caption="Trade classifier accuracy by condition.">
              <Chart id="chart-leeready" label="Grouped bars: classifier accuracy for Lee-Ready, tick, and EMO rules under synchronized quotes, one second quote lag, and hidden executions." />
            </Figure>
            <Figure caption="Accuracy by tick-size group and trade location.">
              <Chart id="chart-tickgroup" label="Grouped bars: classifier accuracy split by large-tick versus small-tick stocks and by trade location." />
            </Figure>
          </Duo>
          <Figure caption="Intraday volume profile, LOBSTER sample day. The classic U shape, replicated from the sample day as a pipeline sanity check.">
            <Chart id="chart-ushape" label="Line chart: share of daily volume per fifteen minute bucket for five stocks, high at the open and close and lower midday, the classic intraday U shape." />
          </Figure>
        </section>

        <Sub id="dataset">
          <H3>44 months of tick data, pinned by hash</H3>
          <Meta>Dataset v2a</Meta>
          <P>Binance USDT-perp quotes and trades, 2023-01 through 2026-08. 87 of 88 candidate day-symbols passed quality gates; every source file is recorded in a committed SHA-256 provenance manifest. The order-flow imbalance driving the study:</P>
          <Equation html={ofi} />
          <Note>Event-level order flow imbalance, Cont, Kukanov and Stoikov (2014), summed per bar. Implemented once in <code>src/features/microstructure.py</code> and reused across phases.</Note>

          <SurfaceFigure
            label="3D surface: trade-sign autocorrelation by day and lag across the included days. The decay shape is stable across days."
            caption={<>Trade-sign ACF surface, included day &times; lag. One row per included day. The persistence structure is stable across three and a half years.</>}
          />

          <Figure caption="Trade-sign autocorrelation, mean and 10-90 band.">
            <Chart id="chart-acf" label="Line chart: mean autocorrelation of trade signs decaying slowly over 120 lags, with a tenth to ninetieth percentile band across days, for BTC and ETH." />
          </Figure>

          <div className="mt-14">
            <h4 className="text-[1.05rem] font-semibold tracking-[-0.01em]">Coverage, month by symbol</h4>
            <Coverage label="Grid of 44 months by two symbols. All cells included except ETHUSDT August 2026, excluded for a quote gap." />
            <p className="mt-[10px] flex max-w-[38em] flex-wrap gap-x-[22px] gap-y-2 text-[14px] text-mute">
              <span><i className="cov-key" />passed quality gates</span>
              <span><i className="cov-key cov-miss" />excluded: 60.2 s quote gap</span>
            </p>
            <Note>87 of 88 candidate day-symbols pass. The one exclusion is the only gap in 44 months.</Note>
          </div>
        </Sub>
      </Appendix>
    </Section>
  );
}

function Allocation() {
  return (
    <Section id="allocations">
      <H2>Four allocation rules, judged strictly out of sample</H2>
      <Meta>portfolio-optimization</Meta>
      <P>Weights chosen on 2019-2022 daily data only, then held fixed and evaluated on 2023-2024 with quarterly rebalancing, gross and net of 10 bps per rebalance. Twelve large-cap US stocks; a fixed 60/40 SPY/AGG portfolio as the reference. The point is not the returns. It is the gap between what the optimizer predicted and what happened.</P>
      <Figure caption="Growth of $10,000 over the evaluation window. Zero-cost curves shown; net-of-cost results differ by under 1% annualized and are reported in the repository.">
        <Chart id="chart-growth" tall label="Line chart: growth of ten thousand dollars for equal weight, inverse volatility, minimum variance, and sixty forty portfolios over 2023 to 2024." />
      </Figure>
      <Figure caption="Predicted vs realized volatility. Estimation error, the honest headline of portfolio optimization.">
        <Chart id="chart-vol" label="Paired bars: annualized volatility each allocation predicted from the estimation window versus what it realized out of sample." />
      </Figure>
      <Figure caption={<>Rolling 60-day correlation vs SPY, asset &times; time.</>}>
        <Chart id="chart-corr-surface" tall label="3D surface: rolling sixty day correlation of each of twelve stocks against SPY from 2019 through 2024." />
      </Figure>
      <P><a href="https://github.com/yushingtoncity/portfolio-optimization">Source repository</a>, including the limitations the README states plainly: one regime, a universe picked with hindsight, and a flat cost model.</P>
    </Section>
  );
}

function Mag7() {
  return (
    <Section id="mag7">
      <H2>Mag 7 vs SPY through 2025, measured daily</H2>
      <Meta>mag7-quant-pipeline</Meta>
      <P>An equal-weight basket of the seven mega-caps against SPY across 249 trading days of 2025: cumulative equity, 20-day rolling volatility, 60-day rolling correlation, and a daily regime tag. Descriptive analytics, not a backtest.</P>
      <Duo>
        <Figure caption="Cumulative equity, normalized to 1.0.">
          <Chart id="chart-mag7-equity" label="Line chart: equal weight Mag 7 equity curve versus SPY across 2025, both starting at one." />
        </Figure>
        <Figure caption="Rolling volatility and correlation.">
          <Chart id="chart-mag7-rolling" label="Two line charts: twenty day annualized volatility of the Mag 7 basket, and its sixty day rolling correlation with SPY." />
        </Figure>
      </Duo>
      <P><a href="https://github.com/yushingtoncity/mag7-quant-pipeline">Source repository</a></P>
    </Section>
  );
}

function Systems() {
  return (
    <Section id="systems">
      <H2>Systems and earlier work</H2>
      <div className="mt-10">
        <Entry title="AEGIS" meta="Python, agentic trading platform">
          <EntryBody>
            <EntryP>&ldquo;The LLM proposes; deterministic code disposes.&rdquo; An agentic trading platform where language-model output can never touch an order directly: every proposal must pass a deterministic policy gate before an executor sees it. Phases 0 and 1 of 10 are complete: a typed data layer over the Alpaca paper API with staleness-labeled quotes, option chains, and news, plus operator CLIs. Paper trading only, hardcoded. No live capital, and graded on operational correctness rather than P&amp;L.</EntryP>
          </EntryBody>
          <div className="my-7 overflow-x-auto wide:col-span-2">
            <AegisDiagram />
          </div>
          <EntryBody more>
            <Facts
              items={[
                "76 passing tests, fixtures only, no live API calls in the suite",
                "Free-plan data quirks handled explicitly: IEX feed fallback, delayed options feed, staleness labels",
                "Explicitly no live capital; the execution interface exists so the constraint is architectural, not aspirational"
              ]}
            />
            <EntryP><a href="https://github.com/yushingtoncity/AEGIS">Repository</a></EntryP>
          </EntryBody>
        </Entry>

        <Entry title="Kalman pairs trading" meta="C++17, Eigen">
          <EntryBody>
            <EntryP>A 2-state Kalman filter tracks the intercept and hedge ratio of a simulated cointegrated pair; the innovation z-score drives a mean-reversion state machine, with rolling OLS as the baseline. Built for the tick path: zero heap allocations (enforceable with Eigen&rsquo;s runtime malloc assert), LDLT factor-and-solve instead of matrix inversion, Joseph-form covariance updates.</EntryP>
            <Facts
              items={[
                "On a deterministic synthetic tape with a mid-run hedge-ratio break, the filter tracks the true ratio with 7.8x less error than rolling OLS",
                "All numbers come from the simulator and the README says so; no market claims",
                "Streaming risk metrics in O(1) memory: Welford Sharpe, running max drawdown"
              ]}
            />
            <EntryP><a href="https://github.com/yushingtoncity/kalman-pairs-trading">Repository</a></EntryP>
          </EntryBody>
        </Entry>

        <Entry title="SMA backtest" meta="Python, first project">
          <EntryBody>
            <EntryP>The earliest project here, kept as a record of the starting point. One notebook: SPY 2015-2024, a 50-day moving average, long when price is above it, in cash otherwise, signals lagged one day. The strategy finished at 1.78x while buy-and-hold finished at 3.40x. No costs modeled, one parameter, in sample. It underperformed, and that is the result.</EntryP>
            <EntryP><a href="https://github.com/yushingtoncity/sma_backtest">Repository</a></EntryP>
          </EntryBody>
        </Entry>

        <Entry title="GARP policy letter" meta="Writing, model risk, July 2026">
          <EntryBody>
            <EntryP>A letter to the CEO of the Global Association of Risk Professionals proposing formal practitioner guidance on AI model diversity and vendor concentration disclosure, housed in GARP&rsquo;s existing Risk and AI certificate. The argument: firm-level specialist agents do not address industry-level concentration, because firms building excellent narrow tools on the same few foundational models still fail together. Concentration in AI architecture should be treated like concentration in positions: measured, disclosed, managed.</EntryP>
          </EntryBody>
        </Entry>
      </div>
    </Section>
  );
}

function AegisDiagram() {
  return (
    <svg
      className="diagram"
      viewBox="0 0 860 240"
      role="img"
      aria-label="Architecture diagram: config feeds data clients locked to the paper API, through a TTL cache into typed models consumed by CLI tools. A planned lane shows LLM proposals passing a deterministic policy gate before any executor."
    >
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path className="d-arrowhead" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      <g className="d-box">
        <rect x="10" y="40" width="130" height="52" />
        <rect x="190" y="40" width="160" height="52" />
        <rect x="400" y="40" width="120" height="52" />
        <rect x="570" y="40" width="130" height="52" />
        <rect x="750" y="40" width="100" height="52" />
        <rect className="d-planned" x="190" y="150" width="160" height="52" />
        <rect className="d-planned d-gate" x="400" y="150" width="160" height="52" />
        <rect className="d-planned" x="610" y="150" width="140" height="52" />
      </g>
      <g className="d-arrow" markerEnd="url(#arr)">
        <line x1="140" y1="66" x2="186" y2="66" />
        <line x1="350" y1="66" x2="396" y2="66" />
        <line x1="520" y1="66" x2="566" y2="66" />
        <line x1="700" y1="66" x2="746" y2="66" />
        <line className="d-planned" x1="350" y1="176" x2="396" y2="176" />
        <line className="d-planned" x1="560" y1="176" x2="606" y2="176" />
      </g>
      <g textAnchor="middle">
        <text x="75" y="63">config.yaml</text>
        <text className="d-sub" x="75" y="79">+ env</text>
        <text x="270" y="63">data clients</text>
        <text className="d-sub d-hot" x="270" y="79">paper=True, hardcoded</text>
        <text x="460" y="70">TTL cache</text>
        <text x="635" y="63">typed models</text>
        <text className="d-sub" x="635" y="79">every read stamped</text>
        <text x="800" y="63">CLIs</text>
        <text className="d-sub" x="800" y="79">check, snapshot</text>
        <text x="270" y="173">LLM brain</text>
        <text className="d-sub" x="270" y="189">proposes only</text>
        <text className="d-hot" x="480" y="173">policy gate</text>
        <text className="d-sub" x="480" y="189">deterministic, disposes</text>
        <text x="680" y="173">executor</text>
        <text className="d-sub" x="680" y="189">paper broker</text>
      </g>
      <text className="d-sub" textAnchor="end" x="178" y="180">planned (phases 2+):</text>
    </svg>
  );
}

function About() {
  return (
    <Section id="about">
      <H2>About</H2>
      <P>Finance student at George Mason University working on market microstructure. I work in Python (pandas, NumPy), C++ (Eigen), SQL and Git.</P>
      <P><a href="https://github.com/yushingtoncity">github.com/yushingtoncity</a></P>
    </Section>
  );
}
