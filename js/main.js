// Land at the top on reload (incl. the logo "home" refresh) instead of the
// browser restoring the previous scroll position. We restore scroll ourselves
// when closing overlays, so manual restoration is safe here.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.getElementById('year');
const galleryGrid = document.getElementById('gallery-grid');
const galleryCount = document.getElementById('gallery-count');
const heroVisual = document.getElementById('hero-visual');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxMeta = document.getElementById('lightbox-meta');
const lightboxPrice = document.getElementById('lightbox-price');
const lightboxCounter = document.getElementById('lightbox-counter');

let galleryItems = [];   // full catalog
let viewItems = [];      // current filtered + sorted view (what the grid/lightbox show)
let lightboxIndex = 0;

// ---- Catalog browsing: categories, sort, favourites, "new" tags ----
const CATEGORY_DEFS = [
  { id: 'festive', label: 'Festive', kw: ['christmas', 'santa', 'snowman', 'new year', 'bell', 'mitten', 'sock'] },
  { id: 'cars', label: 'Cars', kw: ['car'] },
  { id: 'characters', label: 'Characters', kw: ['superman', 'minion', 'mickey', 'pikachu', 'pooh'] },
  { id: 'food', label: 'Food', kw: ['ice cream', 'strawberry', 'macaron', 'biscuit', 'mug', 'burger', 'fries', 'pizza', 'watermelon', 'lemon', 'orange', 'nutella', 'cheeseburger', 'coffee', 'fruit', 'acorn'] },
  { id: 'flowers', label: 'Flowers', kw: ['rose', 'flower', 'daisy', 'tulip', 'marigold', 'bouquet', 'floral'] },
  { id: 'animals', label: 'Animals', kw: ['bunny', 'cat', 'bear', 'panda', 'penguin', 'elephant', 'frog', 'owl', 'dog', 'shiba', 'sheep', 'turtle', 'ladybug', 'bee', 'hen', 'chick', 'bird', 'mouse', 'octopus', 'puppy'] },
  { id: 'more', label: 'More', kw: null }, // catch-all
];
// Precompile a whole-word matcher per category (with optional trailing "s"),
// so "car" matches "car/cars" but not "maCARon" or "CARrot".
CATEGORY_DEFS.forEach((c) => {
  if (c.kw) c.re = new RegExp('\\b(' + c.kw.join('|') + ')s?\\b', 'i');
});

// Designs flagged as recent arrivals (by ref number) — easy to edit.
const NEW_REFS = new Set(['102', '110', '114', '066', '109', '068', '108']);
const FAVES_KEY = 'ck_favorites';

let favorites = new Set();
try { favorites = new Set(JSON.parse(localStorage.getItem(FAVES_KEY) || '[]')); } catch (e) {}

let activeCategory = 'all';
let activeSort = 'featured';
let renderedCount = 0;
const BATCH_SIZE = 24;

function categoryOf(item) {
  const t = item.title || '';
  for (const c of CATEGORY_DEFS) {
    if (!c.re) return c.id; // 'more' catch-all
    if (c.re.test(t)) return c.id;
  }
  return 'more';
}

function isNewItem(item) {
  const m = (item.src || '').match(/(\d+)/);
  return m ? NEW_REFS.has(m[1]) : false;
}

function badgeFor(item) {
  if (isNewItem(item)) return { text: 'New', cls: 'badge-new' };
  if (item.sold >= 9) return { text: 'Bestseller', cls: 'badge-best' };
  if (categoryOf(item) === 'festive') return { text: 'Festive', cls: 'badge-festive' };
  return null;
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Header gains a soft shadow once the page is scrolled (depth without a blur).
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const onScroll = () => siteHeader.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function closeNav() {
  if (!navLinks || !navToggle) return;
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

// In-page anchor links (nav Gallery/About/Order, hero buttons): render the whole
// gallery first so lazy batches can't shift the target mid-scroll (which left jumps
// stuck inside the gallery), then smooth-scroll. The sticky-header offset is handled
// by scroll-padding-top in CSS.
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  closeNav();
  if (typeof flushAllGalleryItems === 'function') flushAllGalleryItems();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', '#' + id);
});

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  // Close the mobile menu when tapping outside it
  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
    closeNav();
  });

  // Close the mobile menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeNav();
  });
}

