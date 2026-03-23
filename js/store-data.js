// ===== 데이터 입력 =====
async function loadStoreDataPage() {
  existingDataId = null;
  clearInputs();
  updateSdMode(false);
  calcProfit();
  const now = new Date();
  document.getElementById('sd-month').value = now.getMonth() + 1;
  document.getElementById('sd-year').value = now.getFullYear();
  await checkExisting();
}

async function checkExisting() {
  if (!currentUser) return;
  const yr = document.getElementById('sd-year').value;
  const mo = document.getElementById('sd-month').value;
  const { data } = await sb.from('store_data')
    .select('*').eq('owner_id', currentUser.id)
    .eq('data_year', yr).eq('data_month', mo).single();
  if (data) { existingDataId = data.id; updateSdMode(true); fillInputs(data); }
  else { existingDataId = null; updateSdMode(false); clearInputs(); }
  calcProfit();
}

function updateSdMode(isEdit) {
  const badge = document.getElementById('sd-mode-badge');
  const btn = document.getElementById('sd-save-btn');
  if (isEdit) {
    badge.textContent = '수정 중'; badge.style.background = 'var(--blue)';
    btn.textContent = '수정 저장하기'; btn.className = 'btn btn-blue';
  } else {
    badge.textContent = '신규 입력'; badge.style.background = 'var(--orange)';
    btn.textContent = '저장하기'; btn.className = 'btn btn-primary';
  }
}

function fillInputs(d) {
  document.getElementById('sd-revenue').value = d.revenue || '';
  document.getElementById('sd-labor').value = d.labor_cost || '';
  document.getElementById('sd-rent').value = d.rent || '';
  document.getElementById('sd-royalty').value = d.royalty || '';
  document.getElementById('sd-utility').value = d.utility_cost || '';
  document.getElementById('sd-material').value = d.material_cost || '';
  document.getElementById('sd-delivery').value = d.delivery_fee || '';
  document.getElementById('sd-other').value = d.other_cost || '';
}

function clearInputs() {
  ['sd-revenue', 'sd-labor', 'sd-rent', 'sd-royalty', 'sd-utility', 'sd-material', 'sd-delivery', 'sd-other']
    .forEach(id => document.getElementById(id).value = '');
}

function calcProfit() {
  const rev = num('sd-revenue');
  const total = num('sd-labor') + num('sd-rent') + num('sd-royalty') + num('sd-utility') + num('sd-material') + num('sd-delivery') + num('sd-other');
  const profit = rev - total;
  const rate = rev > 0 ? (profit / rev * 100) : 0;
  document.getElementById('sd-profit-val').textContent = numFmt(profit) + '원';
  document.getElementById('sd-profit-rate').textContent = '순수익률 ' + rate.toFixed(1) + '%';
}

async function saveStoreData() {
  if (!currentUser || !currentProfile) return;
  const yr = parseInt(document.getElementById('sd-year').value);
  const mo = parseInt(document.getElementById('sd-month').value);
  const rev = num('sd-revenue');
  if (!rev) return showAlert('sd-alert', '매출을 입력해주세요.', 'error');
  const labor = num('sd-labor'), rent = num('sd-rent'), royalty = num('sd-royalty'),
    utility = num('sd-utility'), material = num('sd-material'),
    delivery = num('sd-delivery'), other = num('sd-other');
  const total = labor + rent + royalty + utility + material + delivery + other;
  const profit = rev - total;
  const rate = v => rev > 0 ? parseFloat((v / rev * 100).toFixed(2)) : 0;
  const payload = {
    owner_id: currentUser.id, brand_id: currentProfile.brand_id,
    data_year: yr, data_month: mo,
    revenue: rev, labor_cost: labor, rent, royalty,
    utility_cost: utility, material_cost: material,
    delivery_fee: delivery, other_cost: other, net_profit: profit,
    labor_rate: rate(labor), rent_rate: rate(rent), material_rate: rate(material),
    royalty_rate: rate(royalty), delivery_rate: rate(delivery),
    utility_rate: rate(utility), other_rate: rate(other), net_profit_rate: rate(profit)
  };
  let err;
  if (existingDataId) { ({ error: err } = await sb.from('store_data').update(payload).eq('id', existingDataId)); }
  else { ({ error: err } = await sb.from('store_data').insert(payload)); }
  if (err) return showAlert('sd-alert', '저장 실패: ' + err.message, 'error');
  showPage('home');
}
