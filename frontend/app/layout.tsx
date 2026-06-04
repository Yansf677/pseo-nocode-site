import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "../lib/seo";

const siteName = "Tool Comparison";
const defaultTitle = "Tool Comparison | Programmatic A vs B Software Comparisons";
const defaultDescription =
  "Explore fast, structured A vs B software comparisons with side-by-side breakdowns for pricing, features, pros, cons, and buyer fit.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`
  },
  description: defaultDescription,
  applicationName: siteName,
  category: "software",
  keywords: [
    "tool comparison",
    "software comparison",
    "A vs B",
    "programmatic SEO",
    "pricing comparison",
    "feature comparison"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: defaultTitle,
    siteName,
    description: defaultDescription,
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1
    }
  },
  verification: {
    other: {
      'impact-site-verification': ['3e02df2f-dfdd-49cd-a867-a40beb52249f']
    }
  }
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/compare/{comparisonSlug}`,
    "query-input": "required name=comparisonSlug"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="app-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <div className="app-shell">
          <div className="app-background" aria-hidden="true">
            <span className="app-orb app-orb-primary" />
            <span className="app-orb app-orb-secondary" />
            <span className="app-grid" />
          </div>
          <div className="layout-container">{children}</div>
        </div>
      </body>
    </html>
  );
}