// Featured products shown in the hero (by exact title).
const HERO_FEATURED = ['Blue Car Keychain', 'Ice Cream Charm Set', 'Blue Elephant Charm'];

function buildHeroCards(items) {
  if (!heroVisual || items.length === 0) return;

  let picks = HERO_FEATURED
    .map((title) => items.find((x) => x.title === title))
    .filter(Boolean);
  // Fallback: if any featured product is missing, pad with other items.
  for (const item of items) {
    if (picks.length >= 3) break;
    if (!picks.includes(item)) picks.push(item);
  }
  picks = picks.slice(0, 3);
  const positions = ['hero-card-1', 'hero-card-2', 'hero-card-3'];

  heroVisual.innerHTML = picks.map((item, i) => `
    <div class="hero-card ${positions[i]}">
      <img class="hero-card-img" src="${item.src}" alt="${item.alt}" loading="eager">
      <span>${item.title}</span>
    </div>
  `).join('');
}

// Shop's WhatsApp number (digits only, with country code, no + or spaces): +92 314 4918419
const WHATSAPP_NUMBER = '923144918419';

// Public site URL — used for structured data (SEO).
const SITE_URL = 'https://www.crochetkeychains.com';

const ORDER_DM_URL = 'https://ig.me/m/crochet_keychains.pk';
const orderModal = document.getElementById('order-modal');
const contactModal = document.getElementById('contact-modal');
const orderForm = document.getElementById('order-form');
const orderChannels = document.querySelector('.order-channels');
const orderChannelsLabel = document.querySelector('.order-channels-label');
let orderModalItem = null;

function showOrderChannels() {
  if (orderForm) orderForm.hidden = true;
  if (orderChannels) orderChannels.hidden = false;
  if (orderChannelsLabel) orderChannelsLabel.hidden = false;
}

function showOrderForm() {
  if (orderChannels) orderChannels.hidden = true;
  if (orderChannelsLabel) orderChannelsLabel.hidden = true;
  if (orderForm) {
    orderForm.hidden = false;
    orderForm.name.focus();
  }
}

async function orderViaInstagram() {
  let message;
  let toast;
  if (orderModalItem) {
    const ref = refCode(orderModalItem);
    message = `Hi! I'd like to order this crochet keychain 🧶\n${orderModalItem.title} — ${formatPrice(orderModalItem)} (Ref ${ref})`;
    toast = `Order details copied — paste them in the DM 💬`;
  } else {
    // Generic order: Instagram can't pre-fill text, so copy a starter the buyer
    // pastes and completes with the design they want.
    message = `Hi! 👋 I'd like to order a crochet keychain from your website 🧶\nThe design I'd like: `;
    toast = `Message copied — paste it and tell us the design 💬`;
  }
  try {
    await navigator.clipboard.writeText(message);
    showToast(toast);
  } catch (err) {
    showToast(`Tell us which design you'd like in your DM 💬`);
  }
  window.open(ORDER_DM_URL, '_blank', 'noopener');
  dismissOverlay();
}

function refCode(item) {
  if (!item) return '';
  const match = (item.src || '').match(/(\d+)/);
  return match ? `#${match[1]}` : item.title;
}

function formatPrice(item) {
  if (!item || !item.price) return 'DM for price';
  return `PKR ${Number(item.price).toLocaleString('en-US')}`;
}

// HTML version for card display — currency label de-emphasised, amount prominent.
function formatPriceHtml(item) {
  if (!item || !item.price) return 'DM for price';
  return `<span class="price-cur">PKR</span>${Number(item.price).toLocaleString('en-US')}`;
}

