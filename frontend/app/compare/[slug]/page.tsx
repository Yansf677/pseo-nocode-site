import type { Metadata } from "next";
import Link from "next/link";
import path from "node:path";
import fs from "node:fs";
import { dedupeKeywords, stripHtml, toAbsoluteUrl } from "../../../lib/seo";

interface SeoSpec {
  title: string;
  meta_description?: string;
  canonical_url?: string;
}

interface HeroSpec {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primary_cta?: { label: string; href: string };
  secondary_cta?: { label: string; href: string };
  badges?: string[];
}

interface SummarySpec {
  winner_hint?: string;
  best_for_a?: string;
  best_for_b?: string;
  quick_take?: string;
}

interface EntitiesSpec {
  tool_a: {
    name: string;
    slug?: string;
    category?: string;
    commission?: string;
    link?: string;
  };
  tool_b: {
    name: string;
    slug?: string;
    category?: string;
    commission?: string;
    link?: string;
  };
}

interface ComparisonTableRow {
  dimension: string;
  tool_a: string;
  tool_b: string;
}

interface ComparisonTableSpec {
  columns: string[];
  rows: ComparisonTableRow[];
}

interface SectionIntro {
  type: "intro";
  data: { paragraphs: string[] };
}

interface SectionHighlights {
  type: "highlights";
  data: { tool_a: string[]; tool_b: string[] };
}

interface SectionVerdict {
  type: "verdict";
  data: { headline: string; summary: string };
}

interface SectionProsCons {
  type: "pros_cons";
  data: {
    tool_a: { pros: string[]; cons: string[] };
    tool_b: { pros: string[]; cons: string[] };
  };
}

interface SectionFaqItem {
  question: string;
  answer: string;
}

interface SectionFaq {
  type: "faq";
  data: { items: SectionFaqItem[] };
}

interface SectionRelatedLink {
  label: string;
  href: string;
}

interface SectionRelatedComparisons {
  type: "related_comparisons";
  data: { links: SectionRelatedLink[] };
}

type SectionSpec =
  | SectionIntro
  | SectionVerdict
  | SectionProsCons
  | SectionHighlights
  | SectionFaq
  | SectionRelatedComparisons;

interface PageSpec {
  page_type: string;
  template_family: string;
  page_key: string;
  url_path: string;
  locale: string;
  seo: SeoSpec;
  hero: HeroSpec;
  summary: SummarySpec;
  entities: EntitiesSpec;
  comparison_table?: ComparisonTableSpec;
  sections?: SectionSpec[];
  taxonomy?: {
    primary_keyword?: string;
    secondary_keywords?: string[];
    cluster?: string;
  };
}

const DATA_ROOT = path.join(process.cwd(), "../engine/output");

function loadPageSpec(slug: string): PageSpec | null {
  try {
    const fileName = `${slug}.json`;
    const fullPath = path.join(DATA_ROOT, fileName);
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw) as PageSpec;
  } catch {
    return null;
  }
}

function buildComparisonMetadata(spec: PageSpec): Metadata {
  const canonical = spec.seo.canonical_url || toAbsoluteUrl(spec.url_path);
  const title = spec.seo.title;
  const description =
    spec.seo.meta_description ||
    `${spec.entities.tool_a.name} vs ${spec.entities.tool_b.name}: compare pricing, features, buyer fit, and key differences.`;
  const keywords = dedupeKeywords([
    spec.taxonomy?.primary_keyword,
    ...(spec.taxonomy?.secondary_keywords ?? []),
    `${spec.entities.tool_a.name} vs ${spec.entities.tool_b.name}`,
    `${spec.entities.tool_a.name} alternative`,
    `${spec.entities.tool_b.name} alternative`,
    spec.entities.tool_a.category,
    spec.entities.tool_b.category,
    spec.taxonomy?.cluster
  ]);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      locale: spec.locale === "en" ? "en_US" : spec.locale
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export function generateMetadata({
  params
}: {
  params: { slug: string };
}): Metadata {
  const spec = loadPageSpec(params.slug);
  if (!spec) {
    return {
      title: "Comparison not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return buildComparisonMetadata(spec);
}

function getToolPrefix(index: "A" | "B", name: string) {
  return `${index} · ${name}`;
}

function buildComparisonJsonLd(spec: PageSpec) {
  const canonical = spec.seo.canonical_url || toAbsoluteUrl(spec.url_path);
  const faqSection = spec.sections?.find(
    (section): section is SectionFaq => section.type === "faq"
  );

  const mainEntity = [
    {
      "@type": "SoftwareApplication",
      name: spec.entities.tool_a.name,
      applicationCategory: spec.entities.tool_a.category,
      offers: spec.entities.tool_a.link
        ? {
            "@type": "Offer",
            url: spec.entities.tool_a.link,
            description: spec.entities.tool_a.commission
          }
        : undefined
    },
    {
      "@type": "SoftwareApplication",
      name: spec.entities.tool_b.name,
      applicationCategory: spec.entities.tool_b.category,
      offers: spec.entities.tool_b.link
        ? {
            "@type": "Offer",
            url: spec.entities.tool_b.link,
            description: spec.entities.tool_b.commission
          }
        : undefined
    }
  ].map((item) => JSON.parse(JSON.stringify(item)));

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: spec.seo.title,
      description: spec.seo.meta_description,
      inLanguage: spec.locale,
      url: canonical,
      mainEntity,
      about: [spec.entities.tool_a.name, spec.entities.tool_b.name],
      keywords: dedupeKeywords([
        spec.taxonomy?.primary_keyword,
        ...(spec.taxonomy?.secondary_keywords ?? []),
        spec.entities.tool_a.category,
        spec.entities.tool_b.category
      ])
    }
  ];

  if (faqSection?.data.items.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqSection.data.items.map((item) => ({
        "@type": "Question",
        name: stripHtml(item.question),
        acceptedAnswer: {
          "@type": "Answer",
          text: stripHtml(item.answer)
        }
      }))
    });
  }

  return jsonLd;
}

