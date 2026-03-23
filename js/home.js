// ===== 홈 =====
async function loadHome() {
  if (!currentProfile) return;
  document.getElementById('home-nickname').textContent = currentProfile.nickname || '-';
  document.getElementById('home-brand-name').textContent = currentBrand?.name || '-';

  const { data } = await sb.from('store_data')
    .select('*').eq('owner_id', currentUser.id)
    .order('data_year', { ascending: true })
    .order('data_month', { ascending: true });

  const tabs = document.getElementById('month-tabs');
  tabs.innerHTML = '';

  if (!data || data.length === 0) {
    document.getElementById('home-data').classList.add('hidden');
    document.getElementById('home-empty').classList.remove('hidden');
    return;
  }
  document.getElementById('home-data').classList.remove('hidden');
  document.getElementById('home-empty').classList.add('hidden');

  const recent = data.slice(-6);
  recent.forEach((d, i) => {
    const tab = document.createElement('div');
    tab.className = 'month-tab' + (i === recent.length - 1 ? ' active' : '');
    tab.textContent = d.data_year + '년 ' + d.data_month + '월';
    tab.onclick = () => {
      document.querySelectorAll('.month-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDashboard(d);
    };
    tabs.appendChild(tab);
  });
  renderDashboard(recent[recent.length - 1]);
  renderTrendChart(recent);
}

function renderTrendChart(data) {
  const section = document.getElementById('trend-chart-section');
  const wrap = document.getElementById('trend-chart-svg-wrap');
  if (!section || !wrap || data.length < 2) {
    section?.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const W = 320, H = 130;
  const PAD = { top: 24, right: 12, bottom: 28, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const revenues = data.map(d => d.revenue || 0);
  const rates = data.map(d => d.net_profit_rate || 0);
  const maxRev = Math.max(...revenues) * 1.15 || 1;
  const maxRate = Math.max(...rates, 20) * 1.2 || 1;
  const n = data.length;
  const xStep = innerW / (n - 1);

  const revPts = revenues.map((r, i) => [PAD.left + i * xStep, PAD.top + innerH - (r / maxRev) * innerH]);
  const ratePts = rates.map((r, i) => [PAD.left + i * xStep, PAD.top + innerH - (r / maxRate) * innerH]);
  const toPoly = pts => pts.map(p => p.join(',')).join(' ');

  const areaBottom = PAD.top + innerH;
  const areaPoints = revPts.map(p => p.join(',')).join(' ') + ` ${revPts[n - 1][0]},${areaBottom} ${revPts[0][0]},${areaBottom}`;

  const xLabels = data.map((d, i) => {
    const x = PAD.left + i * xStep;
    return `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#9CA3AF">${d.data_month}월</text>`;
  }).join('');

  const revDots = revPts.map((p, i) => {
    const val = Math.round(revenues[i] / 10000);
    return `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#378ADD" stroke="#fff" stroke-width="1.5"/>
      <text x="${p[0]}" y="${p[1] - 8}" text-anchor="middle" font-size="8" fill="#378ADD" font-weight="600">${val}만</text>`;
  }).join('');

  const rateDots = ratePts.map((p, i) => {
    return `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#16A34A" stroke="#fff" stroke-width="1.5"/>
      <text x="${p[0]}" y="${p[1] - 7}" text-anchor="middle" font-size="8" fill="#16A34A" font-weight="600">${rates[i].toFixed(1)}%</text>`;
  }).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;">
      <defs>
        <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#378ADD" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#378ADD" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <line x1="${PAD.left}" y1="${PAD.top + innerH * 0.5}" x2="${PAD.left + innerW}" y2="${PAD.top + innerH * 0.5}" stroke="#E5E0D8" stroke-width="0.5" stroke-dasharray="3,3"/>
      <polygon points="${areaPoints}" fill="url(#revArea)"/>
      <polyline points="${toPoly(revPts)}" fill="none" stroke="#378ADD" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <polyline points="${toPoly(ratePts)}" fill="none" stroke="#16A34A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="5,3"/>
      ${revDots}
      ${rateDots}
      ${xLabels}
    </svg>`;
}

function renderDashboard(d) {
  const avg = currentBrand;
  document.getElementById('m-revenue').textContent = numFmt(d.revenue);
  document.getElementById('m-net-rate').textContent = pctFmt(d.net_profit_rate);
  document.getElementById('m-net-amt').textContent = '= ' + numFmt(d.net_profit) + '원';
  document.getElementById('m-labor').textContent = pctFmt(d.labor_rate);
  document.getElementById('m-material').textContent = pctFmt(d.material_rate);

  if (avg) {
    const ld = d.labor_rate - avg.avg_labor_rate;
    document.getElementById('m-labor-diff').textContent = ld > 0 ? `평균 ${avg.avg_labor_rate}% 초과` : `평균 ${avg.avg_labor_rate}% 이내`;
    document.getElementById('m-labor-diff').className = 'metric-sub ' + (ld > 0 ? 'warn' : 'ok');
    const md = d.material_rate - avg.avg_material_rate;
    document.getElementById('m-material-diff').textContent = md > 0 ? `평균 ${avg.avg_material_rate}% 초과` : `평균 ${avg.avg_material_rate}% 이내`;
    document.getElementById('m-material-diff').className = 'metric-sub ' + (md > 0 ? 'warn' : 'ok');
  }

  const items = [
    { name: '인건비', my: d.labor_rate, avg: avg?.avg_labor_rate },
    { name: '식재료비', my: d.material_rate, avg: avg?.avg_material_rate },
    { name: '임대료', my: d.rent_rate, avg: avg?.avg_rent_rate },
    { name: '배달수수료', my: d.delivery_rate, avg: avg?.avg_delivery_rate },
    { name: '관리비', my: d.utility_rate, avg: avg?.avg_utility_rate },
    { name: '기타', my: d.other_rate, avg: avg?.avg_other_rate },
  ];
  const bars = document.getElementById('compare-bars');
  bars.innerHTML = '';
  const warns = [];
  items.forEach(item => {
    const diff = item.avg ? (item.my - item.avg) : 0;
    const scale = 50;
    const myW = Math.min((item.my / scale) * 100, 100);
    const avgW = item.avg ? Math.min((item.avg / scale) * 100, 100) : 0;
    const diffClass = diff > 0 ? 'up' : diff < 0 ? 'ok' : 'same';
    const diffText = diff > 0 ? `▲ ${diff.toFixed(1)}%` : diff < 0 ? `▼ ${Math.abs(diff).toFixed(1)}%` : '평균 수준';
    if (diff > 3) warns.push(`${item.name}율이 브랜드 평균보다 ${diff.toFixed(1)}% 높아요`);
    bars.innerHTML += `
      <div class="compare-row">
        <div class="compare-meta"><span class="compare-name">${item.name}</span><span class="compare-diff ${diffClass}">${diffText}</span></div>
        <div class="bar-row"><div class="bar-label-small" style="color:var(--orange);font-size:9px;">내 매장</div><div class="bar-track"><div class="bar-fill orange" style="width:${myW}%"></div></div><div class="bar-pct" style="color:var(--orange);">${pctFmt(item.my)}</div></div>
        <div class="bar-row"><div class="bar-label-small" style="color:var(--blue);font-size:9px;">평균</div><div class="bar-track"><div class="bar-fill blue" style="width:${avgW}%"></div></div><div class="bar-pct" style="color:var(--blue);">${item.avg ? pctFmt(item.avg) : '-'}</div></div>
      </div>`;
  });
  const wb = document.getElementById('warn-box');
  if (warns.length > 0) { wb.classList.remove('hidden'); wb.textContent = '⚠️ ' + warns[0]; }
  else { wb.classList.add('hidden'); }
}