// Match a free-text design query (from the generic "Book your order" field) to a
// catalogue item — by ref number (#015 / 015 / post-015) or product name — so the
// order message can include that design's photo + price. Conservative: only returns
// a confident match (exact/contained title or ref), else null (genuine custom idea).
function findItemByQuery(query) {
  const q = (query || '').trim().toLowerCase();
  if (q.length < 2) return null;
  const refLike = q.match(/(?:#|ref|post[- ]?)\s*(\d{1,3})/) || q.match(/^#?\s*(\d{1,3})\s*$/);
  if (refLike) {
    const n = refLike[1].padStart(3, '0');
    const byRef = galleryItems.find((it) => ((it.src || '').match(/(\d+)/) || [])[1] === n);
    if (byRef) return byRef;
  }
  const exact = galleryItems.find((it) => it.title.toLowerCase() === q);
  if (exact) return exact;
  return galleryItems.find((it) => {
    const t = it.title.toLowerCase();
    return q.includes(t) || t.includes(q);
  }) || null;
}

// Social proof: star rating + reviews + sold, or a "new arrival" tag.
function socialProofHtml(item) {
  if (item.isNew || !item.rating) {
    return `<span class="product-meta is-new">✨ New arrival</span>`;
  }
  const sold = item.sold
    ? `<span class="sold">${Number(item.sold).toLocaleString('en-US')} sold</span>`
    : '';
  return `<span class="product-meta">
      <span class="stars" style="--rating:${item.rating}" role="img" aria-label="Rated ${item.rating} out of 5 stars"></span>
      <span class="rating-num">${item.rating}</span>
      <span class="reviews">(${item.reviews})</span>
      ${sold}
    </span>`;
}

// Short text version for the lightbox caption.
function socialProofText(item) {
  if (item.isNew || !item.rating) return 'New arrival';
  const sold = item.sold ? ` · ${Number(item.sold).toLocaleString('en-US')} sold` : '';
  return `${item.rating}★ (${item.reviews})${sold}`;
}

function startOrder(item) {
  orderModalItem = item || null;
  if (!orderModal || !orderForm) return;

  orderForm.reset();
  orderForm.qty.value = '1';

  // Design field: locked to the chosen product when launched from a card/lightbox;
  // editable when launched from the generic "Book your order" so the buyer can
  // name the design they want (or describe a custom idea).
  const refField = document.getElementById('order-ref-field');
  const refLabel = refField ? refField.querySelector('.ref-label') : null;
  if (item) {
    // Product is already named by the preview card. Keep its ref for the WhatsApp
    // message (helps fulfilment) but hide the field — no need to ask the buyer.
    orderForm.ref.value = refCode(item);
    if (refField) refField.hidden = true;
  } else {
    orderForm.ref.value = '';
    orderForm.ref.readOnly = false;
    orderForm.ref.placeholder = 'Design name or ref — or a custom idea';
    if (refLabel) refLabel.textContent = 'Which design?';
    if (refField) refField.hidden = false;
  }

  const title = document.getElementById('order-modal-title');
  if (title) title.textContent = item ? 'Order this keychain' : 'Place your order';

  const preview = document.getElementById('order-modal-preview');
  const previewImg = document.getElementById('order-modal-img');
  const previewRef = document.getElementById('order-modal-ref');
  if (preview && item) {
    previewImg.src = item.src;
    previewImg.alt = item.alt;
    previewRef.textContent = `${item.title} · ${formatPrice(item)}`;
    preview.hidden = false;
  } else if (preview) {
    previewImg.removeAttribute('src');
    previewRef.textContent = '';
    preview.hidden = true;
  }

  document.getElementById('order-form-error').hidden = true;
  showOrderChannels();
  const wasClosed = orderModal.hidden;
  orderModal.hidden = false;
  updateScrollLock();
  if (wasClosed) pushOverlayState();
}

function closeOrderModal() {
  if (!orderModal) return;
  orderModal.hidden = true;
  updateScrollLock();
}

if (orderForm) {
  // Quantity − / + steppers (number-input spinners don't show on mobile).
  orderForm.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = orderForm.qty;
      const current = parseInt(input.value, 10) || 1;
      input.value = Math.max(1, current + Number(btn.dataset.step));
    });
  });

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(orderForm);
    const name = (data.get('name') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const address = (data.get('address') || '').toString().trim();

    if (!name || !phone || !address) {
      document.getElementById('order-form-error').hidden = false;
      return;
    }

    const ref = (data.get('ref') || '').toString().trim();
    const qty = (data.get('qty') || '1').toString().trim();
    const notes = (data.get('notes') || '').toString().trim();

    // Buyer-voice WhatsApp message. Labels are bold via *asterisks* (WhatsApp's
    // markup). Emoji-free on purpose: the Instagram in-app browser mangles emoji
    // when it hands the wa.me link to WhatsApp, so we keep it plain text + bold.
    const lines = [`Hi! I'd like to order from your website:`, ''];
    if (orderModalItem) {
      lines.push(`*Design:* ${orderModalItem.title} (Ref ${ref})`);
      lines.push(`*Price:* ${formatPrice(orderModalItem)} × ${qty}`);
      lines.push(`*Photo:* ${new URL(orderModalItem.src, window.location.href).href}`);
    } else {
      const matched = findItemByQuery(ref);
      if (matched) {
        lines.push(`*Design:* ${matched.title} (Ref ${refCode(matched)})`);
        lines.push(`*Price:* ${formatPrice(matched)} × ${qty}`);
        lines.push(`*Photo:* ${new URL(matched.src, window.location.href).href}`);
      } else {
        lines.push(`*Design:* ${ref || 'custom (see notes)'}`);
        lines.push(`*Qty:* ${qty}`);
      }
    }
    if (notes) lines.push(`*Notes:* ${notes}`);
    lines.push('');
    lines.push(`*Name:* ${name}`);
    lines.push(`*Phone:* ${phone}`);
    lines.push(`*Address:* ${address}`);
    lines.push('');
    lines.push(`Cash on delivery — please confirm the total & delivery time. Thank you!`);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
    dismissOverlay();
    showToast('Opening WhatsApp with your order details… 💬');
  });
}

