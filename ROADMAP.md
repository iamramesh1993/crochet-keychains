# Crochet Keychains — Product Roadmap

Owner: iamramesh1993 · Updated: 2026-06-17

A lean, data-driven plan for growing Crochet Keychains from a static catalog +
WhatsApp/Instagram ordering into a small, well-run handmade brand — **without
over-engineering**. The site stays fast and static until real order volume
justifies a backend.

---

## North Star & guardrails

- **North Star metric:** confirmed **orders per week**.
- **Supporting metrics:** sessions, gallery→order click rate, top designs, traffic
  sources, search impressions/clicks, repeat customers.
- **Principles:**
  1. Keep it static, fast, and free to host as long as possible.
  2. Replace seeded ratings/"sold" with **real** data as orders arrive (credibility).
  3. Ship one or two small experiments per week, measure, keep or kill.
  4. Don't add payments or a backend until COD + WhatsApp is proven a bottleneck.
  5. Never regress accessibility, SEO, security, or load speed.

---

## Weekly operating cadence (every Monday, ~30 min)

Review the past 7 days and pick this week's 1–2 experiments.

**Data sources**
- **Google Search Console** — queries, impressions, clicks, CTR, avg position, top pages.
- **Cloudflare Web Analytics** (free, privacy-first, no cookie banner) — visits, top
  countries/cities, devices, referrers, top pages. *(Enable in Cloudflare → Analytics.)*
- **Order tally** — count WhatsApp + Instagram orders manually in a simple sheet:
  date, design (ref), price, channel, city, custom? repeat? This is the real
  sales data that should gradually replace the seeded numbers.
- **Instagram insights** — reach, profile visits, link taps, top posts.

**Weekly checklist**
- [ ] Orders this week vs last (and by design / channel / city)
- [ ] Top 5 designs by interest (order clicks) and by actual orders
- [ ] Top search queries + any with impressions but low CTR (title/desc opportunity)
- [ ] Traffic sources — is Instagram, Google, or direct growing?
- [ ] One trend scan (see below) — anything to make this week?
- [ ] Decide 1–2 experiments; note last week's experiment result (kept/killed)

---

## Trend-watching (crochet / handmade gifting)

Scan weekly (15 min) — Instagram, TikTok, Pinterest, Etsy "best sellers", local groups:
- **Seasonal demand:** Eid, Valentine's, graduation, Christmas, Mother's/Father's Day,
  wedding favors, back-to-school. Plan collections ~3–4 weeks ahead.
- **Trending shapes/characters:** viral amigurumi (animals, food, flowers, cars).
  Be cautious with licensed/branded characters (IP risk) — favor originals.
- **Personalization:** name tags, initials, custom colors — high-margin, low stock risk.
- **Color/aesthetic trends:** pastel, cottagecore, "ugly-cute," etc.
- **Gifting angle:** "handmade gift under Rs X," corporate/bulk gifting, party favors.

---

## Phased roadmap (data-triggered, not date-bound)

### Phase 0 — Foundation ✅ (done)
Live storefront, 92 deduped designs, WhatsApp/Instagram ordering, responsive,
SEO/GEO/AEO, structured data, Search Console, Cloudflare (HTTPS, HSTS, headers,
Brotli, HTTP/3). RankNibbler ~99/100.

### Phase 1 — Measure & learn (next 2–4 weeks)
*Goal: know what sells and where visitors come from.*
- Enable **Cloudflare Web Analytics** (one snippet, no cookie banner).
- Add lightweight **event tracking** on order buttons: which design, WhatsApp vs
  Instagram, per-product vs generic. (Cloudflare Web Analytics custom events, or a
  privacy-friendly tool — no heavy GA needed.)
- Start the **order tally sheet**; begin replacing seeded sold/reviews with real ones.
- Monitor Search Console for first impressions/queries.

### Phase 2 — Conversion & merchandising (data-driven)
*Goal: turn more visitors into orders. Prioritize by Phase 1 data.*
- **Categories / filters** (animals, food, flowers, festive, cars, characters) + sort by
  popularity. Helps users find designs and helps SEO.
- **Search box** for the gallery once the catalog grows.
- **Reviews** — ✅ display shipped: clickable “(N reviews)” panel on product pages and the
  homepage lightbox, with `Review`/`AggregateRating` structured data (seeded, human-sounding).
  *Next:* collect **real** reviews from WhatsApp buyers (with permission) and retire the
  seeded ones in `reviewList`.
- **Best-seller / "New" badges** driven by real data.
- **Seasonal collections** and **bundles** (e.g., "gift set of 3").
- Trust signals: delivery time estimate, COD reassurance, packaging photos.

### Phase 3 — Acquisition & content SEO
*Goal: grow free traffic.*
- **Per-product pages** (individual URLs) for better indexing, sharing, and rich results
  — biggest SEO unlock; consider a tiny static-site generator at this point.
- **Blog/guides** for long-tail queries ("crochet gift ideas in Pakistan", "how to care
  for crochet keychains", "amigurumi vs crochet").
- **Google Business Profile**; Pinterest + Instagram Reels funnel; collab/UGC.
- Expand FAQ + JSON-LD; add BreadcrumbList once multi-page.

### Phase 4 — Operations & scale (only if volume warrants)
*Goal: handle more orders without chaos.*
- Structured **order intake** beyond manual WhatsApp (form → email/sheet, or a light
  order-management tool); inquiry follow-up.
- Made-to-order **queue/lead-time** tracking; simple stock notes for ready items.
- **Payments** (advance/partial, easypaisa/JazzCash) *only if* COD friction shows in data.
- Re-evaluate platform: stay static, or move to **Shopify / headless commerce** —
  decide on order volume and operational pain, not hype.

### Phase 5 — Retention & brand
- WhatsApp broadcast / email list (opt-in), repeat-customer offers, loyalty.
- UGC + reviews flywheel, creator collabs, limited drops.

---

## Backlog (quick wins to pull in anytime)
- Cloudflare Web Analytics enabled (Phase 1, do first).
- "Sort by: popular / newest / price" on the gallery.
- Lazy-load + responsive `srcset` for gallery images (perf as catalog grows).
- WhatsApp "order received" auto-reply template (set in WhatsApp Business).
- Replace one seeded review with a real testimonial as soon as the first order lands.
