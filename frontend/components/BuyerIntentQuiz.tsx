"use client";

import { useMemo, useState } from "react";

type PrimaryGoal = "landing page" | "internal tool" | "SaaS" | "e-commerce";
type Priority = "speed" | "cost" | "customization" | "AI capability";
type Stage = "exploring" | "already using a tool" | "ready to migrate";

interface QuizCatalogEntry {
  toolName: string;
  compareUrl: string;
  compareTitle: string;
  affiliateUrl: string;
  affiliateLabel: string;
  category: string;
}

interface QuizResult {
  toolName: string;
  compareUrl: string;
  compareTitle: string;
  affiliateUrl: string;
  affiliateLabel: string;
  reason: string;
  bestFor: string;
  stageNote: string;
  scoreLabel: string;
}

const QUESTION_STEPS = [
  {
    id: "goal",
    label: "What are you mainly trying to build?",
    options: ["landing page", "internal tool", "SaaS", "e-commerce"] as PrimaryGoal[]
  },
  {
    id: "priority",
    label: "What matters most right now?",
    options: ["speed", "cost", "customization", "AI capability"] as Priority[]
  },
  {
    id: "stage",
    label: "Which stage are you in?",
    options: ["exploring", "already using a tool", "ready to migrate"] as Stage[]
  }
] as const;

const DEFAULT_TOOL_BY_GOAL: Record<PrimaryGoal, string> = {
  "landing page": "Framer",
  "internal tool": "Softr",
  SaaS: "Bubble",
  "e-commerce": "Shopify"
};

const TOOL_BY_GOAL_AND_PRIORITY: Record<PrimaryGoal, Record<Priority, string>> = {
  "landing page": {
    speed: "Carrd",
    cost: "Carrd",
    customization: "Webflow",
    "AI capability": "Framer"
  },
  "internal tool": {
    speed: "Softr",
    cost: "Glide",
    customization: "Bubble",
    "AI capability": "Dify"
  },
  SaaS: {
    speed: "Bubble",
    cost: "Bubble",
    customization: "Bubble",
    "AI capability": "Dify"
  },
  "e-commerce": {
    speed: "Shopify",
    cost: "Ecwid",
    customization: "BigCommerce",
    "AI capability": "Shopify"
  }
};

const STAGE_TWEAKS: Partial<Record<PrimaryGoal, Partial<Record<Stage, string>>>> = {
  "landing page": {
    exploring: "Framer",
    "ready to migrate": "Webflow"
  },
  "internal tool": {
    exploring: "Softr",
    "ready to migrate": "Bubble"
  },
  SaaS: {
    exploring: "Bubble",
    "ready to migrate": "Bubble"
  },
  "e-commerce": {
    exploring: "Shopify",
    "ready to migrate": "BigCommerce"
  }
};

function buildReason(goal: PrimaryGoal, priority: Priority, toolName: string) {
  const reasons: Record<PrimaryGoal, Record<Priority, string>> = {
    "landing page": {
      speed: `${toolName} is the fastest path when your goal is shipping a polished landing page this week.`,
      cost: `${toolName} keeps launch costs light while still giving you a conversion-ready landing page.`,
      customization: `${toolName} gives you more layout control when the page needs to feel uniquely on-brand.`,
      "AI capability": `${toolName} is the better bet when you want a modern builder with AI-assisted creation in the mix.`
    },
    "internal tool": {
      speed: `${toolName} is ideal when you want an internal tool live quickly without a long setup cycle.`,
      cost: `${toolName} is the leaner option when budget pressure matters as much as shipping utility fast.`,
      customization: `${toolName} is the stronger pick if your internal workflow needs deeper logic and custom behavior.`,
      "AI capability": `${toolName} stands out when your internal tool roadmap includes AI copilots, automation, or agent workflows.`
    },
    SaaS: {
      speed: `${toolName} is the best shortcut when you want to validate a SaaS idea before overbuilding.`,
      cost: `${toolName} gives you the best balance between product flexibility and keeping early burn low.`,
      customization: `${toolName} is the strongest fit when your SaaS needs more product logic, workflows, and room to grow.`,
      "AI capability": `${toolName} makes more sense when the product itself needs AI workflows to be part of the offer.`
    },
    "e-commerce": {
      speed: `${toolName} gets you to a sellable storefront fastest when launch speed matters most.`,
      cost: `${toolName} is a smart choice if you want to keep store software costs under control early on.`,
      customization: `${toolName} gives you more room to tailor the storefront and operations around your catalog.`,
      "AI capability": `${toolName} is the more practical choice when you want strong commerce operations plus fast experimentation.`
    }
  };

  return reasons[goal][priority];
}

function buildBestFor(goal: PrimaryGoal, priority: Priority, stage: Stage) {
  return `${goal} builders who care most about ${priority} and are currently ${stage}.`;
}