if (orderModal) {
  orderModal.querySelector('.order-modal-close')?.addEventListener('click', dismissOverlay);
  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) dismissOverlay();
  });
  document.getElementById('choose-wa')?.addEventListener('click', showOrderForm);
  document.getElementById('choose-ig')?.addEventListener('click', orderViaInstagram);
  document.getElementById('order-form-back')?.addEventListener('click', showOrderChannels);
}

// Header "Contact" → contact modal (WhatsApp / Instagram / Email)
document.getElementById('nav-contact')?.addEventListener('click', (e) => {
  e.preventDefault();
  openContactModal();
});
if (contactModal) {
  document.getElementById('contact-close')?.addEventListener('click', dismissOverlay);
  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) dismissOverlay();
  });
}

document.getElementById('order-section-btn')?.addEventListener('click', () => startOrder(null));

// Logo = home. Refresh to a clean homepage: drops any ?design / #hash and resets
// the filter, sort and scroll position back to defaults.
document.querySelector('.logo')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (window.location.search || window.location.hash) {
    window.location.href = window.location.pathname;
  } else {
    window.location.reload();
  }
});

// Share a design — native share sheet on mobile, copy-link fallback on desktop.
// The link deep-links back to this exact product via ?design=<ref>.
async function shareItem(item) {
  if (!item) return;
  const ref = ((item.src || '').match(/(\d+)/) || [])[1] || '';
  const url = `${location.origin}${location.pathname}?design=${ref}`;
  const text = `${item.title} — ${formatPrice(item)} · handmade crochet keychain 🧶`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Crochet Keychains', text, url }); }
    catch (e) { /* user dismissed the share sheet */ }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied — share it anywhere 🔗');
  } catch (e) {
    showToast('Share this link: ' + url);
  }
}

function buildGalleryCard(item, index) {
  const card = document.createElement('article');
  card.className = 'product-card gallery-card';
  const badge = badgeFor(item);
  const faved = favorites.has(item.src);
  card.innerHTML = `
    <button class="gallery-trigger" type="button" data-index="${index}" aria-label="View ${item.title}">
      <div class="product-image">
        <img src="${item.src}" alt="${item.alt}" loading="lazy">
        ${badge ? `<span class="product-badge ${badge.cls}">${badge.text}</span>` : ''}
      </div>
    </button>
    <button type="button" class="fav-btn ${faved ? 'is-fav' : ''}" data-src="${item.src}" aria-label="Save ${item.title}" aria-pressed="${faved}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.7-4.35-9.33-7.5C.9 11.27 1.1 8.28 3.1 6.6a4.6 4.6 0 0 1 6.02.36L12 9.6l2.88-2.64a4.6 4.6 0 0 1 6.02-.36c2 1.68 2.2 4.67.43 6.9C18.7 16.65 12 21 12 21z"/></svg>
    </button>
    <div class="product-info product-info-compact">
      <span class="product-name">${item.title}</span>
      ${socialProofHtml(item)}
      <div class="product-footer">
        <span class="price">${formatPriceHtml(item)}</span>
        <button type="button" class="product-link order-btn" data-index="${index}">Order →</button>
      </div>
    </div>
  `;
  return card;
}

