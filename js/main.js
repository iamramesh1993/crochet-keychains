const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.getElementById('year');
const galleryGrid = document.getElementById('gallery-grid');
const galleryCount = document.getElementById('gallery-count');
const heroVisual = document.getElementById('hero-visual');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');

let galleryItems = [];
let lightboxIndex = 0;

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
  return `Rs ${Number(item.price).toLocaleString('en-US')}`;
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
    orderForm.ref.value = refCode(item);
    orderForm.ref.readOnly = true;
    orderForm.ref.placeholder = '';
    if (refLabel) refLabel.textContent = 'Design ref';
  } else {
    orderForm.ref.value = '';
    orderForm.ref.readOnly = false;
    orderForm.ref.placeholder = 'Design name or ref — or a custom idea';
    if (refLabel) refLabel.textContent = 'Which design?';
  }
  if (refField) refField.hidden = false;

  const title = document.getElementById('order-modal-title');
  if (title) title.textContent = item ? 'Order this keychain' : 'Place your order';

  const preview = document.getElementById('order-modal-preview');
  const previewImg = document.getElementById('order-modal-img');
  const previewRef = document.getElementById('order-modal-ref');
  if (preview && item) {
    previewImg.src = item.src;
    previewImg.alt = item.alt;
    previewRef.textContent = `${item.title} · ${formatPrice(item)} · Ref ${refCode(item)} · ${socialProofText(item)}`;
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

    // Written in the buyer's voice — this is the message the customer sends to us.
    const lines = [];
    if (orderModalItem) {
      lines.push(`Hi! 👋 I'd like to order this from your website:`);
      lines.push('');
      lines.push(`🧶 ${orderModalItem.title} (Ref ${ref})`);
      lines.push(`💰 ${formatPrice(orderModalItem)}  ·  Qty: ${qty}`);
      lines.push(`📷 ${new URL(orderModalItem.src, window.location.href).href}`);
    } else {
      lines.push(`Hi! 👋 I'd like to order from your website.`);
      lines.push('');
      lines.push(ref ? `🧶 Design: ${ref}  ·  Qty: ${qty}` : `🧶 Custom design  ·  Qty: ${qty}`);
    }
    if (notes) lines.push(`📝 ${notes}`);
    lines.push('');
    lines.push(`My delivery details (cash on delivery):`);
    lines.push(`👤 ${name}`);
    lines.push(`📞 ${phone}`);
    lines.push(`📍 ${address}`);
    lines.push('');
    lines.push(`Could you please confirm the total and delivery time? Thank you! 🙏`);

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

document.getElementById('order-section-btn')?.addEventListener('click', () => startOrder(null));

function buildGalleryCard(item, index) {
  const card = document.createElement('article');
  card.className = 'product-card gallery-card';
  card.innerHTML = `
    <button class="gallery-trigger" type="button" data-index="${index}" aria-label="View ${item.title}">
      <div class="product-image">
        <img src="${item.src}" alt="${item.alt}" loading="lazy">
      </div>
    </button>
    <div class="product-info product-info-compact">
      <span class="product-name">${item.title}</span>
      ${socialProofHtml(item)}
      <div class="product-footer">
        <span class="price">${formatPrice(item)}</span>
        <button type="button" class="product-link order-btn" data-index="${index}">Order →</button>
      </div>
    </div>
  `;
  card.querySelector('.order-btn').addEventListener('click', () => startOrder(item));
  return card;
}

function openLightbox(index) {
  if (!lightbox || galleryItems.length === 0) return;
  const wasClosed = lightbox.hidden;
  lightboxIndex = index;
  const item = galleryItems[lightboxIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;
  lightboxCaption.textContent = `${item.title} · ${formatPrice(item)} · ${socialProofText(item)}`;
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
  return (lightbox && !lightbox.hidden) || (orderModal && !orderModal.hidden);
}
function updateScrollLock() {
  document.body.classList.toggle('lightbox-open', overlayOpen());
}
function pushOverlayState() {
  history.pushState({ overlay: true }, '');
}
function dismissOverlay() {
  if (history.state && history.state.overlay) {
    history.back();
  } else {
    closeOrderModal();
    closeLightbox();
  }
}
window.addEventListener('popstate', () => {
  if (orderModal && !orderModal.hidden) closeOrderModal();
  else if (lightbox && !lightbox.hidden) closeLightbox();
});

function showNext(delta) {
  if (galleryItems.length === 0) return;
  lightboxIndex = (lightboxIndex + delta + galleryItems.length) % galleryItems.length;
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

async function loadGallery() {
  if (!galleryGrid) return;

  try {
    const response = await fetch('images/manifest.json?v=7');
    if (!response.ok) throw new Error('Could not load gallery');
    galleryItems = await response.json();

    galleryGrid.innerHTML = '';
    galleryItems.forEach((item, index) => {
      galleryGrid.appendChild(buildGalleryCard(item, index));
    });

    if (galleryCount) {
      galleryCount.textContent = `${galleryItems.length} handmade designs · Rs 700–1500`;
    }

    buildHeroCards(galleryItems);
    injectProductSchema(galleryItems);

    galleryGrid.querySelectorAll('.gallery-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        openLightbox(Number(btn.dataset.index));
      });
    });
  } catch (err) {
    galleryGrid.innerHTML = '<p class="gallery-error">Could not load photos. Make sure the local server is running.</p>';
    console.error(err);
  }
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
    if (galleryItems[lightboxIndex]) startOrder(galleryItems[lightboxIndex]);
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
