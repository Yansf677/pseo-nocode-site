"use client";

import { useMemo, useState } from "react";

interface ToolEntity {
  name: string;
  link?: string;
}

interface SummarySpec {
  winner_hint?: string;
}

interface InteractivePricingProps {
  toolA: ToolEntity;
  toolB: ToolEntity;
  summary: SummarySpec;
}

function buildPriceSignal(name: string, offset: number) {
  const seed = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), offset);
  return 19 + (seed % 7) * 10;
}

function getSafeHref(href?: string) {
  return href && href.trim().length > 0 ? href : "#comparison-table";
}

export default function InteractivePricing({ toolA, toolB, summary }: InteractivePricingProps) {
  const [teamSeats, setTeamSeats] = useState(8);

  const toolAPrice = useMemo(() => buildPriceSignal(toolA.name, 31), [toolA.name]);
  const toolBPrice = useMemo(() => buildPriceSignal(toolB.name, 47), [toolB.name]);

  const valueWinner = toolAPrice <= toolBPrice ? toolA : toolB;
  const premiumTool = toolAPrice > toolBPrice ? toolA : toolB;
  const monthlySpread = Math.abs(toolAPrice - toolBPrice) * teamSeats;
  const annualSpread = monthlySpread * 12;
  const toolATotal = toolAPrice * teamSeats;
  const toolBTotal = toolBPrice * teamSeats;

  return (
    <section
      id="pricing-calculator"
      className="glass-panel content-panel border-emerald-400/20 bg-emerald-950/10"
      aria-labelledby="pricing-pulse-heading"
    >
      <div className="section-header-row gap-4">
        <div>
          <h2 className="section-title">Budget pulse</h2>
          <p id="pricing-pulse-heading" className="section-heading">
            Estimate the monthly impact before opening a trial.
          </p>
        </div>
        <span className="badge">Interactive buyer model</span>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-slate-950/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Team size</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-slate-50">{teamSeats} seats</p>
            <p className="mt-1 text-sm text-slate-400">Move the slider to match your real rollout plan.</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Annual budget gap: <span className="text-lg font-black tabular-nums">${annualSpread.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="team-seats" className="sr-only">Team seats</label>
          <input
            id="team-seats"
            type="range"
            min={1}
            max={100}
            step={1}
            value={teamSeats}
            onChange={(event) => setTeamSeats(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-emerald-300"
          />
          <div className="mt-2 flex justify-between text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            <span>1 seat</span>
            <span>100 seats</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_1.15fr]">
        <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{toolA.name}</p>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-50">${toolAPrice}</p>
          <p className="mt-1 text-sm text-slate-400">Estimated per seat / month</p>
          <p className="mt-3 text-sm text-slate-300">
            Team total: <span className="font-semibold tabular-nums text-slate-100">${toolATotal.toLocaleString()}/mo</span>
          </p>
          <a href={getSafeHref(toolA.link)} className="mt-4 inline-flex rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200">
            Check {toolA.name}
          </a>
        </article>

        <article className="rounded-2xl border border-violet-300/20 bg-slate-950/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">{toolB.name}</p>
          <p className="mt-3 text-3xl font-black tabular-nums text-slate-50">${toolBPrice}</p>
          <p className="mt-1 text-sm text-slate-400">Estimated per seat / month</p>
          <p className="mt-3 text-sm text-slate-300">
            Team total: <span className="font-semibold tabular-nums text-slate-100">${toolBTotal.toLocaleString()}/mo</span>
          </p>
          <a href={getSafeHref(toolB.link)} className="mt-4 inline-flex rounded-full bg-violet-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-violet-200">
            Check {toolB.name}
          </a>
        </article>

        <article className="rounded-2xl border border-emerald-300/20 bg-gradient-to-br from-emerald-500/15 to-slate-950/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Value signal</p>
          <p className="mt-3 text-3xl font-black tabular-nums text-emerald-100">${monthlySpread.toLocaleString()}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            Potential monthly spread for a {teamSeats}-seat team. Start with {valueWinner.name} if budget is the main constraint, then validate whether {premiumTool.name} earns the premium through workflow fit.
          </p>
          <p className="mt-3 rounded-xl border border-emerald-300/15 bg-slate-950/50 p-3 text-sm text-emerald-50">
            If you roll this out to {teamSeats} seats, the gap compounds to <span className="font-semibold tabular-nums">${annualSpread.toLocaleString()} per year</span>.
          </p>
          {summary.winner_hint ? <p className="mt-3 rounded-xl bg-slate-950/50 p-3 text-sm text-slate-200">{summary.winner_hint}</p> : null}
        </article>
      </div>
    </section>
  );
}
