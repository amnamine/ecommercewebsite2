(() => {
  const apiBase = '';

  const els = {
    grid: document.getElementById('products-grid'),
    chips: document.getElementById('category-chips'),
    sortSelect: document.getElementById('sort-select'),
    search: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    cartBtn: document.getElementById('cart-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    cartCount: document.getElementById('cart-count'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTax: document.getElementById('cart-tax'),
    cartShip: document.getElementById('cart-ship'),
    cartTotal: document.getElementById('cart-total'),
    promoCode: document.getElementById('promo-code'),
    applyPromo: document.getElementById('apply-promo'),
    closeCart: document.getElementById('close-cart'),
    checkoutBtn: document.getElementById('checkout-btn'),
    backdrop: document.getElementById('drawer-backdrop'),
    toast: document.getElementById('toast'),
    modalBackdrop: document.getElementById('modal-backdrop'),
    quickView: document.getElementById('quick-view'),
    closeModal: document.getElementById('close-modal'),
    modalImage: document.getElementById('modal-image'),
    modalTitle: document.getElementById('modal-title'),
    modalRating: document.getElementById('modal-rating'),
    modalDesc: document.getElementById('modal-desc'),
    modalPrice: document.getElementById('modal-price'),
    modalStock: document.getElementById('modal-stock'),
    modalDec: document.getElementById('modal-dec'),
    modalInc: document.getElementById('modal-inc'),
    modalCount: document.getElementById('modal-count'),
    modalAdd: document.getElementById('modal-add'),
    checkoutBackdrop: document.getElementById('checkout-backdrop'),
    checkoutModal: document.getElementById('checkout-modal'),
    closeCheckout: document.getElementById('close-checkout'),
    custName: document.getElementById('cust-name'),
    custEmail: document.getElementById('cust-email'),
    placeOrder: document.getElementById('place-order'),
    year: document.getElementById('year')
  };

  const state = {
    products: [],
    categories: [],
    selectedCategory: null,
    q: '',
    sort: 'newest',
    wishlist: loadWishlist(),
    cart: loadCart(),
    promoCode: null,
    theme: loadTheme()
  };

  function loadCart() {
    try {
      const raw = localStorage.getItem('cart');
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }
  function saveCart() { localStorage.setItem('cart', JSON.stringify(state.cart)); }
  function loadWishlist() {
    try { const raw = localStorage.getItem('wishlist'); return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
  }
  function saveWishlist() { localStorage.setItem('wishlist', JSON.stringify(state.wishlist)); }

  function formatCurrency(n) { return `$${n.toFixed(2)}`; }
  function loadTheme(){ try{ return localStorage.getItem('theme') || 'dark'; }catch(_){ return 'dark'; } }
  function saveTheme(){ localStorage.setItem('theme', state.theme); }

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
    // client-side sort
    if (state.sort === 'price_asc') state.products.sort((a,b)=>a.price-b.price);
    else if (state.sort === 'price_desc') state.products.sort((a,b)=>b.price-a.price);
    else state.products.sort((a,b)=>b.id-a.id);
    // wishlist filter
    if (state.selectedCategory === 'Wishlist') {
      state.products = state.products.filter(p => state.wishlist.includes(p.id));
    }
    // deals filter
    if (state.view === 'deals') {
      state.products = state.products.filter(p => p.price <= 50);
    }
  }

  function renderChips() {
    const chips = ['All', 'Wishlist', ...state.categories];
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
    initReveal();
  }

  function cardHtml(p) {
    return `
      <article class="card" data-id="${p.id}">
        <img src="/proxy-image?url=${encodeURIComponent(p.image_url)}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/640x360'">
        <div class="body">
          <div class="title clickable">${escapeHtml(p.name)}</div>
          <div class="rating">${starsHtml(p)}</div>
          <div class="desc">${escapeHtml(p.description || '')}</div>
          <div class="price-row">
            <div class="price">${formatCurrency(p.price)}</div>
            <div class="qty">
              <button class="icon-btn dec" title="Decrease">−</button>
              <span class="count">1</span>
              <button class="icon-btn inc" title="Increase">+</button>
            </div>
          </div>
          <div style="display:flex; gap:8px">
            <button class="primary-btn add" style="flex:1">Add to Cart</button>
            <button class="icon-btn wish" title="Wishlist">❤</button>
          </div>
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
      const id = Number(card.dataset.id);
      const title = card.querySelector('.title');
      const img = card.querySelector('img');
      title.addEventListener('click', () => openQuickView(id));
      img.addEventListener('click', () => openQuickView(id));
      const wishBtn = card.querySelector('.wish');
      if (state.wishlist.includes(id)) wishBtn.classList.add('active');
      wishBtn.addEventListener('click', () => {
        if (state.wishlist.includes(id)) state.wishlist = state.wishlist.filter(x=>x!==id);
        else state.wishlist.push(id);
        saveWishlist();
        wishBtn.classList.toggle('active');
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
    if (!els.cartCount) return;
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
    const tax = subtotal * 0.10;
    const shipping = subtotal >= 100 ? 0 : (subtotal === 0 ? 0 : 7);
    const discount = state.promoCode === 'SAVE10' ? Math.min(subtotal * 0.10, 50) : 0;
    const total = Math.max(0, subtotal + tax + shipping - discount);
    els.cartSubtotal.textContent = formatCurrency(subtotal);
    if (els.cartTax) els.cartTax.textContent = formatCurrency(tax);
    if (els.cartShip) els.cartShip.textContent = formatCurrency(shipping);
    if (els.cartTotal) els.cartTotal.textContent = formatCurrency(total);
  }

  async function checkout() {
    if (!state.cart.length) return;
    openCheckoutModal();
  }

  function openCheckoutModal(){
    els.checkoutModal.classList.add('show');
    els.checkoutBackdrop.classList.add('show');
    els.checkoutModal.setAttribute('aria-hidden','false');
  }
  function closeCheckoutModal(){
    els.checkoutModal.classList.remove('show');
    els.checkoutBackdrop.classList.remove('show');
    els.checkoutModal.setAttribute('aria-hidden','true');
  }

  async function placeOrder(){
    if (!state.cart.length) return;
    els.placeOrder.disabled = true;
    try {
      const customer = { name: els.custName.value.trim() || null, email: els.custEmail.value.trim() || null };
      const res = await fetch(`${apiBase}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: state.cart.map(it => ({ product_id: it.product_id, quantity: it.quantity })) })
      });
      if (!res.ok) throw new Error('Checkout failed');
      const data = await res.json();
      state.cart = []; saveCart(); renderCart(); updateCartBadge();
      closeCheckoutModal(); closeDrawer();
      // Redirect to success page for a more complete flow
      location.href = `/success.html?id=${data.id}`;
    } catch (e) { showToast('Failed to checkout. Please try again.'); }
    finally { els.placeOrder.disabled = false; }
  }

  function openQuickView(id){
    const p = state.products.find(x=>x.id===id); if(!p) return;
    addRecent(p.id);
    els.modalImage.src = p.image_url; els.modalImage.onerror = () => { els.modalImage.src = 'https://placehold.co/640x360'; };
    els.modalTitle.textContent = p.name;
    els.modalDesc.textContent = p.description || '';
    els.modalPrice.textContent = formatCurrency(p.price);
    els.modalStock.textContent = `In stock: ${p.stock}`;
    els.modalRating.innerHTML = starsHtml(p);
    let count = 1; els.modalCount.textContent = '1';
    els.modalInc.onclick = () => { count = Math.min(99, count+1); els.modalCount.textContent = String(count); };
    els.modalDec.onclick = () => { count = Math.max(1, count-1); els.modalCount.textContent = String(count); };
    els.modalAdd.onclick = () => { addToCart(p, count); closeQuickView(); };
    els.quickView.classList.add('show'); els.modalBackdrop.classList.add('show'); els.quickView.setAttribute('aria-hidden','false');
  }
  function closeQuickView(){
    els.quickView.classList.remove('show'); els.modalBackdrop.classList.remove('show'); els.quickView.setAttribute('aria-hidden','true');
  }

  function starsHtml(p){
    const rating = pseudoRating(p.name);
    const full = Math.floor(rating); const half = rating - full >= 0.5 ? 1 : 0; const empty = 5 - full - half;
    return `${'★'.repeat(full).split('').map(()=>'<span class="star">★</span>').join('')}${half?'<span class="star">★</span>':''}${'<span class="star muted">★</span>'.repeat(empty)}`;
  }
  function pseudoRating(str){
    let h=0; for(let i=0;i<str.length;i++){ h = (h*31 + str.charCodeAt(i))>>>0; }
    return 3 + (h % 20)/20 * 2; // 3.0 - 5.0
  }

  function showSkeleton(count=8){
    els.grid.innerHTML = Array.from({length:count}).map(()=>`
      <article class="card">
        <div class="skeleton" style="width:100%;height:180px"></div>
        <div class="body">
          <div class="skeleton" style="width:60%;height:18px;border-radius:8px"></div>
          <div class="skeleton" style="width:100%;height:14px;border-radius:8px"></div>
          <div class="skeleton" style="width:70%;height:14px;border-radius:8px"></div>
          <div class="skeleton" style="width:100%;height:36px;border-radius:12px"></div>
        </div>
      </article>
    `).join('');
  }

  // Reveal animation using IntersectionObserver with stagger
  let revealObserver;
  function initReveal(){
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('show');
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    }
    const cards = [...els.grid.querySelectorAll('.card')];
    cards.forEach((card, i) => {
      card.classList.add('reveal','stagger');
      card.style.setProperty('--stagger', `${i*60}ms`);
      revealObserver.observe(card);
    });
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

  // Button ripple effect
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.primary-btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
    const max = Math.max(rect.width, rect.height); ripple.style.width = ripple.style.height = `${max}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });

  async function refresh() {
    if (!els.grid) return;
    showSkeleton(8);
    await fetchProducts();
    renderChips();
    renderProducts();
    await renderRecent();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
  }

  // Events
  els.searchBtn && els.searchBtn.addEventListener('click', () => { state.q = els.search?.value.trim() || ''; refresh(); });
  els.search && els.search.addEventListener('keydown', e => { if (e.key === 'Enter') { state.q = els.search.value.trim(); refresh(); } });
  els.sortSelect && els.sortSelect.addEventListener('change', () => { state.sort = els.sortSelect.value; refresh(); });
  els.cartBtn && els.cartBtn.addEventListener('click', () => { renderCart(); openDrawer(); });
  els.closeCart && els.closeCart.addEventListener('click', closeDrawer);
  els.backdrop && els.backdrop.addEventListener('click', closeDrawer);
  els.checkoutBtn && els.checkoutBtn.addEventListener('click', checkout);
  els.applyPromo && els.applyPromo.addEventListener('click', () => { state.promoCode = (els.promoCode?.value || '').trim().toUpperCase() || null; updateSubtotal(); });
  els.closeModal && els.closeModal.addEventListener('click', closeQuickView);
  els.modalBackdrop && els.modalBackdrop.addEventListener('click', closeQuickView);
  els.closeCheckout && els.closeCheckout.addEventListener('click', closeCheckoutModal);
  els.checkoutBackdrop && els.checkoutBackdrop.addEventListener('click', closeCheckoutModal);
  els.placeOrder && els.placeOrder.addEventListener('click', placeOrder);

  // Init
  updateCartBadge();
  if (els.year) els.year.textContent = new Date().getFullYear();
  function applyTheme(){ document.body.classList.toggle('theme-light', state.theme === 'light'); }
  applyTheme();
  // Mark active nav link
  const navLinks = document.querySelectorAll('.nav-link');
  if (navLinks && navLinks.length) {
    const path = location.pathname.replace(/\/$/, '/index.html');
    navLinks.forEach(a => {
      const href = new URL(a.href, location.origin).pathname;
      if (href === path) a.classList.add('active');
      // Also treat root path as home
      if ((path === '/index.html' || path === '/') && (href === '/' || href.endsWith('/index.html'))) a.classList.add('active');
    });
  }
  // Read URL view flag (wishlist)
  const initView = new URLSearchParams(location.search).get('view');
  state.view = initView || null;
  if (initView === 'wishlist') state.selectedCategory = 'Wishlist';
  (async () => {
    try { if (els.chips) await fetchCategories(); } catch (_) {}
    await refresh();
  })();
})();
// (moved inside IIFE)
  function addRecent(id){
    try {
      const raw = localStorage.getItem('recent');
      const arr = raw ? JSON.parse(raw) : [];
      const next = [id, ...arr.filter(x => x !== id)].slice(0, 6);
      localStorage.setItem('recent', JSON.stringify(next));
    } catch(_){}
  }

  async function renderRecent(){
    if (!document.getElementById('recent-grid')) return;
    let ids = [];
    try { ids = JSON.parse(localStorage.getItem('recent') || '[]'); } catch(_){}
    if (!ids.length) { document.getElementById('recent-grid').innerHTML = '<div class="muted">No recently viewed items yet.</div>'; return; }
    // Fetch each product id (simple sequential for demo)
    const items = [];
    for (const id of ids){
      try { const res = await fetch(`/api/products/${id}`); if (res.ok) items.push(await res.json()); } catch(_){}
    }
    document.getElementById('recent-grid').innerHTML = items.map(p => cardHtml(p)).join('');
    attachCardEvents(); initReveal();
  }
