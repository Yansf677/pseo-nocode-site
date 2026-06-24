interface ToolEntity {
  name: string;
  link?: string;
}

export default function ChooseByIntent({
  toolA,
  toolB
}: {
  toolA: ToolEntity;
  toolB: ToolEntity;
}) {
  return (
    <section className="mt-6">
      <div className="glass-panel">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="section-title">Choose by intent</p>
            <h2 className="section-heading">Pick the fastest next step for your goal.</h2>
          </div>
          <span className="badge">3 quick paths</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <a
            href={toolA.link || "#comparison-table"}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-cyan-300/20 bg-slate-950/55 p-4 transition hover:border-cyan-200/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">I want the fastest yes</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">Open {toolA.name} and start a trial now.</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950">
              Open {toolA.name}
              <span aria-hidden="true">↗</span>
            </span>
          </a>

          <a
            href={toolB.link || "#comparison-table"}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-violet-300/20 bg-slate-950/55 p-4 transition hover:border-violet-200/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-200">I need a safer fit</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">Go with {toolB.name} if you want fewer surprises.</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-300 px-4 py-2 text-sm font-bold text-slate-950">
              Open {toolB.name}
              <span aria-hidden="true">↗</span>
            </span>
          </a>

          <a
            href="#pricing-calculator"
            className="rounded-2xl border border-emerald-300/20 bg-slate-950/55 p-4 transition hover:border-emerald-200/40"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Still comparing budget</p>
            <p className="mt-2 text-sm leading-6 text-slate-100">Jump to the pricing calculator and run your numbers.</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-4 py-2 text-sm font-bold text-slate-950">
              Go to calculator
              <span aria-hidden="true">↓</span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
