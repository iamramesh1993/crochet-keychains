# Crochet Keychain PK

A simple, fast, single-page website for **Crochet Keychain PK** — a small handmade crochet
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

## Editing the shop
- **Add/remove a product:** edit `images/manifest.json` (and drop the photo in `images/`).
- **Change the WhatsApp number:** `WHATSAPP_NUMBER` in `js/main.js`.
- **Bump styles/scripts cache:** increase the `?v=` number on the CSS/JS links in `index.html`.
