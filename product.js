(() => {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const prodContent = document.getElementById('prod-content');

  function formatCurrency(n){ return `$${n.toFixed(2)}`; }
  function showToast(msg){ const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2000); }
  function loadCart(){ try{ const raw = localStorage.getItem('cart'); return raw?JSON.parse(raw):[]; }catch(_){ return []; } }
  function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart)); }

  async function fetchProduct(){
    const res = await fetch(`/api/products/${id}`);
    if(!res.ok) { prodContent.innerHTML = '<p>Product not found.</p>'; return; }
    const p = await res.json();
    render(p);
  }

  function render(p){
    prodContent.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start">
        <img src="/proxy-image?url=${encodeURIComponent(p.image_url)}" alt="${p.name}" style="width:100%;height:360px;object-fit:cover;border-radius:12px" onerror="this.src='https://placehold.co/640x360'">
        <div>
          <h2 style="margin-top:0">${p.name}</h2>
          <p class="muted">${p.description || ''}</p>
          <div class="modal-meta"><span class="price">${formatCurrency(p.price)}</span><span class="muted">In stock: ${p.stock}</span></div>
          <div class="qty" style="margin:8px 0"><button class="icon-btn" id="dec">−</button><span id="count" class="count">1</span><button class="icon-btn" id="inc">+</button></div>
          <button id="add" class="primary-btn">Add to Cart</button>
        </div>
      </div>
    `;
    let count = 1; const countEl = document.getElementById('count');
    document.getElementById('inc').onclick = () => { count = Math.min(99, count+1); countEl.textContent = String(count); };
    document.getElementById('dec').onclick = () => { count = Math.max(1, count-1); countEl.textContent = String(count); };
    document.getElementById('add').onclick = () => {
      const cart = loadCart();
      const idx = cart.findIndex(it => it.product_id === p.id);
      if (idx>=0) cart[idx].quantity += count; else cart.push({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url, quantity: count });
      saveCart(cart); showToast('Added to cart');
    };
    requestAnimationFrame(()=>{ document.querySelector('.reveal').classList.add('show'); });
  }

  fetchProduct();
})();
