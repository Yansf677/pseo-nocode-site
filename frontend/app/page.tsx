import type { Metadata } from "next";
import Link from "next/link";
import BuyerIntentQuiz from "../components/BuyerIntentQuiz";
import manifest from "../../engine/output/manifest.json";
import { dedupeKeywords, siteUrl, toAbsoluteUrl } from "../lib/seo";

interface ManifestPage {
  page_key: string;
  url_path: string;
  title: string;
}

const pages = ((manifest as { pages?: ManifestPage[] }).pages ?? []) as ManifestPage[];
const pageTitle = "Best Software Comparison Battles – Community Hub";
const pageDescription =
  "Discover crowd-favorite A vs B battles across AI, SaaS, productivity, design, and trending software matchups.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: "/"
  },
  keywords: dedupeKeywords([
    "software comparison hub",
    "compare software tools",
    "best software alternatives",
    "community vote battles",
    ...pages.flatMap((page) => page.title.split(/[:,-]/).map((item) => item.trim()))
  ]),
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: siteUrl,
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription
  }
};

function parseBattleTitle(title: string): { left: string; right: string } {
  const vsMatch = title.split(/\s+vs\.?\s+|\s+VS\s+|\s+Vs\s+/i);
  if (vsMatch.length >= 2) {
    return { left: vsMatch[0].trim(), right: vsMatch[1].split(/[:,-]/)[0].trim() };
  }
  return { left: title, right: "Alternative" };
}

function getVotesForIndex(index: number): number {
  // deterministic pseudo-random but stable per index
  const base = 320 + (index * 47) % 480;
  return base;
}

const trendingPages = pages.slice(0, 3);

export default function HomePage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Software comparison index",
    url: siteUrl,
    numberOfItems: pages.length,
    itemListElement: pages.map((page, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: page.title,
      url: toAbsoluteUrl(page.url_path)
    }))
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tool Comparison",
    url: siteUrl
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationJsonLd, itemListJsonLd])
        }}
      />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/0">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:py-14">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1">
                  <span className="text-lg">🦑</span>
                  <span className="uppercase tracking-wide">StackCompare Community</span>
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                  {pages.length} live battles · Programmatic SEO
                </span>
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl lg:text-5xl">
                Find the right software battle before you choose a tool.
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 md:text-base">
                Browse high-intent AI, SaaS, productivity, design, and website builder comparisons with vote-style momentum and clear next steps.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {pages[0] ? (
                  <Link
                    href={pages[0].url_path}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/40 transition hover:bg-amber-300"
                  >
                    Open the hottest battle
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
                <a
                  href="#battle-list"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900"
                >
                  Browse all battles
                </a>
              </div>
            </div>

            <div className="mt-4 w-full max-w-md md:mt-0">
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 p-4 shadow-xl shadow-amber-500/30">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live Vote Battle momentum
                </p>
                <div className="mt-3 space-y-3">
                  {trendingPages.map((page, index) => {
                    const { left, right } = parseBattleTitle(page.title);
                    const votes = getVotesForIndex(index + 1) + 180;
                    const leftVotes = Math.round(votes * (0.45 + index * 0.07));
                    const rightVotes = votes - leftVotes;
                    const leftPct = Math.round((leftVotes / votes) * 100);

                    return (
                      <Link
                        key={page.page_key}
                        href={page.url_path}
                        className="group rounded-xl border border-amber-400/30 bg-slate-950/80 p-3 transition hover:border-amber-300 hover:bg-slate-900/80"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            <span className="text-xs">🔥</span>
                            Trending Battle #{index + 1}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Simulated {votes.toLocaleString()} votes
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
                          <span className="truncate">{left}</span>
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-400/90 px-2 py-0.5 text-[11px] font-black tracking-wide text-slate-950">
                            VS
                          </span>
                          <span className="truncate">{right}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all group-hover:scale-x-[1.02]"
                            style={{ width: `${leftPct}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {left} · {leftVotes.toLocaleString()} votes
                          </span>
                          <span>
                            {right} · {rightVotes.toLocaleString()} votes
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <BuyerIntentQuiz pages={pages} />

        <section className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
              <span className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-200">All</span>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-sky-400 hover:text-sky-200">
                AI
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-violet-400 hover:text-violet-200">
                AI Agents
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-emerald-400 hover:text-emerald-200">
                Productivity
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-fuchsia-400 hover:text-fuchsia-200">
                Design
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-amber-400 hover:text-amber-200">
                Website Builder
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-cyan-400 hover:text-cyan-200">
                Automation
              </button>
              <button className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-slate-300 hover:border-rose-400 hover:text-rose-200">
                SaaS
              </button>
            </div>
            <p className="text-xs text-slate-400 md:text-sm">
              Category chips help visitors scan the comparison library faster.
            </p>
          </div>
        </section>

        <section id="battle-list" className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-50 md:text-lg">
                All comparison battles
              </h2>
              <p className="text-xs text-slate-400 md:text-sm">
                Scan the cards like a community feed, then click into the matchups that fit your buying intent.
              </p>
            </div>
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
              {pages.length} battles · simulated vote volume {(
                pages.length * 520
              ).toLocaleString()}+
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pages.map((page, index) => {
              const { left, right } = parseBattleTitle(page.title);
              const votes = getVotesForIndex(index + 3) + 120;
              const isHot = index < 6;
              const isNew = index < 3;

              return (
                <Link
                  key={page.page_key}
                  href={page.url_path}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:border-amber-400/60 hover:bg-slate-900/90 hover:shadow-amber-500/20"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 font-medium text-slate-300">
                          #{String(index + 1).padStart(2, "0")} Battle
                        </span>
                        {isHot && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                            <span>🔥</span>
                            Hot
                          </span>
                        )}
                        {isNew && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            <span>✨</span>
                            Fresh
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-200">
                          <span>🗳</span>
                          Vote Battle
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{page.page_key}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-50 md:text-base">
                          <span className="truncate">{left}</span>
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black tracking-wide text-slate-950">
                            VS
                          </span>
                          <span className="truncate">{right}</span>
                        </div>
                        <p className="line-clamp-2 text-xs text-slate-400 md:text-[13px]">
                          {page.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Simulated {votes.toLocaleString()} votes · community momentum</span>
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        high-click intent
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 group-hover:w-[72%]" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Click the card to view the full comparison landing page</span>
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        <span className="text-xs">Details</span>
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
