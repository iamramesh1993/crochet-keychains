/* Product-page (/p/<ref>/) order flow.
 *
 * Turns the "Order on WhatsApp" button into the same guided order form used on
 * the homepage: it collects name, phone, delivery address, quantity and notes,
 * then opens WhatsApp with a rich, buyer-voice message (matching js/main.js).
 *
 * Progressive enhancement: the button is a real wa.me <a> link, so if this
 * script fails to load or JS is off, it still opens WhatsApp with a basic
 * prefilled message — the buyer is never stuck.
 *
 * CSP-safe: loaded as a same-origin external file (no inline script), reads the
 * product details from data-* attributes the build script bakes onto the form.
 */
(function () {
  var modal = document.getElementById('pdp-order-modal');
  var form = document.getElementById('pdp-order-form');
  var openBtn = document.querySelector('.pdp-order-open');
  if (!modal || !form || !openBtn) return;

  var D = form.dataset; // title, ref, price, photo, wa
  var err = document.getElementById('pdp-order-error');
  var nameInput = form.querySelector('[name="name"]');
  var qtyInput = form.querySelector('[name="qty"]');

  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; }
  function openModal() {
    modal.hidden = false;
    lockScroll(true);
    if (err) err.hidden = true;
    if (nameInput) { try { nameInput.focus(); } catch (e) {} }
  }
  function closeModal() {
    modal.hidden = true;
    lockScroll(false);
  }

  openBtn.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
  var closeBtn = modal.querySelector('.order-modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  // Quantity − / + steppers (mobile number inputs don't show spinners).
  var stepBtns = form.querySelectorAll('.qty-btn');
  for (var i = 0; i < stepBtns.length; i++) {
    stepBtns[i].addEventListener('click', function (btn) {
      return function () {
        var cur = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = Math.max(1, cur + Number(btn.getAttribute('data-step')));
      };
    }(stepBtns[i]));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var name = (fd.get('name') || '').toString().trim();
    var phone = (fd.get('phone') || '').toString().trim();
    var address = (fd.get('address') || '').toString().trim();
    if (!name || !phone || !address) {
      if (err) err.hidden = false;
      return;
    }
    var qty = (fd.get('qty') || '1').toString().trim();
    var notes = (fd.get('notes') || '').toString().trim();

    // Buyer-voice WhatsApp message — same shape/labels as the homepage flow.
    // Plain text + *bold* only (Instagram's in-app browser mangles emoji when
    // handing the wa.me link to WhatsApp).
    var lines = ["Hi! I'd like to order from your website:", ''];
    lines.push('*Design:* ' + D.title + ' (Ref ' + D.ref + ')');
    lines.push('*Price:* ' + D.price + ' × ' + qty);
    lines.push('*Photo:* ' + D.photo);
    lines.push('*Delivery:* PKR 250 (flat rate)');
    lines.push('*Payment:* Cash on Delivery or Easypaisa');
    if (notes) lines.push('*Notes:* ' + notes);
    lines.push('');
    lines.push('*Name:* ' + name);
    lines.push('*Phone:* ' + phone);
    lines.push('*Address:* ' + address);
    lines.push('');
    lines.push('Please confirm the total & delivery time. Thank you!');

    var url = 'https://wa.me/' + D.wa + '?text=' + encodeURIComponent(lines.join('\n'));
    var win = window.open(url, '_blank', 'noopener');
    if (!win) window.location.href = url; // in-app browsers that block window.open
    closeModal();
  });
})();