function buildStageNote(stage: Stage, toolName: string) {
  if (stage === "exploring") {
    return `Start with ${toolName} to narrow your options fast, then open the comparison for trade-offs.`;
  }

  if (stage === "already using a tool") {
    return `Use the side-by-side comparison to see whether ${toolName} clearly beats your current setup before switching.`;
  }

  return `${toolName} is worth prioritizing now because you sound close to a migration or purchase decision.`;
}

function getToolEntry(catalog: Record<string, QuizCatalogEntry>, toolName: string, fallbackGoal: PrimaryGoal) {
  return catalog[toolName] || catalog[DEFAULT_TOOL_BY_GOAL[fallbackGoal]] || Object.values(catalog)[0] || null;
}

export default function BuyerIntentQuiz({ catalog }: { catalog: Record<string, QuizCatalogEntry> }) {
  const [goal, setGoal] = useState<PrimaryGoal | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [stage, setStage] = useState<Stage | null>(null);

  const currentStep = !goal ? 0 : !priority ? 1 : !stage ? 2 : 3;

  const result = useMemo<QuizResult | null>(() => {
    if (!goal || !priority || !stage) {
      return null;
    }

    const baseTool = TOOL_BY_GOAL_AND_PRIORITY[goal][priority];
    const tweakedTool = STAGE_TWEAKS[goal]?.[stage] ?? baseTool;
    const finalTool = priority === "customization" || priority === "AI capability" ? baseTool : tweakedTool;
    const entry = getToolEntry(catalog, finalTool, goal);

    if (!entry) {
      return null;
    }

    return {
      ...entry,
      reason: buildReason(goal, priority, entry.toolName),
      bestFor: buildBestFor(goal, priority, stage),
      stageNote: buildStageNote(stage, entry.toolName),
      scoreLabel: `${goal} · ${priority} · ${stage}`
    };
  }, [catalog, goal, priority, stage]);

  const answerPillClass =
    "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-300/60";

  if (Object.keys(catalog).length === 0) {
    return null;
  }

  return (
    <section className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-950 p-5 shadow-xl shadow-emerald-500/10">
            <span className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Help Me Choose
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              Answer 3 quick questions. Get one clear tool recommendation.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              This quiz turns StackCompare from a browsing layer into a decision layer. Pick your goal, priority, and stage — we will point you to the best-fit tool, why it fits, and the fastest CTA.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-slate-900/80 px-3 py-1">1. Goal</span>
              <span className="rounded-full bg-slate-900/80 px-3 py-1">2. Priority</span>
              <span className="rounded-full bg-slate-900/80 px-3 py-1">3. Stage</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-900/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-300 transition-all duration-300"
                style={{ width: `${Math.max(20, (currentStep / 3) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              {currentStep < 3 ? `Step ${currentStep + 1} of 3` : "Recommendation ready"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-black/20">
            {currentStep === 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Question 1</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-50">{QUESTION_STEPS[0].label}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {QUESTION_STEPS[0].options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${answerPillClass} border-slate-800 bg-slate-950/70 text-slate-100 hover:border-emerald-300/70 hover:bg-slate-900`}
                      onClick={() => setGoal(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Question 2</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-50">{QUESTION_STEPS[1].label}</h3>
                  </div>
                  <button type="button" className="text-sm text-slate-400 hover:text-slate-200" onClick={() => setGoal(null)}>
                    Back
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {QUESTION_STEPS[1].options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${answerPillClass} border-slate-800 bg-slate-950/70 text-slate-100 hover:border-emerald-300/70 hover:bg-slate-900`}
                      onClick={() => setPriority(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Question 3</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-50">{QUESTION_STEPS[2].label}</h3>
                  </div>
                  <button type="button" className="text-sm text-slate-400 hover:text-slate-200" onClick={() => setPriority(null)}>
                    Back
                  </button>
                </div>
                <div className="mt-4 grid gap-3">
                  {QUESTION_STEPS[2].options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${answerPillClass} border-slate-800 bg-slate-950/70 text-slate-100 hover:border-emerald-300/70 hover:bg-slate-900`}
                      onClick={() => setStage(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {currentStep === 3 && result ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1">Recommended tool</span>
                  <span className="rounded-full bg-slate-950/70 px-3 py-1 text-slate-300">{result.scoreLabel}</span>
                </div>
                <div className="rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/50 p-5">
                  <p className="text-sm text-slate-400">Best match</p>
                  <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-50">{result.toolName}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-200">{result.reason}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Best for</p>
                      <p className="mt-2 text-sm text-slate-200">{result.bestFor}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">Why now</p>
                      <p className="mt-2 text-sm text-slate-200">{result.stageNote}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={result.affiliateUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                    >
                      {result.affiliateLabel}
                      <span aria-hidden="true">↗</span>
                    </a>
                    <a
                      href={result.compareUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
                    >
                      Read the comparison
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Compare page: {result.compareTitle}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    onClick={() => setStage(null)}
                  >
                    Change stage
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    onClick={() => {
                      setGoal(null);
                      setPriority(null);
                      setStage(null);
                    }}
                  >
                    Restart quiz
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
