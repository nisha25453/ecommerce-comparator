async function fetchSiteData(site, q) {
  try {
    const res = await fetch(`/api/fetch?site=${encodeURIComponent(site)}&q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

function renderProductCard(siteDisplay, data) {
  if (!data) return `<div class="card"><div class="site">${siteDisplay}</div><div class="small">No data found</div></div>`;
  const price = data.price ? '₹' + data.price.toLocaleString('en-IN') : '-';
  const mrp = data.mrp ? ('<span class="mrp">₹' + data.mrp.toLocaleString('en-IN') + '</span>') : '';
  const discount = data.discountPercent ? data.discountPercent + '%' : '-';
  return `
    <div class="card">
      <div class="site">${siteDisplay}</div>
      <div style="margin-top:8px;font-weight:700">${data.title || ''}</div>
      <div style="margin-top:8px">
        <span class="price">${price}</span> ${mrp}
      </div>
      <div class="small" style="margin-top:6px">Discount: ${discount}</div>
      <div style="margin-top:8px;"><a href="${data.url}" target="_blank" class="small">Open product</a></div>
    </div>
  `;
}

async function aiDealRecommendation(products) {
  // Simple client-side summary: pick highest discount or lowest price
  let best = null;
  for (const p of products) {
    if (!p) continue;
    if (!best) best = p;
    else {
      // prefer lower price, tie-break by higher discount
      if ((p.price || Infinity) < (best.price || Infinity)) best = p;
      else if (p.price === best.price && (p.discountPercent || 0) > (best.discountPercent || 0)) best = p;
    }
  }
  return best ? `Top pick: ${best.title || 'Product'} (${best.site}) at ₹${best.price || '-'} — ${best.discountPercent||0}% off` : '';
}

document.getElementById('searchBtn').addEventListener('click', async () => {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return alert('Please enter a product name');
  const sites = ['amazon','flipkart','myntra','meesho'];
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<div class="small">Searching…</div>';
  const promises = sites.map(s => fetchSiteData(s, q));
  const responses = await Promise.all(promises);
  // attach site names
  for (let i=0;i<responses.length;i++){ if (responses[i]) responses[i].site = sites[i]; }
  // render
  resultsDiv.innerHTML = responses.map((r,i)=>renderProductCard(sites[i].charAt(0).toUpperCase()+sites[i].slice(1), r)).join('');
  // AI suggestion
  const suggestion = await aiDealRecommendation(responses);
  document.getElementById('aiSuggestion').innerText = suggestion;
});
