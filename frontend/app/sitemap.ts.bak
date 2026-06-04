import type { MetadataRoute } from "next";
import manifest from "../../engine/output/manifest.json";
import { siteUrl, toAbsoluteUrl } from "../lib/seo";

interface ManifestPage {
  url_path: string;
}

interface ManifestShape {
  pages?: ManifestPage[];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ((manifest as ManifestShape).pages ?? []) as ManifestPage[];
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1
    },
    ...pages.map((page) => ({
      url: toAbsoluteUrl(page.url_path),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
