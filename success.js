(() => {
  const qs = new URLSearchParams(location.search);
  const id = Number(qs.get('id'));
  const summary = document.getElementById('summary');
  function formatCurrency(n){ return `$${n.toFixed(2)}`; }
  async function load(){
    if (!id){ summary.innerHTML = '<div class="muted">Missing order id.</div>'; return; }
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok){ summary.innerHTML = '<div class="muted">Order not found.</div>'; return; }
    const o = await res.json();
    summary.innerHTML = `
      <div class="price-row"><div class="title">Order #${o.id}</div><span class="badge-pill status-${o.status||'created'}">${o.status||'created'}</span></div>
      <div class="muted">Placed: ${new Date(o.created_at).toLocaleString()}</div>
      <div style="margin-top:10px">${o.items.map(it => `<div class="row"><span>${it.name} × ${it.quantity}</span><span>${formatCurrency(it.price||0)}</span></div>`).join('')}</div>
      <div class="price-row" style="margin-top:10px"><span>Total</span><span class="price">${formatCurrency(o.total)}</span></div>
    `;
    requestAnimationFrame(()=>document.querySelector('.reveal').classList.add('show'));
  }
  load();
})();