function openLightbox(index) {
  if (!lightbox || viewItems.length === 0) return;
  const wasClosed = lightbox.hidden;
  lightboxIndex = index;
  const item = viewItems[lightboxIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;
  if (lightboxTitle) lightboxTitle.textContent = item.title;
  if (lightboxMeta) {
    const parts = [];
    if (item.rating) parts.push(`<span class="meta-star">★</span> ${item.rating} (${item.reviews} review${item.reviews > 1 ? 's' : ''})`);
    parts.push('Handmade');
    if (item.sold) parts.push(`<span class="meta-sold">${Number(item.sold).toLocaleString('en-US')} sold</span>`);
    lightboxMeta.innerHTML = parts.join(' · ');
  }
  if (lightboxPrice) lightboxPrice.innerHTML = formatPriceHtml(item);
  if (lightboxCounter) lightboxCounter.textContent = `${lightboxIndex + 1} / ${viewItems.length}`;
  lightbox.hidden = false;
  updateScrollLock();
  if (wasClosed) pushOverlayState();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  lightboxImg.src = '';
  updateScrollLock();
}

// ---- Overlay history: the phone's Back button closes the lightbox / order modal
// (returning to the product list) instead of leaving the site. Every close routes
// through history.back(); popstate performs the actual close. ----
function overlayOpen() {
  return (lightbox && !lightbox.hidden) ||
    (orderModal && !orderModal.hidden) ||
    (contactModal && !contactModal.hidden);
}

function openContactModal() {
  if (!contactModal) return;
  const wasClosed = contactModal.hidden;
  contactModal.hidden = false;
  updateScrollLock();
  if (wasClosed) pushOverlayState();
}
function closeContactModal() {
  if (!contactModal) return;
  contactModal.hidden = true;
  updateScrollLock();
}
let lockedScrollY = 0;
function updateScrollLock() {
  const open = overlayOpen();
  const locked = document.body.classList.contains('lightbox-open');
  if (open && !locked) {
    // Pin the body at the current scroll position so the page can't move behind
    // the overlay (iOS ignores overflow:hidden; position:fixed is what works).
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.classList.add('lightbox-open');
  } else if (!open && locked) {
    document.body.classList.remove('lightbox-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }
}
function pushOverlayState() {
  history.pushState({ overlay: true }, '');
}
function dismissOverlay() {
  if (history.state && history.state.overlay) {
    history.back();
  } else {
    closeOrderModal();
    closeContactModal();
    closeLightbox();
  }
}
window.addEventListener('popstate', () => {
  if (contactModal && !contactModal.hidden) closeContactModal();
  else if (orderModal && !orderModal.hidden) closeOrderModal();
  else if (lightbox && !lightbox.hidden) closeLightbox();
});

function showNext(delta) {
  if (viewItems.length === 0) return;
  lightboxIndex = (lightboxIndex + delta + viewItems.length) % viewItems.length;
  openLightbox(lightboxIndex);
}

// Emit Product structured data (schema.org) for every design — helps Google show
// rich results (price, ratings) and feeds answer/generative engines.
function injectProductSchema(items) {
  const base = SITE_URL.replace(/\/$/, '');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Handmade Crochet Keychains',
    itemListElement: items.map((it, i) => {
      const product = {
        '@type': 'Product',
        name: it.title,
        image: `${base}/${it.src}`,
        description: it.alt,
        category: 'Crochet Keychain',
        brand: { '@type': 'Brand', name: 'Crochet Keychains' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'PKR',
          price: it.price,
          availability: 'https://schema.org/InStock',
          url: `${base}/#gallery`,
        },
      };
      if (it.rating && it.reviews) {
        product.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: it.rating,
          reviewCount: it.reviews,
          bestRating: 5,
          worstRating: 1,
        };
      }
      return { '@type': 'ListItem', position: i + 1, item: product };
    }),
  };
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(schema);
  document.head.appendChild(tag);
}

// ---- Browsing pipeline: filter (category / saved) + sort + lazy batches ----
function computeView() {
  let items = galleryItems.filter((it) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'fav') return favorites.has(it.src);
    return categoryOf(it) === activeCategory;
  });
  const by = activeSort;
  if (by === 'popular') items = items.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0) || (b.rating || 0) - (a.rating || 0));
  else if (by === 'price-asc') items = items.slice().sort((a, b) => (a.price || 0) - (b.price || 0));
  else if (by === 'price-desc') items = items.slice().sort((a, b) => (b.price || 0) - (a.price || 0));
  // 'featured' keeps catalog order
  return items;
}

