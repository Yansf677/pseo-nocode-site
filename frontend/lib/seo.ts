import manifest from "../../engine/output/manifest.json";

interface ManifestPage {
  url_path: string;
}

interface ManifestShape {
  pages?: ManifestPage[];
}

const FALLBACK_SITE_URL = "https://stackcompare.xyz";

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function deriveSiteUrlFromManifest() {
  const pages = ((manifest as ManifestShape).pages ?? []) as ManifestPage[];
  const comparePage = pages.find((page) => page.url_path?.startsWith("/compare/"));

  if (!comparePage?.url_path) {
    return FALLBACK_SITE_URL;
  }

  return FALLBACK_SITE_URL;
}

export const siteUrl = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL || deriveSiteUrlFromManifest()
);

export function toAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function dedupeKeywords(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => Boolean(value?.trim()))
        .map((value) => value.trim())
    )
  );
}
