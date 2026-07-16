# Crochet Keychains

A simple, fast, single-page website for **Crochet Keychains** — a small handmade crochet
keychain studio in Pakistan. Customers browse the gallery, see prices and ratings, and order
on **WhatsApp** or **Instagram** (no account or checkout needed).

## Tech
Plain static site — no build step, no dependencies. Just HTML, CSS and vanilla JS.

```
index.html                  Page markup + SEO meta + structured data
css/styles.css              Styles (responsive: phones → desktop)
js/main.js                  Gallery, lightbox, order flow, ratings, schema, SW register
js/pdp-order.js             Guided order form on product pages (same WhatsApp flow as home)
images/                     Product photos (post-<N>.jpg + .webp) + manifest.json (catalog)
p/<ref>/index.html          Generated per-product landing pages (see below)
scripts/build-share-pages.js  Generator for the product pages + sitemap
sw.js                       Service worker (PWA installability + light offline)
site.webmanifest            PWA / install metadata (PNG icons: icon-192/512(-maskable).png)
robots.txt / sitemap.xml    Crawl rules / sitemap
favicon.svg                 Site icon
```

The catalog lives in `images/manifest.json`. Each entry has `src`, `title`, `price`,
`alt`, `rating`, `reviews`, `sold`, plus two optional fields:
- `priceMax` — set alongside `price` for a **price range** (e.g. `price: 600, priceMax: 1000`
  renders “PKR 600–1,000”). Items without it show a single price exactly as before.
- `reviewList` — an array of customer reviews (`{ name, stars, text, date }`); its length
  should match `reviews`. Powers the clickable reviews panel and `Review` structured data.

("New" arrival badges are set by ref number in `NEW_REFS` in `js/main.js`.)

## Customer reviews
Each product carries seeded, human-sounding reviews (`reviewList` in the manifest). On both
the **product pages** (`/p/<ref>/`) and the **homepage lightbox**, the “(N reviews)” text is a
clickable pink link that expands an inline reviews panel — a CSS-only `<details>` disclosure
(no JS needed on the product pages; the lightbox builds the same markup in `js/main.js`).
Reviews are also emitted as schema.org `Review` + `AggregateRating` JSON-LD on every product
page **and** in the homepage `ItemList` — for Google rich-result stars and AEO/GEO.

Reviews were generated deterministically (seeded by ref) so rebuilds never churn them; to
regenerate or edit, change `reviewList` in `images/manifest.json` and re-run the build script.

## Run locally
```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy (GitHub Pages)
1. Push to GitHub (already configured).
2. Repo **Settings → Pages → Source: `main` branch / root**.
3. Site goes live at `https://iamramesh1993.github.io/crochet-keychains/`.

## Custom domain — www.crochetkeychains.com
> **Status: LIVE.** The site runs on `https://www.crochetkeychains.com` with **Cloudflare
> nameservers in front of GitHub Pages** (not raw Namecheap DNS); apex 301-redirects to `www`,
> HTTPS enforced, and the GitHub Pages custom domain is **verified**. The steps below are the
> original setup, kept for reference.

Site URLs (canonical, Open Graph, JSON-LD, `js/main.js` `SITE_URL`, `sitemap.xml`,
`robots.txt`, `site.webmanifest`) point to `https://www.crochetkeychains.com`.

Original setup steps:
1. In Namecheap (Domain → Advanced DNS) add:
   - **CNAME** record: Host `www` → Value `iamramesh1993.github.io.`
   - Four **A** records: Host `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (apex redirect to www)
2. Once DNS resolves, rename `CNAME.example` → `CNAME` (it already contains
   `www.crochetkeychains.com`), commit, and push. GitHub Pages will serve the domain
   and issue HTTPS automatically.

Until step 2, the site stays live at `https://iamramesh1993.github.io/crochet-keychains/`.

