#!/usr/bin/env node
/*
 * Generates a standalone, indexable PRODUCT PAGE per design at /p/<ref>/index.html.
 *
 * These are real landing pages (not redirects): each one carries the product's
 * own Open Graph image/title (so link-preview thumbnails are correct), full
 * Product + Breadcrumb structured data, and a focused buy flow (WhatsApp /
 * Instagram). They're crawlable, so every design can rank in Google and works
 * as a clean ad landing page. The homepage Share button points here.
 *
 * Re-run after editing images/manifest.json:  node scripts/build-share-pages.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.crochetkeychains.com';
const WA = '923343128419';
const IG_DM = 'https://ig.me/m/crochet_keychains.pk';
const CF_TOKEN = 'c279e6010c3440b1a5e3fc54a6814b5a';
const YEAR = new Date().getFullYear();
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'images', 'manifest.json'), 'utf8'));
// Stay on the SAME css/js cache version as index.html so product pages never
// serve a stale cached stylesheet (read automatically — no manual sync needed).
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CSS_VER = (indexHtml.match(/styles\.css\?v=(\d+)/) || [, '1'])[1];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const refOf = (it) => { const m = (it.src || '').match(/(\d+)/); return m ? m[1] : null; };
// A design can carry a single `price` or a `price`..`priceMax` range (cost varies
// by size/design). `priceMax` is optional — single-price items are unaffected.
const hasRange = (it) => it.priceMax && it.price && it.priceMax > it.price;
const priceAmt = (it) => (hasRange(it)
  ? `${Number(it.price).toLocaleString('en-US')}–${Number(it.priceMax).toLocaleString('en-US')}`
  : Number(it.price).toLocaleString('en-US'));
const priceText = (it) => (it.price ? `PKR ${priceAmt(it)}` : 'DM for price');

const LOGO = `<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" fill="#e23e63"/><g fill="none" stroke="#c42f52" stroke-width="2.3" stroke-linecap="round" opacity="0.9"><path d="M14 28 C 25 17, 39 17, 50 28"/><path d="M13 36 C 25 23, 39 23, 51 36"/><path d="M17 43 C 27 31, 39 31, 48 43"/><path d="M23 14 C 30 26, 36 38, 43 49"/><path d="M34 13 C 28 26, 30 38, 36 50"/></g><path d="M50 22 q 10 -3 12 7" fill="none" stroke="#2bb3e3" stroke-width="2.6" stroke-linecap="round"/></svg>`;
const WA_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>`;
const IG_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" stroke="none"/></svg>`;
const MAIL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`;
const FOOTER = `<footer class="site-footer"><div class="footer-inner"><div><p class="logo">Crochet Keychains</p><p class="footer-tagline">Handmade crochet keychains &amp; charms · Made with love in Pakistan</p></div><div class="footer-links"><a href="https://www.instagram.com/crochet_keychains.pk/" target="_blank" rel="noopener" aria-label="Instagram">${IG_ICON}<span>Instagram</span></a><a href="https://wa.me/${WA}" target="_blank" rel="noopener" aria-label="WhatsApp">${WA_ICON}<span>WhatsApp</span></a><a href="mailto:info@crochetkeychains.com" aria-label="Email">${MAIL_ICON}<span>Email</span></a></div><p class="copyright">&copy; ${YEAR} Crochet Keychains. All rights reserved.</p></div></footer>`;

const pDir = path.join(ROOT, 'p');
fs.mkdirSync(pDir, { recursive: true });
// No longer redirecting — remove the old redirect helper if present.
try { fs.unlinkSync(path.join(pDir, 'redirect.js')); } catch (e) {}

let built = 0;
const productUrls = [];

for (const item of manifest) {
  const ref = refOf(item);
  if (!ref) continue;
  const pageUrl = `${SITE}/p/${ref}/`;
  const img = `${SITE}/${item.src}`;                                  // absolute — for OG/meta/JSON-LD (crawlers)
  const imgRel = `/${item.src}`;                                      // root-relative — for the on-page <img>
  const webpRel = `/${item.src.replace(/\.jpg$/, '.webp')}`;         // root-relative — on-page <source>
  const webp = `${SITE}/${item.src.replace(/\.jpg$/, '.webp')}`;
  const price = priceText(item);
  const titlePrice = `${item.title} — ${price}`;
  const metaDesc = `${item.title} — handmade crochet keychain, ${price}. Made to order in Pakistan, cash on delivery or Easypaisa. Order on WhatsApp or Instagram.`;
  // Visible/product description — product-focused (price + delivery are shown
  // separately above/below, so we don't repeat them here).
  const longDesc = `${item.title} — handmade and crocheted by hand in Pakistan with soft yarn and sturdy hardware. A cute, durable charm for your keys, bag, or a thoughtful little gift. Custom colours welcome.`;

  const waText = encodeURIComponent(`Hi! I'd like to order this from your website:\n\n*Design:* ${item.title} (Ref #${ref})\n*Price:* ${price}\n*Delivery:* PKR 250 (flat rate)\n*Payment:* Cash on Delivery or Easypaisa\n\nPlease let me know how to complete my order.`);
  const waLink = `https://wa.me/${WA}?text=${waText}`;

  // ---- rating line (with review count) + a reviews section rendered below ----
  const soldBit = item.sold ? ` · <span class="sold">${Number(item.sold).toLocaleString('en-US')} sold</span>` : '';
  const starRow = (n) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= n ? '&#9733;' : '<span class="dim">&#9733;</span>';
    return s;
  };
  // Top line = glanceable rating; the review cards live in their own section at the
  // bottom of the page (after the CTA), so they never displace the price/Order button.
  // The "(N reviews)" count anchor-jumps down to that section.
  let ratingHtml;
  let reviewsSection = '';
  if (item.rating && item.reviews && Array.isArray(item.reviewList) && item.reviewList.length) {
    const nR = item.reviews;
    const cards = item.reviewList.map((r) => `<article class="review">
<div class="review-head"><span class="review-name">${esc(r.name)}</span><span class="review-stars" aria-label="${r.stars} out of 5 stars">${starRow(r.stars)}</span></div>
<p class="review-text">${esc(r.text)}</p>
<span class="review-date">${esc(r.date)}</span>
</article>`).join('\n');
    ratingHtml = `<p class="pdp-meta"><span class="star">&#9733;</span> ${item.rating} · <a class="reviews-jump" href="#reviews">${nR} review${nR > 1 ? 's' : ''}</a> · Handmade${soldBit}</p>`;
    reviewsSection = `<section class="reviews-section" id="reviews">
<p class="reviews-head">Customer reviews</p>
${cards}
</section>`;
  } else if (item.rating && item.reviews) {
    ratingHtml = `<p class="pdp-meta"><span class="star">&#9733;</span> ${item.rating} (${item.reviews} review${item.reviews > 1 ? 's' : ''}) · Handmade${soldBit}</p>`;
  } else {
    ratingHtml = `<p class="pdp-meta">Handmade${soldBit}</p>`;
  }
  const priceHtml = item.price
    ? `<p class="pdp-price"><span class="cur">PKR</span>${priceAmt(item)}</p>`
    : `<p class="pdp-price">DM for price</p>`;

  const product = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: item.title, image: img, description: longDesc, url: pageUrl,
    brand: { '@type': 'Brand', name: 'Crochet Keychains' },
    offers: {
      '@type': hasRange(item) ? 'AggregateOffer' : 'Offer',
      ...(hasRange(item)
        ? { lowPrice: item.price, highPrice: item.priceMax }
        : { price: item.price || undefined }),
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: `${YEAR + 1}-12-31`,
      url: pageUrl,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 250, currency: 'PKR' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'PK',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  };
  if (item.rating && item.reviews) {
    product.aggregateRating = { '@type': 'AggregateRating', ratingValue: item.rating, reviewCount: item.reviews, bestRating: 5, worstRating: 1 };
  }
  if (Array.isArray(item.reviewList) && item.reviewList.length) {
    product.review = item.reviewList.map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.stars, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: r.name },
      reviewBody: r.text,
    }));
  }
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: item.title, item: pageUrl },
    ],
  };

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com; upgrade-insecure-requests">
<title>${esc(titlePrice)} | Crochet Keychains</title>
<meta name="description" content="${esc(metaDesc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#e23e63">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Crochet Keychains">
<meta property="og:title" content="${esc(titlePrice)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:alt" content="${esc(item.alt || item.title)}">
<meta property="og:locale" content="en_PK">
<meta property="product:price:amount" content="${item.price || ''}">
<meta property="product:price:currency" content="PKR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titlePrice)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(img)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css?v=${CSS_VER}">
<script type="application/ld+json">${JSON.stringify(product)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
</head>
<body>
<header class="site-header"><nav class="nav">
<a href="/" class="logo" aria-label="Crochet Keychains — home">${LOGO}<span class="logo-text">Crochet Keychains<small>Handmade in Pakistan</small></span></a>
<a href="/#gallery" class="nav-cta">Shop all</a>
</nav></header>
<main class="pdp-page">
<nav class="pdp-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> · ${esc(item.title)}</nav>
<div class="pdp-layout">
<div class="pdp-media">
<picture><source type="image/webp" srcset="${esc(webpRel)}"><img src="${esc(imgRel)}" alt="${esc(item.alt || item.title)}" width="800" height="800" fetchpriority="high" decoding="async"></picture>
</div>
<div class="pdp-body">
<h1>${esc(item.title)}</h1>
${ratingHtml}
${priceHtml}
<p class="pdp-desc">${esc(longDesc)}</p>
<div class="pdp-cta">
<a class="btn btn-large btn-whatsapp pdp-order-open" href="${waLink}" target="_blank" rel="noopener">${WA_ICON}<span>Order on WhatsApp</span></a>
<a class="btn btn-large btn-instagram" href="${IG_DM}" target="_blank" rel="noopener">${IG_ICON}<span>Message on Instagram</span></a>
</div>
<p class="pdp-trust">PKR 250 flat-rate delivery · Cash on delivery or Easypaisa across Pakistan · Custom colours welcome · Damaged items replaced</p>
${reviewsSection}
<a class="pdp-browse" href="/#gallery">&#8592; Browse all designs</a>
</div>
</div>
</main>
${FOOTER}
<div class="order-modal" id="pdp-order-modal" hidden>
<div class="order-modal-card" role="dialog" aria-modal="true" aria-labelledby="pdp-order-title">
<button class="order-modal-close" type="button" aria-label="Close">&times;</button>
<h2 id="pdp-order-title">Order this keychain</h2>
<p class="order-modal-sub">Cash on delivery or Easypaisa &middot; PKR 250 flat-rate delivery, all over Pakistan.</p>
<div class="order-modal-preview">
<img src="${esc(imgRel)}" alt="${esc(item.alt || item.title)}" width="56" height="56">
<span>${esc(item.title)} &middot; ${esc(price)}</span>
</div>
<form class="order-form" id="pdp-order-form" novalidate data-title="${esc(item.title)}" data-ref="#${ref}" data-price="${esc(price)}" data-photo="${esc(img)}" data-wa="${WA}">
<label>Your name
<input type="text" name="name" required autocomplete="name" placeholder="e.g. Ayesha Khan">
</label>
<label>Phone number
<input type="tel" name="phone" required autocomplete="tel" placeholder="e.g. 0300 1234567">
</label>
<label>Delivery address
<textarea name="address" rows="2" required placeholder="House, street, area, city"></textarea>
</label>
<div class="order-form-row">
<div class="order-field">
<span class="field-cap">Quantity</span>
<span class="qty-stepper">
<button type="button" class="qty-btn" data-step="-1" aria-label="Decrease quantity">&minus;</button>
<input type="number" name="qty" min="1" value="1" inputmode="numeric" aria-label="Quantity" required>
<button type="button" class="qty-btn" data-step="1" aria-label="Increase quantity">+</button>
</span>
</div>
</div>
<label>Notes (optional)
<textarea name="notes" rows="2" placeholder="Colors, custom text, gift wrap&hellip;"></textarea>
</label>
<p class="order-form-error" id="pdp-order-error" hidden>Please fill in your name, phone and address.</p>
<button type="submit" class="btn btn-large order-form-submit">${WA_ICON}<span>Send order on WhatsApp</span></button>
</form>
</div>
</div>
<script src="/js/pdp-order.js?v=2" defer></script>
<!-- Cloudflare Web Analytics -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${CF_TOKEN}"}'></script>
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

console.log(`Built ${built} product landing pages + sitemap (${productUrls.length + 1} urls).`);
