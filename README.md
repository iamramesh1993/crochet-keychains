# Crochet Keychains

A simple, fast, single-page website for **Crochet Keychains** — a small handmade crochet
keychain studio in Pakistan. Customers browse the gallery, see prices and ratings, and order
on **WhatsApp** or **Instagram** (no account or checkout needed).

## Tech
Plain static site — no build step, no dependencies. Just HTML, CSS and vanilla JS.

```
index.html          Page markup + SEO meta + structured data
css/styles.css      Styles (responsive: phones → desktop)
js/main.js          Gallery, lightbox, order flow, ratings, schema
images/             Product photos + manifest.json (the catalog data)
robots.txt          Crawl rules
sitemap.xml         Sitemap for search engines
site.webmanifest    PWA / install metadata
favicon.svg         Site icon
```

The catalog lives in `images/manifest.json`. Each entry has `src`, `title`, `price`,
`alt`, and either rating fields (`rating`, `reviews`, `sold`) or `isNew: true`.

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
Site URLs (canonical, Open Graph, JSON-LD, `js/main.js` `SITE_URL`, `sitemap.xml`,
`robots.txt`, `site.webmanifest`) already point to `https://www.crochetkeychains.com`.

To finish going live on the domain:
1. In Namecheap (Domain → Advanced DNS) add:
   - **CNAME** record: Host `www` → Value `iamramesh1993.github.io.`
   - Four **A** records: Host `@` → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (apex redirect to www)
2. Once DNS resolves, rename `CNAME.example` → `CNAME` (it already contains
   `www.crochetkeychains.com`), commit, and push. GitHub Pages will serve the domain
   and issue HTTPS automatically.

Until step 2, the site stays live at `https://iamramesh1993.github.io/crochet-keychains/`.

## Security headers
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
- **Add/remove a product:** edit `images/manifest.json` (and drop the photo in `images/`),
  then run `node scripts/build-share-pages.js` (see below) and commit the changes.
- **Change the WhatsApp number:** `WHATSAPP_NUMBER` in `js/main.js`.
- **Bump styles/scripts cache:** increase the `?v=` number on the CSS/JS links in `index.html`.

## Per-product share pages (link-preview thumbnails)
Link-preview crawlers (WhatsApp/Instagram/Facebook/X) read Open Graph tags from
**static HTML** and don't run JS, so a single page can only ever show one preview
image. To make a shared product link show **that product's** photo, we pre-generate
a tiny page per design at `/p/<ref>/` carrying its own `og:image`/title; real
visitors are instantly forwarded to the product card. The **Share** button outputs
these clean URLs (e.g. `https://www.crochetkeychains.com/p/037/`).

Regenerate after any catalog change:
```
node scripts/build-share-pages.js   # rebuilds /p/<ref>/ pages, /p/redirect.js, sitemap.xml
```
The legacy `?design=<ref>` deep-link still works for older shared links.
