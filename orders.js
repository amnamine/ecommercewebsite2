(() => {
  const grid = document.getElementById('orders');
  const kpis = document.getElementById('order-kpis');
  const search = document.getElementById('order-search');
  const statusSelect = document.getElementById('order-status');
  function formatCurrency(n){ return `$${n.toFixed(2)}`; }

  async function fetchOrders(){
    const res = await fetch('/api/orders');
    if(!res.ok){ grid.innerHTML = '<div class="hero">Unable to load orders.</div>'; return; }
    const orders = await res.json();
    enhanceStatuses(orders);
    render(orders);
    wireFilters(orders);
  }

  function enhanceStatuses(orders){
    orders.forEach(o => {
      if (!o.status || o.status === 'created') {
        // pseudo progression based on id for demo feel
        const m = o.id % 3; o.status = ['created','shipped','delivered'][m];
      }
    });
  }

  function render(orders){
    if(!orders.length){ grid.innerHTML = '<div class="hero">No orders yet.</div>'; return; }
    const totals = {
      count: orders.length,
      items: orders.reduce((a,o)=>a+o.items.reduce((b,it)=>b+it.quantity,0),0),
      spent: orders.reduce((a,o)=>a+o.total,0)
    };
    kpis.innerHTML = `
      <div class="kpi reveal"><div class="label">Orders</div><div class="value">${totals.count}</div></div>
      <div class="kpi reveal" style="--stagger: 80ms"><div class="label">Items</div><div class="value">${totals.items}</div></div>
      <div class="kpi reveal" style="--stagger: 160ms"><div class="label">Spent</div><div class="value">${formatCurrency(totals.spent)}</div></div>
    `;
    grid.innerHTML = orders.map(o => `
      <article class="card reveal" data-id="${o.id}">
        <div class="body">
          <div class="price-row">
            <div class="title">Order #${o.id} · ${new Date(o.created_at).toLocaleString()}</div>
            ${statusBadge(o.status)}
          </div>
          <div class="accordion">
            <button class="acc-header icon-btn" title="Toggle">▼</button>
            <div class="acc-body">
              ${o.items.map(it => `<div class="row"><span>${it.name} × ${it.quantity}</span><span>${formatCurrency(it.price || 0)}</span></div>`).join('')}
            </div>
          </div>
          <div class="price-row"><span>Total</span><span class="price">${formatCurrency(o.total)}</span></div>
        </div>
      </article>
    `).join('');
    initReveal();
    wireAccordions();
  }

  function statusBadge(status){
    const map = { created: 'status-created', shipped: 'status-shipped', delivered: 'status-delivered' };
    const cls = map[status] || 'status-created';
    return `<span class="badge-pill ${cls}">${status}</span>`;
  }

  function wireAccordions(){
    grid.querySelectorAll('.accordion').forEach(acc => {
      const btn = acc.querySelector('.acc-header');
      const body = acc.querySelector('.acc-body');
      btn.addEventListener('click', () => { body.classList.toggle('open'); });
    });
  }

  function wireFilters(all){
    function apply(){
      const q = (search.value||'').toLowerCase().trim();
      const st = statusSelect.value;
      let list = all;
      if (st !== 'All') list = list.filter(o => o.status === st);
      if (q) list = list.filter(o => `#${o.id}`.includes(q) || o.items.some(it => (it.name||'').toLowerCase().includes(q)));
      render(list);
    }
    search && search.addEventListener('input', apply);
    statusSelect && statusSelect.addEventListener('change', apply);
  }

  // Reveal helper
  function initReveal(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show'); });
    }, { threshold: 0.1 });
    [...document.querySelectorAll('.reveal')].forEach((el,i)=>{ el.style.setProperty('--stagger', `${i*80}ms`); io.observe(el); });
  }

  fetchOrders();
})();