export default function ComparePage({
  params
}: {
  params: { slug: string };
}) {
  const spec = loadPageSpec(params.slug);

  if (!spec) {
    return (
      <main className="compare-page compare-page-empty">
        <section className="glass-panel empty-state-panel">
          <p className="badge">Comparison lookup</p>
          <h1 className="page-title">Comparison not found</h1>
          <p className="page-description">
            We couldn&apos;t find a comparison page for this slug.
          </p>
          <Link href="/" className="cta-secondary cta-inline">
            ← Back to index
          </Link>
        </section>
      </main>
    );
  }

  const { hero, summary, entities, comparison_table, sections } = spec;
  const heroMetrics = [
    `${entities.tool_a.category ?? "General"} · ${entities.tool_a.commission ?? "Flexible payout"}`,
    `${entities.tool_b.category ?? "General"} · ${entities.tool_b.commission ?? "Flexible payout"}`,
    summary.winner_hint ? `Quick winner: ${summary.winner_hint}` : "Side-by-side buyer guide"
  ];
  const comparisonJsonLd = buildComparisonJsonLd(spec);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />

      <main className="compare-page">
        <header className="hero-shell compare-hero">
          <div className="hero-badge-row hero-badge-row-wrap">
            <p className="badge">Programmatic SEO · A vs B</p>
            {hero.badges?.map((badge) => (
              <span key={badge} className="badge">
                {badge}
              </span>
            ))}
          </div>

          <div className="compare-hero-layout">
            <div className="compare-hero-copy">
              {hero.eyebrow ? <p className="hero-eyebrow">{hero.eyebrow}</p> : null}
              <h1 className="page-title compare-title">
                <span className="gradient-title">{hero.headline}</span>
              </h1>
              {hero.subheadline ? (
                <p className="page-description compare-subheadline">{hero.subheadline}</p>
              ) : null}
              <div className="metric-pill-row">
                {heroMetrics.map((metric) => (
                  <span key={metric} className="metric-pill">
                    ✦ {metric}
                  </span>
                ))}
              </div>
            </div>

            <div className="compare-hero-actions">
              {hero.primary_cta ? (
                <a href={hero.primary_cta.href} className="cta-primary">
                  {hero.primary_cta.label}
                  <span aria-hidden="true">→</span>
                </a>
              ) : null}
              {hero.secondary_cta ? (
                <a href={hero.secondary_cta.href} className="cta-secondary">
                  {hero.secondary_cta.label}
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <section className="compare-overview-grid">
          <div className="glass-panel insight-panel">
            <h2 className="section-title">Quick take</h2>
            {summary.winner_hint ? <p className="winner-note">{summary.winner_hint}</p> : null}
            {summary.quick_take ? <p className="section-body">{summary.quick_take}</p> : null}
          </div>

          <div className="compare-bestfor-grid">
            <div className="glass-panel compare-side-card compare-side-card-a">
              <h3 className="section-title">Best for</h3>
              <div className="tool-chip tool-chip-a">
                <span className="tool-chip-badge">A</span>
                <span>{getToolPrefix("A", entities.tool_a.name)}</span>
              </div>
              {summary.best_for_a ? <p className="section-body">{summary.best_for_a}</p> : null}
            </div>
            <div className="glass-panel compare-side-card compare-side-card-b">
              <h3 className="section-title">Best for</h3>
              <div className="tool-chip tool-chip-b">
                <span className="tool-chip-badge">B</span>
                <span>{getToolPrefix("B", entities.tool_b.name)}</span>
              </div>
              {summary.best_for_b ? <p className="section-body">{summary.best_for_b}</p> : null}
            </div>
          </div>
        </section>

        {comparison_table ? (
          <section className="glass-panel comparison-table-panel">
            <div className="section-header-row">
              <div>
                <h2 className="section-title">At a glance</h2>
                <p className="section-heading">Side-by-side comparison</p>
              </div>
              <div className="table-legend">
                <span className="table-legend-a">A: {entities.tool_a.name}</span>
                <span className="table-legend-b">B: {entities.tool_b.name}</span>
              </div>
            </div>
            <div className="table-scroll-shell">
              <table className="table comparison-table">
                <thead>
                  <tr>
                    {comparison_table.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison_table.rows.map((row) => (
                    <tr key={row.dimension}>
                      <td>{row.dimension}</td>
                      <td>{row.tool_a}</td>
                      <td>{row.tool_b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {sections?.map((section) => {
          if (section.type === "intro") {
            return (
              <section key={section.type} className="glass-panel content-panel">
                <h2 className="section-title">Overview</h2>
                <h3 className="section-heading">
                  How {entities.tool_a.name} compares to {entities.tool_b.name}
                </h3>
                <div className="section-body prose-block">
                  {section.data.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            );
          }

          if (section.type === "verdict") {
            return (
              <section key={section.type} className="glass-panel content-panel">
                <h2 className="section-title">Verdict</h2>
                <h3 className="section-heading">{section.data.headline}</h3>
                <p className="section-body">{section.data.summary}</p>
              </section>
            );
          }

          if (section.type === "pros_cons") {
            return (
              <section key={section.type} className="compare-highlights-grid">
                <div className="glass-panel content-panel">
                  <h2 className="section-title">Pros & cons · {entities.tool_a.name}</h2>
                  <h3 className="section-heading">Pros</h3>
                  <ul className="highlight-list">
                    {section.data.tool_a.pros.map((item) => (
                      <li key={"item-a" + item}>{item}</li>
                    ))}
                  </ul>
                  <h3 className="section-heading">Cons</h3>
                  <ul className="highlight-list">
                    {section.data.tool_a.cons.map((item) => (
                      <li key={"item-a-con" + item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="glass-panel content-panel">
                  <h2 className="section-title">Pros & cons · {entities.tool_b.name}</h2>
                  <h3 className="section-heading">Pros</h3>
                  <ul className="highlight-list">
                    {section.data.tool_b.pros.map((item) => (
                      <li key={"item-b" + item}>{item}</li>
                    ))}
                  </ul>
                  <h3 className="section-heading">Cons</h3>
                  <ul className="highlight-list">
                    {section.data.tool_b.cons.map((item) => (
                      <li key={"item-b-con" + item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          if (section.type === "highlights") {
            return (
              <section key={section.type} className="compare-highlights-grid">
                <div className="glass-panel content-panel">
                  <h2 className="section-title">Highlights · {entities.tool_a.name}</h2>
                  <ul className="highlight-list">
                    {section.data.tool_a.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="glass-panel content-panel">
                  <h2 className="section-title">Highlights · {entities.tool_b.name}</h2>
                  <ul className="highlight-list">
                    {section.data.tool_b.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          if (section.type === "faq") {
            return (
              <section key={section.type} className="glass-panel faq-panel">
                <h2 className="section-title">FAQ</h2>
                <div className="faq-list">
                  {section.data.items.map((item) => (
                    <details key={item.question} className="faq-item">
                      <summary className="faq-question">{item.question}</summary>
                      <p className="faq-answer">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          }

          if (section.type === "related_comparisons") {
            return (
              <section key={section.type} className="glass-panel related-panel">
                <h2 className="section-title">Related comparisons</h2>
                <div className="related-links">
                  {section.data.links.map((link) => (
                    <Link key={link.href} href={link.href} className="related-link-chip">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        <footer className="compare-footer">
          <Link href="/" className="back-link">
            ← Back to all comparisons
          </Link>
          <span className="footer-meta">
            Programmatic JSON spec: <code>{spec.page_key}.json</code>
          </span>
        </footer>
      </main>
    </>
  );
}