## Security headers
> **Status: DONE.** Cloudflare serves **HSTS + `X-Content-Type-Options: nosniff` +
> `X-Frame-Options: SAMEORIGIN`**. Also live: `Referrer-Policy` (meta), `/.well-known/security.txt`
> (RFC 9116), full email auth (**SPF + DKIM + DMARC**), Bot Fight Mode, and GitHub domain
> verification. AI crawlers are intentionally **allowed** (AEO/GEO) — do not enable Cloudflare's
> "Block AI bots". The notes below explain the setup.

Done in-repo (works on a static host):
- **HTTPS** enforced (GitHub Pages "Enforce HTTPS"); http + apex 301-redirect to `https://www`.
- **Content-Security-Policy** via a `<meta>` tag in `index.html` (restricts scripts/styles/
  images/fonts/connections to self + Google Fonts).

Cannot be set on GitHub Pages — it does **not** allow custom HTTP response headers
(no `.htaccess`, no `nginx.conf`, no `_headers`). These need a proxy in front:
- **HSTS** (`Strict-Transport-Security`)
- **X-Content-Type-Options: nosniff**
- **X-Frame-Options / CSP `frame-ancestors`** (clickjacking — `frame-ancestors` is ignored in a meta tag)

Recommended fix: route the domain through **Cloudflare (free)** and add these as response
headers (SSL/TLS → Edge Certificates → enable HSTS; Rules → Transform Rules → Modify Response
Header for `X-Content-Type-Options` and `X-Frame-Options`). Cloudflare also adds caching/CDN.

## Product roadmap
See [`ROADMAP.md`](ROADMAP.md) — North Star metric, the weekly data-review cadence
(Search Console + Cloudflare analytics + order tally), trend-watching, and a phased,
data-triggered plan (measure → convert → acquire → scale → retain).

## Editing the shop
- **Add a product:**
  1. Make an HD `images/post-<N>.jpg` (resize the photo to ≤1080px) **and** a matching
     `images/post-<N>.webp` (e.g. with a small `sharp` script).
  2. Append an entry to `images/manifest.json` (`src`, `title`, `price`, `alt`, `rating`,
     `reviews`, `sold`; optionally `priceMax` for a range and `reviewList` for reviews).
  3. Bump the cache versions: `manifest.json?v=` in `js/main.js` **and** `main.js?v=` in
     `index.html` (bump `css/styles.css?v=` too if you touched CSS).
  4. Run `node scripts/build-share-pages.js` (rebuilds the product pages + sitemap), then commit.
- **Change the WhatsApp number:** `WHATSAPP_NUMBER` in `js/main.js` (also update the
  footer/contact `wa.me` links + Store `telephone` in `index.html`, and the `WA` const in
  `scripts/build-share-pages.js`), then regenerate the product pages.
- **Bump styles/scripts cache:** increase the `?v=` number on the CSS/JS links in `index.html`.
  (The product-page generator auto-reads the CSS version from `index.html`, so it stays in sync.)

## Per-product landing pages (`/p/<ref>/`)
Link-preview crawlers (WhatsApp/Instagram/Facebook/X) read Open Graph tags from
**static HTML** and don't run JS, so a single page can only ever show one preview
image. So we pre-generate a standalone, **indexable product landing page** per design
at `/p/<ref>/` — each carries its own `og:image`/title, full Product + Breadcrumb +
shipping/returns + `Review`/`AggregateRating` structured data, and a focused WhatsApp/Instagram
buy flow. They double
as clean ad-landing pages. The **Share** button and the gallery cards link to these URLs
(e.g. `https://www.crochetkeychains.com/p/037/`); the legacy `?design=<ref>` still opens
the in-app lightbox.

Their **Order on WhatsApp** button opens the same guided order form as the homepage
(name / phone / address / quantity / notes → a rich WhatsApp message), powered by
`js/pdp-order.js` (a small same-origin script; the product details are baked onto the
form as `data-*` attributes). Progressive enhancement: with JS off, the button is still a
plain `wa.me` link with a basic prefilled message, so buyers are never stuck.

Regenerate after any catalog change:
```
node scripts/build-share-pages.js   # rebuilds every /p/<ref>/ page + sitemap.xml
```
The legacy `?design=<ref>` deep-link still works for older shared links.
