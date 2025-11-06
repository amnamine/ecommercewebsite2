(() => {
  const apiBase = '';

  const els = {
    grid: document.getElementById('products-grid'),
    chips: document.getElementById('category-chips'),
    search: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    cartBtn: document.getElementById('cart-btn'),
    cartCount: document.getElementById('cart-count'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    closeCart: document.getElementById('close-cart'),
    checkoutBtn: document.getElementById('checkout-btn'),
    backdrop: document.getElementById('drawer-backdrop'),
    toast: document.getElementById('toast'),
    year: document.getElementById('year')
  };

  const state = {
    products: [],
    categories: [],
    selectedCategory: null,
    q: '',
    cart: loadCart()
  };

  function loadCart() {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }

  function formatCurrency(n) { return `$${n.toFixed(2)}`; }

  async function fetchCategories() {
    const res = await fetch(`${apiBase}/api/categories`);
    state.categories = await res.json();
  }

  async function fetchProducts() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.selectedCategory) params.set('category', state.selectedCategory);
    const res = await fetch(`${apiBase}/api/products?${params.toString()}`);
    state.products = await res.json();
  }

  function renderChips() {
    const chips = ['All', ...state.categories];
    els.chips.innerHTML = chips.map(c => {
      const active = (!state.selectedCategory && c === 'All') || state.selectedCategory === c;
      return `<button class="chip ${active ? 'active' : ''}" data-cat="${c}">${c}</button>`;
    }).join('');
    [...els.chips.querySelectorAll('.chip')].forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.cat;
        state.selectedCategory = c === 'All' ? null : c;
        refresh();
      });
    });
  }

  function renderProducts() {
    if (!state.products.length) {
      els.grid.innerHTML = `<div class="hero">No products found.</div>`;
      return;
    }
    els.grid.innerHTML = state.products.map(p => cardHtml(p)).join('');
    attachCardEvents();
  }

  function cardHtml(p) {
    return `
      <article class="card" data-id="${p.id}">
        <img src="${p.image_url}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/640x360'">
        <div class="body">
          <div class="title">${escapeHtml(p.name)}</div>
          <div class="desc">${escapeHtml(p.description || '')}</div>
          <div class="price-row">
            <div class="price">${formatCurrency(p.price)}</div>
            <div class="qty">
              <button class="icon-btn dec" title="Decrease">−</button>
              <span class="count">1</span>
              <button class="icon-btn inc" title="Increase">+</button>
            </div>
          </div>
          <button class="primary-btn add">Add to Cart</button>
        </div>
      </article>
    `;
  }

  function attachCardEvents() {
    els.grid.querySelectorAll('.card').forEach(card => {
      const countEl = card.querySelector('.count');
      let count = 1;
      card.querySelector('.inc').addEventListener('click', () => {
        count = Math.min(count + 1, 99); countEl.textContent = String(count);
      });
      card.querySelector('.dec').addEventListener('click', () => {
        count = Math.max(count - 1, 1); countEl.textContent = String(count);
      });
      card.querySelector('.add').addEventListener('click', () => {
        const id = Number(card.dataset.id);
        const product = state.products.find(x => x.id === id);
        addToCart(product, count);
      });
    });
  }

  function addToCart(product, qty) {
    const idx = state.cart.findIndex(it => it.product_id === product.id);
    if (idx >= 0) state.cart[idx].quantity += qty;
    else state.cart.push({ product_id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: qty });
    saveCart();
    updateCartBadge();
    showToast(`${escapeHtml(product.name)} added to cart`);
  }

  function updateCartBadge() {
    const count = state.cart.reduce((a, b) => a + b.quantity, 0);
    els.cartCount.textContent = String(count);
  }

  function renderCart() {
    if (!state.cart.length) {
      els.cartItems.innerHTML = `<div class="hero">Your cart is empty.</div>`;
      els.cartSubtotal.textContent = '$0.00';
      return;
    }
    els.cartItems.innerHTML = state.cart.map(it => `
      <div class="cart-item" data-id="${it.product_id}">
        <img src="${it.image_url}" alt="${escapeHtml(it.name)}">
        <div>
          <div class="name">${escapeHtml(it.name)}</div>
          <div class="muted">${formatCurrency(it.price)}</div>
          <div class="qty" style="margin-top:6px">
            <button class="icon-btn dec">−</button>
            <span class="count">${it.quantity}</span>
            <button class="icon-btn inc">+</button>
          </div>
        </div>
        <div>
          <button class="icon-btn remove" title="Remove">✕</button>
        </div>
      </div>
    `).join('');

    els.cartItems.querySelectorAll('.cart-item').forEach(row => {
      const id = Number(row.dataset.id);
      const countEl = row.querySelector('.count');
      row.querySelector('.inc').addEventListener('click', () => {
        const it = state.cart.find(x => x.product_id === id); it.quantity++; countEl.textContent = String(it.quantity); saveCart(); updateCartBadge(); updateSubtotal();
      });
      row.querySelector('.dec').addEventListener('click', () => {
        const it = state.cart.find(x => x.product_id === id); it.quantity = Math.max(1, it.quantity - 1); countEl.textContent = String(it.quantity); saveCart(); updateCartBadge(); updateSubtotal();
      });
      row.querySelector('.remove').addEventListener('click', () => {
        state.cart = state.cart.filter(x => x.product_id !== id); saveCart(); renderCart(); updateCartBadge();
      });
    });

    updateSubtotal();
  }

  function updateSubtotal() {
    const subtotal = state.cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
    els.cartSubtotal.textContent = formatCurrency(subtotal);
  }

  async function checkout() {
    if (!state.cart.length) return;
    els.checkoutBtn.disabled = true;
    try {
      const res = await fetch(`${apiBase}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.cart.map(it => ({ product_id: it.product_id, quantity: it.quantity })) })
      });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      state.cart = []; saveCart(); renderCart(); updateCartBadge();
      showToast(`Order #${data.id} placed! Total ${formatCurrency(data.total)}`);
      closeDrawer();
      refresh();
    } catch (e) {
      showToast('Failed to checkout. Please try again.');
    } finally {
      els.checkoutBtn.disabled = false;
    }
  }

  function openDrawer() {
    els.cartDrawer.classList.add('open');
    els.backdrop.classList.add('show');
    els.cartDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeDrawer() {
    els.cartDrawer.classList.remove('open');
    els.backdrop.classList.remove('show');
    els.cartDrawer.setAttribute('aria-hidden', 'true');
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2200);
  }

  async function refresh() {
    await fetchProducts();
    renderChips();
    renderProducts();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  // Events
  els.searchBtn.addEventListener('click', () => { state.q = els.search.value.trim(); refresh(); });
  els.search.addEventListener('keydown', e => { if (e.key === 'Enter') { state.q = els.search.value.trim(); refresh(); } });
  els.cartBtn.addEventListener('click', () => { renderCart(); openDrawer(); });
  els.closeCart.addEventListener('click', closeDrawer);
  els.backdrop.addEventListener('click', closeDrawer);
  els.checkoutBtn.addEventListener('click', checkout);

  // Init
  updateCartBadge();
  els.year.textContent = new Date().getFullYear();
  (async () => {
    try { await fetchCategories(); } catch (_) {}
    await refresh();
  })();
})();
