import type { Metadata } from "next";
import Link from "next/link";
import manifest from "../../engine/output/manifest.json";
import { dedupeKeywords, siteUrl, toAbsoluteUrl } from "../lib/seo";

interface ManifestPage {
  page_key: string;
  url_path: string;
  title: string;
}

const pages = ((manifest as { pages?: ManifestPage[] }).pages ?? []) as ManifestPage[];
const featuredPages = pages.slice(0, 3);
const leadPage = pages[0];
const pageTitle = "Best Software Comparison Pages for Pricing, Features & Buyer Fit";
const pageDescription =
  "Browse detailed A vs B software comparison pages built for faster evaluation, clearer feature trade-offs, and stronger purchase intent.";

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

      <main className="home-page">
        <section className="hero-panel">
          <div className="hero-copy">
            <div className="hero-badge-row">
              <p className="badge">Programmatic SEO · A vs B</p>
              <span className="hero-status-pill">{pages.length} pages ready to explore</span>
            </div>
            <h1 className="page-title page-title-hero">
              A premium comparison hub that feels more like a product than a list.
            </h1>
            <p className="page-description page-description-hero">
              Browse polished A vs B landing pages with a darker, sharper SaaS visual
              style — clearer hierarchy, better scanning, and stronger click intent.
            </p>
            <div className="hero-actions">
              {leadPage ? (
                <Link href={leadPage.url_path} className="cta-primary">
                  Explore featured comparison
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
              <a href="#comparison-list" className="cta-secondary">
                Jump to all comparisons
              </a>
            </div>
          </div>

          <div className="hero-showcase">
            <div className="glass-panel showcase-panel">
              <p className="showcase-label">Why this version feels better</p>
              <div className="showcase-metrics">
                <article className="metric-card">
                  <span className="metric-value">Frosted</span>
                  <span className="metric-label">Glass depth and layered glow</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">Focused</span>
                  <span className="metric-label">Stronger hierarchy and spacing</span>
                </article>
                <article className="metric-card">
                  <span className="metric-value">Responsive</span>
                  <span className="metric-label">Comfortable reading on mobile too</span>
                </article>
              </div>
            </div>
          </div>
        </section>

        {featuredPages.length ? (
          <section className="feature-strip">
            {featuredPages.map((page, index) => (
              <Link key={page.page_key} href={page.url_path} className="feature-card">
                <span className="feature-index">0{index + 1}</span>
                <span className="feature-title">{page.title}</span>
                <span className="feature-caption">Fast-access featured page</span>
              </Link>
            ))}
          </section>
        ) : null}

        <section id="comparison-list" className="glass-panel list-section">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Available comparisons</h2>
              <p className="section-heading">Browse the full index</p>
            </div>
            <p className="section-caption">Hover a card to preview the next step.</p>
          </div>

          <div className="list-container">
            {pages.map((page, index) => (
              <Link key={page.page_key} href={page.url_path} className="list-item">
                <span className="list-item-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="list-item-content">
                  <span className="list-item-title">{page.title}</span>
                  <span className="list-item-key">{page.page_key}</span>
                </span>
                <span className="list-item-action">Open comparison →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