function updateGalleryCount() {
  if (!galleryCount) return;
  if (activeCategory === 'all') {
    // Default view stays clean — no count line.
    galleryCount.textContent = '';
    galleryCount.hidden = true;
  } else if (activeCategory === 'fav') {
    galleryCount.textContent = viewItems.length
      ? `${viewItems.length} saved design${viewItems.length === 1 ? '' : 's'}`
      : 'No saved designs yet';
    galleryCount.hidden = false;
  } else {
    galleryCount.textContent = `${viewItems.length} of ${galleryItems.length} designs`;
    galleryCount.hidden = false;
  }
}

function renderNextBatch() {
  if (renderedCount >= viewItems.length) return;
  const frag = document.createDocumentFragment();
  const end = Math.min(renderedCount + BATCH_SIZE, viewItems.length);
  for (let i = renderedCount; i < end; i++) {
    frag.appendChild(buildGalleryCard(viewItems[i], i));
  }
  galleryGrid.appendChild(frag);
  renderedCount = end;
}

// Render every remaining card now. Used before an in-page anchor jump so the
// page height is final — otherwise lazy batches load mid-scroll and push the
// target (e.g. #about / #order) down, leaving the jump stuck in the gallery.
function flushAllGalleryItems() {
  while (renderedCount < viewItems.length) renderNextBatch();
}

function resetView() {
  viewItems = computeView();
  renderedCount = 0;
  galleryGrid.innerHTML = '';
  if (viewItems.length === 0) {
    galleryGrid.innerHTML = '<p class="gallery-empty">No saved designs yet — tap the ♥ on any design to keep it here.</p>';
  } else {
    renderNextBatch();
  }
  updateGalleryCount();
}

function buildFilterChips() {
  const chipsEl = document.getElementById('filter-chips');
  if (!chipsEl) return;
  // Which categories actually have products
  const present = new Set(galleryItems.map(categoryOf));
  const chips = [{ id: 'all', label: 'All' }];
  CATEGORY_DEFS.forEach((c) => { if (present.has(c.id)) chips.push({ id: c.id, label: c.label }); });
  chips.push({ id: 'fav', label: '♥ Saved' });

  chipsEl.innerHTML = chips.map((c) =>
    `<button type="button" class="chip ${c.id === activeCategory ? 'active' : ''}" data-cat="${c.id}" role="tab" aria-selected="${c.id === activeCategory}">${c.label}</button>`
  ).join('');

  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    setActiveCategory(chip.dataset.cat);
  });
}

function toggleFavorite(src, btn) {
  if (favorites.has(src)) favorites.delete(src);
  else favorites.add(src);
  try { localStorage.setItem(FAVES_KEY, JSON.stringify([...favorites])); } catch (e) {}
  if (btn) {
    const on = favorites.has(src);
    btn.classList.toggle('is-fav', on);
    btn.setAttribute('aria-pressed', on);
  }
  updateSavedCount();
  if (activeCategory === 'fav') resetView();
}

// Keep the header "saved" badge in sync with the number of hearted designs.
function updateSavedCount() {
  const count = document.getElementById('nav-saved-count');
  if (!count) return;
  const n = favorites.size;
  count.textContent = n;
  count.hidden = n === 0;
}

