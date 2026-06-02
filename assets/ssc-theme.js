(() => {
  // Rp 500.000 in Shopify's internal "cents" representation (IDR × 100)
  const FREE_SHIP = 50_000_000;

  const fmt = v => 'Rp ' + Math.round(v / 100).toLocaleString('id-ID');

  // ── Cart API ──────────────────────────────────────────────────────────────
  const cartGet = () => fetch('/cart.js').then(r => r.json());

  const cartAdd = data => fetch('/cart/add.js', {
    method: 'POST',
    body: data instanceof FormData ? data : new URLSearchParams(data),
  }).then(async r => {
    if (!r.ok) { const e = await r.json(); throw new Error(e.description || 'Could not add to cart'); }
    return r.json();
  });

  const cartChange = (line, qty) => fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ line, quantity: qty }),
  }).then(r => r.json());

  // ── Drawer open / close ───────────────────────────────────────────────────
  const openDrawer = () => document.body.classList.add('ssc-drawer-open');
  const closeDrawer = () => document.body.classList.remove('ssc-drawer-open');

  function setCount(n) {
    document.querySelectorAll('.ssc-cart-count').forEach(el => {
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderShipping(bar, total) {
    const rem = FREE_SHIP - total;
    const pct = Math.min(100, (total / FREE_SHIP) * 100).toFixed(1);
    bar.querySelector('.ssc-shipping-bar__fill').style.width = pct + '%';
    bar.querySelector('.ssc-shipping-bar__msg').innerHTML = rem > 0
      ? `Add <strong>${fmt(rem)}</strong> more for <strong>free shipping</strong>`
      : '<strong>🎉 You\'ve unlocked free shipping!</strong>';
  }

  function renderItems(wrap, items) {
    if (!items.length) {
      wrap.innerHTML = `
        <div class="ssc-cart-drawer__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>Your bag is empty.</p>
          <a href="/collections/all">Browse collection &rarr;</a>
        </div>`;
      return;
    }

    wrap.innerHTML = items.map((item, i) => {
      const imgSrc = item.image
        ? item.image.replace(/(\.\w+)(\?.*)?$/, '_120x$1$2')
        : '';
      const variant = (item.variant_title && item.variant_title !== 'Default Title')
        ? `<p class="ssc-drawer-item__variant">${item.variant_title}</p>` : '';
      return `
        <div class="ssc-drawer-item" data-line="${i + 1}">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${item.product_title}" loading="lazy">`
            : '<div class="ssc-drawer-item__ph"></div>'}
          <div class="ssc-drawer-item__body">
            <p class="ssc-drawer-item__name">${item.product_title}</p>
            ${variant}
            <div class="ssc-stepper ssc-drawer-item__qty">
              <button type="button" data-ssc-minus aria-label="Decrease">&minus;</button>
              <input type="number" value="${item.quantity}" min="0" aria-label="Qty" readonly>
              <button type="button" data-ssc-plus aria-label="Increase">+</button>
            </div>
          </div>
          <div class="ssc-drawer-item__side">
            <span>${fmt(item.final_line_price)}</span>
            <button class="ssc-drawer-item__rm" data-rm="${i + 1}" aria-label="Remove item">&times;</button>
          </div>
        </div>`;
    }).join('');
  }

  async function refreshDrawer(preloaded) {
    const d = document.querySelector('.ssc-cart-drawer');
    if (!d) return;
    const cart = preloaded || await cartGet();
    renderItems(d.querySelector('.ssc-cart-drawer__items'), cart.items || []);
    const bar = d.querySelector('.ssc-shipping-bar');
    if (bar) renderShipping(bar, cart.total_price || 0);
    const sub = d.querySelector('[data-drawer-subtotal]');
    if (sub) sub.textContent = fmt(cart.total_price || 0);
    setCount(cart.item_count || 0);
  }

  // ── Variant picker ────────────────────────────────────────────────────────
  document.querySelectorAll('.ssc-product').forEach(product => {
    const vNode = product.querySelector('[data-ssc-variants]');
    const form = product.querySelector('.ssc-product-form');
    if (!vNode || !form) return;

    let variants;
    try { variants = JSON.parse(vNode.textContent); } catch { return; }

    const idInput = form.querySelector('input[name="id"]');
    const mainBtn = form.querySelector('button[type="submit"]');
    const stickyBtn = document.querySelector('.ssc-sticky-atc button');
    const priceEl = product.querySelector('.ssc-price');
    const stockEl = product.querySelector('.ssc-stock');
    const stickyPrice = document.querySelector('.ssc-sticky-atc__price');

    form.addEventListener('change', () => {
      const selected = Array.from(form.querySelectorAll('.ssc-option'))
        .map(fs => fs.querySelector('input:checked')?.value);
      const v = variants.find(v => selected.every((s, i) => v.options[i] === s));
      if (!v || !idInput) return;

      idInput.value = v.id;
      if (priceEl) priceEl.textContent = fmt(v.price);
      if (stickyPrice) stickyPrice.textContent = fmt(v.price);

      const label = v.available ? 'Add to Cart' : 'Sold Out';
      [mainBtn, stickyBtn].filter(Boolean).forEach(b => {
        b.disabled = !v.available;
        b.textContent = label;
      });

      if (stockEl) {
        if (!v.available) {
          stockEl.textContent = 'Sold out';
          stockEl.className = 'ssc-stock';
        } else if (v.inventory_quantity > 0 && v.inventory_quantity <= 5) {
          stockEl.textContent = `Only ${v.inventory_quantity} left!`;
          stockEl.className = 'ssc-stock';
        } else {
          stockEl.textContent = 'In stock';
          stockEl.className = 'ssc-stock ssc-stock--ok';
        }
      }

      if (v.featured_image) {
        const img = product.querySelector('.ssc-product__image img');
        if (img) { img.src = v.featured_image.src; img.srcset = ''; }
      }
    });
  });

  // ── AJAX add-to-cart ──────────────────────────────────────────────────────
  document.querySelectorAll('.ssc-product-form').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const mainBtn = form.querySelector('button[type="submit"]');
      const stickyBtn = document.querySelector('.ssc-sticky-atc button');
      const btns = [mainBtn, stickyBtn].filter(Boolean);

      btns.forEach(b => { b.classList.add('ssc-button--loading'); b.textContent = 'Adding…'; });

      try {
        await cartAdd(new FormData(form));
        const cart = await cartGet();
        await refreshDrawer(cart);
        openDrawer();
        btns.forEach(b => { b.classList.remove('ssc-button--loading'); b.textContent = '✓ Added'; });
        setTimeout(() => btns.forEach(b => {
          b.textContent = b.disabled ? 'Sold Out' : 'Add to Cart';
        }), 2000);
      } catch {
        btns.forEach(b => { b.classList.remove('ssc-button--loading'); b.textContent = 'Try Again'; });
        setTimeout(() => btns.forEach(b => { b.textContent = 'Add to Cart'; }), 2500);
      }
    });
  });

  // ── Sticky ATC ────────────────────────────────────────────────────────────
  const mainAtc = document.querySelector('.ssc-product-form button[type="submit"]');
  const stickyBar = document.querySelector('.ssc-sticky-atc');

  if (mainAtc && stickyBar) {
    new IntersectionObserver(
      ([entry]) => stickyBar.classList.toggle('is-visible', !entry.isIntersecting),
      { rootMargin: '0px 0px -80px 0px' }
    ).observe(mainAtc);

    stickyBar.querySelector('button')?.addEventListener('click', () => {
      document.querySelector('.ssc-product-form')
        ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  }

  // ── Global click delegation ───────────────────────────────────────────────
  document.addEventListener('click', async e => {
    // Open drawer
    if (e.target.closest('.ssc-cart-drawer-toggle')) {
      e.preventDefault();
      await refreshDrawer();
      openDrawer();
      return;
    }

    // Close drawer
    if (e.target.closest('.ssc-drawer-overlay') || e.target.closest('.ssc-cart-drawer__close')) {
      closeDrawer();
      return;
    }

    // Remove item from drawer
    const rm = e.target.closest('[data-rm]');
    if (rm?.closest('.ssc-cart-drawer')) {
      await cartChange(Number(rm.dataset.rm), 0);
      await refreshDrawer();
      return;
    }

    // Drawer quantity stepper
    const drawerItem = e.target.closest('.ssc-drawer-item');
    if (drawerItem) {
      const minus = e.target.closest('[data-ssc-minus]');
      const plus = e.target.closest('[data-ssc-plus]');
      if (minus || plus) {
        const input = drawerItem.querySelector('input[type="number"]');
        const line = Number(drawerItem.dataset.line);
        const newQty = Math.max(0, Number(input.value) + (minus ? -1 : 1));
        input.value = newQty;
        await cartChange(line, newQty);
        await refreshDrawer();
        return;
      }
    }

    // Page stepper (product / cart page)
    const minus = e.target.closest('[data-ssc-minus]');
    const plus = e.target.closest('[data-ssc-plus]');
    if (minus || plus) {
      const wrap = (minus || plus).closest('.ssc-stepper');
      const input = wrap?.querySelector('input');
      if (!input) return;
      input.value = Math.max(Number(input.min || 0), Number(input.value || 0) + (minus ? -1 : 1));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Product thumbnail gallery
    const thumb = e.target.closest('[data-ssc-thumb]');
    if (thumb) {
      const product = thumb.closest('.ssc-product');
      const img = product?.querySelector('.ssc-product__image img');
      if (img) {
        img.src = thumb.dataset.sscThumb;
        img.srcset = '';
        img.alt = thumb.dataset.sscAlt || img.alt;
      }
      thumb.closest('.ssc-thumbs')?.querySelectorAll('button')
        .forEach(b => b.classList.remove('is-active'));
      thumb.classList.add('is-active');
    }
  });

  // ── Init cart count on load ───────────────────────────────────────────────
  cartGet().then(c => setCount(c.item_count)).catch(() => {});
})();
