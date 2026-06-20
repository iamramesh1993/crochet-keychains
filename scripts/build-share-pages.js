#!/usr/bin/env node
/*
 * Generates one lightweight static page per product at /p/<ref>/index.html.
 *
 * Why: link-preview crawlers (WhatsApp, Instagram, Facebook, X) read the
 * Open Graph tags from STATIC HTML and do NOT run JavaScript. A single-page
 * site has one og:image, so every shared link shows the same thumbnail.
 * These per-product pages carry that product's own og:image/title, so the
 * preview is correct; real visitors are instantly forwarded to the product
 * card on the main site via /p/redirect.js.
 *
 * Re-run after editing images/manifest.json:  node scripts/build-share-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.crochetkeychains.com';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'manifest.json'), 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const refOf = (item) => {
  const m = (item.src || '').match(/(\d+)/);
  return m ? m[1] : null;
};
const priceText = (item) => (item.price ? `PKR ${Number(item.price).toLocaleString('en-US')}` : 'DM for price');

// ---- shared redirect (external so the page CSP can stay 'self', no inline JS) ----
const pDir = path.join(ROOT, 'p');
fs.mkdirSync(pDir, { recursive: true });
fs.writeFileSync(
  path.join(pDir, 'redirect.js'),
  "(function(){var m=location.pathname.match(/\\/p\\/(\\d+)/);if(m){location.replace('/?design='+m[1]);}})();\n"
);

let built = 0;
const productUrls = [];

for (const item of manifest) {
  const ref = refOf(item);
  if (!ref) continue;
  const pageUrl = `${SITE}/p/${ref}/`;
  const img = `${SITE}/${item.src}`;
  const title = `${item.title} — ${priceText(item)}`;
  const desc = `${item.title} — handmade crochet keychain, ${priceText(item)}. Made to order in Pakistan, cash on delivery. Order on WhatsApp or Instagram.`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    image: img,
    description: desc,
    url: pageUrl,
    brand: { '@type': 'Brand', name: 'Crochet Keychains' },
    offers: {
      '@type': 'Offer',
      price: item.price || undefined,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      url: pageUrl,
    },
  };
  if (item.rating && item.reviews) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: item.rating,
      reviewCount: item.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; object-src 'none'; base-uri 'self'; img-src 'self' data:">
<title>${esc(title)} | Crochet Keychains</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${pageUrl}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Crochet Keychains">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(item.alt || item.title)}">
<meta property="product:price:amount" content="${item.price || ''}">
<meta property="product:price:currency" content="PKR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="/p/redirect.js"></script>
</head>
<body>
<p>Taking you to <a href="/?design=${ref}">${esc(item.title)}</a>…</p>
</body>
</html>
`;

  const dir = path.join(pDir, ref);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  productUrls.push(pageUrl);
  built++;
}

// ---- regenerate sitemap (homepage + every product page) ----
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${productUrls.map((u) => `  <url>
    <loc>${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`Built ${built} product share pages + /p/redirect.js + sitemap (${productUrls.length + 1} urls).`);
