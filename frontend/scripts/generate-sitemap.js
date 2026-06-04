const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../../engine/output/manifest.json');
const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
const siteUrl = "https://stackcompare.xyz";

function generateSitemap() {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found at ${manifestPath}`);
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pages = manifest.pages || [];
  const lastModified = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastModified}\</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

  pages.forEach(page => {
    xml += `
  <url>
    <loc>${siteUrl}${page.url_path}</loc>
    <lastmod>${lastModified}\</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += '\n</urlset>';

  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, xml);
  console.log(`Sitemap generated at ${outputPath}`);
}

generateSitemap();
