"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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

interface BattleLibraryProps {
  battles: BattleCard[];
  categoryCounts: Array<{ name: string; count: number }>;
}

function normalize(value: string) {
  return value.toLowerCase();
}

export default function BattleLibrary({ battles, categoryCounts }: BattleLibraryProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");

  const filteredBattles = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return battles.filter((battle) => {
      const matchesCategory =
        activeCategory === "All" || battle.categories.some((category) => category === activeCategory);
      const haystack = [battle.title, battle.left, battle.right, ...battle.categories, ...battle.tags].join(" ").toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, battles, query]);

  const featuredBattle = filteredBattles[0] || null;
  const filterChips = [{ name: "All", count: battles.length }, ...categoryCounts];

  return (
    <>
      <section className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Click path optimizer</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-50 md:text-2xl">
                Find the closest-match battle in one click
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                The homepage chips now work like real filters. Visitors can narrow by category or search by tool name, then jump
                straight into the strongest comparison page.
              </p>
            </div>
            <label className="block w-full max-w-md">
              <span className="sr-only">Search battles</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ChatGPT, Webflow, Shopify, Systeme.io..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            {filterChips.map((chip) => {
              const isActive = chip.name === activeCategory;

              return (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => setActiveCategory(chip.name)}
                  className={`rounded-full border px-3 py-1.5 transition ${
                    isActive
                      ? "border-amber-300 bg-amber-400/15 text-amber-100"
                      : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-amber-400 hover:text-amber-200"
                  }`}
                >
                  {chip.name}
                  <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-[11px]">{chip.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-amber-400/20 bg-gradient-to-r from-slate-900/80 via-slate-900 to-amber-950/30 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Filtered outcome</p>
              <p className="mt-2 text-sm text-slate-300">
                Showing <span className="font-semibold text-slate-50">{filteredBattles.length}</span> battle
                {filteredBattles.length === 1 ? "" : "s"}
                {activeCategory !== "All" ? ` in ${activeCategory}` : " across all categories"}
                {query.trim() ? ` for “${query.trim()}”` : ""}.
              </p>
            </div>
            {featuredBattle ? (
              <Link
                href={featuredBattle.urlPath}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300"
              >
                Open best next click: {featuredBattle.left} vs {featuredBattle.right}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section id="battle-list" className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-50 md:text-lg">All comparison battles</h2>
            <p className="text-xs text-slate-400 md:text-sm">
              Search, filter, and jump into the comparison page that matches the buyer intent you already have.
            </p>
          </div>
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
            {filteredBattles.length} visible · {battles.length} total
          </span>
        </div>

        {filteredBattles.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <p className="text-sm font-semibold text-slate-100">No battles match this filter yet.</p>
            <p className="mt-2 text-sm text-slate-400">Try another tool name or switch back to All categories.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBattles.map((battle, index) => {
              const isHot = index < 6;
              const isFeatured = featuredBattle?.pageKey === battle.pageKey;

              return (
                <Link
                  key={battle.pageKey}
                  href={battle.urlPath}
                  className={`group flex flex-col justify-between rounded-2xl border bg-gradient-to-b p-4 shadow-lg shadow-black/40 transition hover:-translate-y-1 hover:bg-slate-900/90 ${
                    isFeatured
                      ? "border-amber-400/70 from-amber-950/30 to-slate-950/90 hover:shadow-amber-500/20"
                      : "border-slate-800 from-slate-900/80 to-slate-950/90 hover:border-amber-400/60"
                  }`}
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 font-medium text-slate-300">
                          #{String(index + 1).padStart(2, "0")} Match
                        </span>
                        {isHot ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                            <span>🔥</span>
                            High intent
                          </span>
                        ) : null}
                        {isFeatured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            <span>⚡</span>
                            Best next click
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-slate-500">{battle.pageKey}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-50 md:text-base">
                      <span className="truncate">{battle.left}</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-black tracking-wide text-slate-950">
                        VS
                      </span>
                      <span className="truncate">{battle.right}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-400 md:text-[13px]">{battle.title}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {battle.categories.slice(0, 2).map((category) => (
                        <span key={category} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-300">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Simulated {battle.votes.toLocaleString()} votes · filtered momentum</span>
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        click-ready
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 group-hover:w-[82%]" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Open the full comparison landing page</span>
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
        )}
      </section>
    </>
  );
}