// Single entry point for switching filters. Used by both the chips and the
// header heart so the active state can never drift between them.
function setActiveCategory(cat) {
  activeCategory = cat;
  const chipsEl = document.getElementById('filter-chips');
  let activeChip = null;
  if (chipsEl) {
    chipsEl.querySelectorAll('.chip').forEach((b) => {
      const on = b.dataset.cat === cat;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on);
      if (on) activeChip = b;
    });
    // Keep the selected chip visible in the horizontally-scrolling strip,
    // otherwise (e.g. "♥ Saved" at the far right) it looks like nothing is active.
    if (activeChip) {
      const target = activeChip.offsetLeft - (chipsEl.clientWidth - activeChip.clientWidth) / 2;
      chipsEl.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
    }
  }
  // Header heart fills only while the saved filter is the active one.
  document.getElementById('nav-saved')?.classList.toggle('is-active', cat === 'fav');
  resetView();
  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Header heart is a toggle: ON → saved-only, OFF → back to all products.
function toggleSavedFilter() {
  setActiveCategory(activeCategory === 'fav' ? 'all' : 'fav');
}

async function loadGallery() {
  if (!galleryGrid) return;

  try {
    const response = await fetch('images/manifest.json?v=7');
    if (!response.ok) throw new Error('Could not load gallery');
    galleryItems = await response.json();

    buildFilterChips();
    resetView();
    updateSavedCount();

    buildHeroCards(galleryItems);
    injectProductSchema(galleryItems);

    // Event delegation: works across lazily-added batches.
    galleryGrid.addEventListener('click', (e) => {
      const fav = e.target.closest('.fav-btn');
      if (fav) { toggleFavorite(fav.dataset.src, fav); return; }
      const order = e.target.closest('.order-btn');
      if (order) { startOrder(viewItems[Number(order.dataset.index)]); return; }
      const trigger = e.target.closest('.gallery-trigger');
      if (trigger) { openLightbox(Number(trigger.dataset.index)); }
    });

    // Header heart toggles the saved filter on/off
    document.getElementById('nav-saved')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSavedFilter();
    });

    // Sort control
    const sortSel = document.getElementById('sort-select');
    sortSel?.addEventListener('change', () => { activeSort = sortSel.value; resetView(); });

    // Infinite scroll: load more as the sentinel approaches the viewport.
    const sentinel = document.getElementById('gallery-sentinel');
    if (sentinel && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) renderNextBatch();
      }, { rootMargin: '800px' }).observe(sentinel);
    }

    // Deep link: ?design=<ref> opens that product (used by the Share button) so a
    // shared link lands on the exact design even though this is a single page.
    const designRef = new URLSearchParams(location.search).get('design');
    if (designRef) {
      // Normalise to a leading-zero-insensitive number so 96 / 096 / %23096 all match.
      const want = (designRef.match(/\d+/) || [''])[0].replace(/^0+/, '') || '0';
      const numOf = (it) => {
        const m = (it.src || '').match(/(\d+)/);
        return m ? m[1].replace(/^0+/, '') : null;
      };
      const idx = viewItems.findIndex((it) => numOf(it) === want);
      if (idx >= 0) openLightbox(idx);
    }
  } catch (err) {
    galleryGrid.innerHTML = '<p class="gallery-error">Could not load photos. Make sure the local server is running.</p>';
    console.error(err);
  }
}

// Back-to-top floating button
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => { backToTop.hidden = window.scrollY < 600; }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

let toastTimer;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

if (lightbox) {
  lightbox.querySelector('.lightbox-close')?.addEventListener('click', dismissOverlay);
  lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => showNext(-1));
  lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => showNext(1));
  lightbox.querySelector('.lightbox-order')?.addEventListener('click', () => {
    if (viewItems[lightboxIndex]) startOrder(viewItems[lightboxIndex]);
  });
  lightbox.querySelector('.lightbox-share')?.addEventListener('click', () => {
    if (viewItems[lightboxIndex]) shareItem(viewItems[lightboxIndex]);
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) dismissOverlay();
  });

  // Swipe left/right to move between products (mobile/touch).
  let touchStartX = 0;
  let touchStartY = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Horizontal swipe only: enough distance, and more horizontal than vertical.
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      showNext(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && orderModal && !orderModal.hidden) {
      dismissOverlay();
      return;
    }
    if (lightbox.hidden) return;
    if (e.key === 'Escape') dismissOverlay();
    if (e.key === 'ArrowRight') showNext(1);
    if (e.key === 'ArrowLeft') showNext(-1);
  });
}

loadGallery();
