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

function buildHeroCards(items) {
  if (!heroVisual || items.length === 0) return;

  const picks = [items[0], items[Math.floor(items.length / 3)], items[Math.floor(items.length / 2)]];
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

// Public site URL — used for structured data (SEO). When your custom domain is
// live, change this here AND the matching tags in index.html, sitemap.xml, robots.txt.
const SITE_URL = 'https://iamramesh1993.github.io/crochet-keychains';

const ORDER_DM_URL = 'https://ig.me/m/crochet_keychain.pk';
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
  if (orderModalItem) {
    const ref = refCode(orderModalItem);
    const message = `Hi! I'd like to order this crochet keychain 🧶\n${orderModalItem.title} — ${formatPrice(orderModalItem)} (Ref ${ref})`;
    try {
      await navigator.clipboard.writeText(message);
      showToast(`Reference ${ref} copied — paste it in the DM 💬`);
    } catch (err) {
      showToast(`Mention design ref ${ref} in your DM 💬`);
    }
  }
  window.open(ORDER_DM_URL, '_blank', 'noopener');
  closeOrderModal();
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
  orderForm.ref.value = item ? refCode(item) : '';

  // The "Design ref" field and the photo preview only make sense for a specific
  // product. For a generic "Book your order" (no item) hide both.
  const refField = document.getElementById('order-ref-field');
  if (refField) refField.hidden = !item;

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
  orderModal.hidden = false;
  document.body.classList.add('lightbox-open');
}

function closeOrderModal() {
  if (!orderModal) return;
  orderModal.hidden = true;
  document.body.classList.remove('lightbox-open');
}

if (orderForm) {
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

    const lines = [
      '🧶 New order from the website',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
    ];
    if (orderModalItem) {
      lines.push(`Design: ${orderModalItem.title} (Ref ${ref})`);
      lines.push(`Price: ${formatPrice(orderModalItem)}`);
    } else {
      lines.push('Design: (custom — see notes)');
    }
    lines.push(`Quantity: ${qty}`);
    if (notes) lines.push(`Notes: ${notes}`);
    if (orderModalItem) {
      lines.push(`Photo: ${new URL(orderModalItem.src, window.location.href).href}`);
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener');
    closeOrderModal();
    showToast('Opening WhatsApp with your order details… 💬');
  });
}

if (orderModal) {
  orderModal.querySelector('.order-modal-close')?.addEventListener('click', closeOrderModal);
  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) closeOrderModal();
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
  lightboxIndex = index;
  const item = galleryItems[lightboxIndex];
  lightboxImg.src = item.src;
  lightboxImg.alt = item.alt;
  lightboxCaption.textContent = `${item.title} · ${formatPrice(item)} · ${socialProofText(item)}`;
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.classList.remove('lightbox-open');
  lightboxImg.src = '';
}

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
        brand: { '@type': 'Brand', name: 'Crochet Keychain PK' },
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
    const response = await fetch('images/manifest.json?v=6');
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
  lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox-prev')?.addEventListener('click', () => showNext(-1));
  lightbox.querySelector('.lightbox-next')?.addEventListener('click', () => showNext(1));
  lightbox.querySelector('.lightbox-order')?.addEventListener('click', () => {
    if (galleryItems[lightboxIndex]) startOrder(galleryItems[lightboxIndex]);
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && orderModal && !orderModal.hidden) {
      closeOrderModal();
      return;
    }
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext(1);
    if (e.key === 'ArrowLeft') showNext(-1);
  });
}

loadGallery();
