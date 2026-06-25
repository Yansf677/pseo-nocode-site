import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import BuyerIntentQuiz from "../components/BuyerIntentQuiz";
import BattleLibrary from "../components/BattleLibrary";
import manifest from "../../engine/output/manifest.json";
import { dedupeKeywords, siteUrl, toAbsoluteUrl } from "../lib/seo";

interface ManifestPage {
  page_key: string;
  url_path: string;
  title: string;
}

interface QuizCatalogEntry {
  toolName: string;
  compareUrl: string;
  compareTitle: string;
  affiliateUrl: string;
  affiliateLabel: string;
  category: string;
}

interface QuizPageSpec {
  url_path: string;
  seo?: { title?: string };
  entities?: {
    tool_a?: { name?: string; category?: string; link?: string };
    tool_b?: { name?: string; category?: string; link?: string };
  };
}

interface BattleCard {
  pageKey: string;
  urlPath: string;
  title: string;
  left: string;
  right: string;
  categories: string[];
  votes: number;
  tags: string[];
}

const QUIZ_TOOL_NAMES = [
  "Carrd",
  "Framer",
  "Webflow",
  "Systeme.io",
  "Softr",
  "Glide",
  "Bubble",
  "Dify",
  "Shopify",
  "Ecwid",
  "BigCommerce"
] as const;

const QUIZ_DATA_ROOT = path.join(process.cwd(), "../engine/output");

function loadQuizCatalog(): Record<string, QuizCatalogEntry> {
  try {
    const toolSet = new Set<string>(QUIZ_TOOL_NAMES);
    const catalog: Record<string, QuizCatalogEntry> = {};
    const files = fs
      .readdirSync(QUIZ_DATA_ROOT)
      .filter((file) => file.endsWith(".json") && file !== "manifest.json");

    for (const file of files) {
      const raw = fs.readFileSync(path.join(QUIZ_DATA_ROOT, file), "utf8");
      const spec = JSON.parse(raw) as QuizPageSpec;
      const entities = [spec.entities?.tool_a, spec.entities?.tool_b];

      for (const entity of entities) {
        const toolName = entity?.name?.trim();
        if (!toolName || !toolSet.has(toolName) || catalog[toolName]) {
          continue;
        }

        catalog[toolName] = {
          toolName,
          compareUrl: spec.url_path,
          compareTitle: spec.seo?.title || `${toolName} comparison`,
          affiliateUrl: entity?.link?.trim() || spec.url_path,
          affiliateLabel: `Visit ${toolName}`,
          category: entity?.category?.trim() || "No-code software"
        };
      }
    }

    return catalog;
  } catch {
    return {};
  }
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
  const base = 320 + (index * 47) % 480;
  return base;
}

function loadBattleCards(sourcePages: ManifestPage[]): BattleCard[] {
  try {
    return sourcePages.map((page, index) => {
      const specPath = path.join(QUIZ_DATA_ROOT, `${page.page_key}.json`);
      const raw = fs.readFileSync(specPath, "utf8");
      const spec = JSON.parse(raw) as QuizPageSpec;
      const { left, right } = parseBattleTitle(page.title);
      const categories = Array.from(
        new Set(
          [spec.entities?.tool_a?.category, spec.entities?.tool_b?.category]
            .map((category) => category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      );

      return {
        pageKey: page.page_key,
        urlPath: page.url_path,
        title: page.title,
        left,
        right,
        categories,
        votes: getVotesForIndex(index + 3) + 120,
        tags: [left, right, ...categories]
      };
    });
  } catch {
    return sourcePages.map((page, index) => {
      const { left, right } = parseBattleTitle(page.title);

      return {
        pageKey: page.page_key,
        urlPath: page.url_path,
        title: page.title,
        left,
        right,
        categories: [],
        votes: getVotesForIndex(index + 3) + 120,
        tags: [left, right]
      };
    });
  }
}

function buildCategoryCounts(battles: BattleCard[]) {
  const counts = new Map<string, number>();

  for (const battle of battles) {
    for (const category of battle.categories) {
      counts.set(category, (counts.get(category) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

const trendingPages = pages.slice(0, 3);
const quizCatalog = loadQuizCatalog();
const battleCards = loadBattleCards(pages);
const battleCategoryCounts = buildCategoryCounts(battleCards);

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

        <BuyerIntentQuiz catalog={quizCatalog} />
        <BattleLibrary battles={battleCards} categoryCounts={battleCategoryCounts} />
      </main>
    </>
  );
}
