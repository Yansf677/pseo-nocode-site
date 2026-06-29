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

interface CategoryCount {
  name: string;
  count: number;
}

interface HomeGrowthSectionsProps {
  battles: BattleCard[];
  categoryCounts: CategoryCount[];
}

interface FaqItem {
  question: string;
  answer: string;
}

function formatCategoryLabel(category: string) {
  return category.trim() || "Software";
}

function buildCategoryClusters(battles: BattleCard[], categoryCounts: CategoryCount[]) {
  return categoryCounts.slice(0, 4).map((category) => ({
    name: category.name,
    count: category.count,
    battles: battles.filter((battle) => battle.categories.includes(category.name)).slice(0, 4)
  }));
}

function buildBuyerPathways(battles: BattleCard[]) {
  const pathways = [
    {
      label: "Fast launch",
      description: "Start with builders and storefront tools that help buyers ship quickly.",
      match: (battle: BattleCard) => battle.tags.some((tag) => ["Carrd", "Framer", "Shopify"].includes(tag))
    },
    {
      label: "Customization first",
      description: "Jump into comparisons where flexibility and workflow depth matter most.",
      match: (battle: BattleCard) => battle.tags.some((tag) => ["Webflow", "Bubble", "BigCommerce"].includes(tag))
    },
    {
      label: "AI workflows",
      description: "Explore pages where AI capability is part of the buying decision, not a side note.",
      match: (battle: BattleCard) => battle.tags.some((tag) => ["Dify", "Framer", "ChatGPT"].includes(tag))
    }
  ];

  return pathways
    .map((pathway) => ({
      ...pathway,
      battles: battles.filter(pathway.match).slice(0, 3)
    }))
    .filter((pathway) => pathway.battles.length > 0);
}

export default function HomeGrowthSections({ battles, categoryCounts }: HomeGrowthSectionsProps) {
  const categoryClusters = buildCategoryClusters(battles, categoryCounts);
  const buyerPathways = buildBuyerPathways(battles);
  const faqItems: FaqItem[] = [
    {
      question: "What is StackCompare used for?",
      answer:
        "StackCompare helps buyers compare software tools side by side before clicking through to a vendor. Each page is built for a high-intent A vs B decision."
    },
    {
      question: "How should I choose between two tools?",
      answer:
        "Start with the pages that match your category, then use the decision cards, pricing sections, and buyer-fit summaries to narrow down the better option for your workflow."
    },
    {
      question: "Are these comparison pages useful before I switch tools?",
      answer:
        "Yes. The best use case is right before purchase, migration, or renewal, when you already know the short list and want clearer trade-offs."
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="border-t border-slate-800 bg-slate-950/60">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">SEO growth layer</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              Explore the best software comparisons by category and buyer stage
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
              This section adds more crawlable paths for visitors who already know their category, while giving buyers a cleaner shortcut to the most relevant comparison pages.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {categoryClusters.map((cluster) => (
              <article key={cluster.name} className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      {formatCategoryLabel(cluster.name)}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-50">
                      Top {formatCategoryLabel(cluster.name)} comparison pages
                    </h3>
                  </div>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    {cluster.count} live pages
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Browse the strongest internal-link cluster for {formatCategoryLabel(cluster.name).toLowerCase()} buyers.
                </p>
                <div className="mt-4 space-y-3">
                  {cluster.battles.map((battle, index) => (
                    <Link
                      key={battle.pageKey}
                      href={battle.urlPath}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 transition hover:border-cyan-300/60 hover:bg-slate-950"
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {index === 0 ? "Featured path" : `Path ${index + 1}`}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {battle.left} vs {battle.right}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{battle.title}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                        Open page
                        <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Buyer journey shortcuts</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
                Jump to the next comparison based on what you care about most
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
                These pathways tighten the route from homepage visit to comparison click by packaging the most common decision patterns into simple next-step groups.
              </p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
              {battles.length} comparison pages in the index
            </span>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {buyerPathways.map((pathway) => (
              <article key={pathway.label} className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-lg shadow-black/20">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{pathway.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{pathway.description}</p>
                <div className="mt-5 space-y-3">
                  {pathway.battles.map((battle) => (
                    <Link
                      key={battle.pageKey}
                      href={battle.urlPath}
                      className="block rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-amber-300/60 hover:text-white"
                    >
                      <span className="font-semibold text-slate-100">{battle.left} vs {battle.right}</span>
                      <span className="mt-1 block text-xs text-slate-400">{battle.title}</span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 bg-slate-950/70">
        <div className="mx-auto max-w-4xl px-4 py-10 md:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Search-ready FAQ</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              Questions buyers ask before they open a comparison page
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">
              This FAQ supports long-tail intent, improves homepage topical depth, and helps first-time visitors understand how to use the comparison hub.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <details key={item.question} className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-5 open:border-emerald-300/40 open:bg-slate-900">
                <summary className="cursor-pointer list-none pr-8 text-base font-semibold text-slate-50 marker:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
