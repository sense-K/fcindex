async function loadBrands() {
  const { data } = await sb.from('brands').select('id, name, category').order('category').order('name');
  if (data) allBrands = data;
}

function openBrandModal() {
  document.getElementById('brand-modal').classList.remove('hidden');
  document.getElementById('brand-modal').style.display = 'flex';
  document.getElementById('brand-search').value = '';
  selectedCategory = '전체';
  document.querySelectorAll('.brand-cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-cat="전체"]').classList.add('active');
  renderBrandList(allBrands);
  setTimeout(() => document.getElementById('brand-search').focus(), 100);
}

function closeBrandModal() {
  document.getElementById('brand-modal').classList.add('hidden');
  document.getElementById('brand-modal').style.display = 'none';
}

function filterCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll('.brand-cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-cat="${cat}"]`).classList.add('active');
  filterBrands();
}

function filterBrands() {
  const search = document.getElementById('brand-search').value.trim().toLowerCase();
  let filtered = allBrands;
  if (selectedCategory !== '전체') filtered = filtered.filter(b => b.category === selectedCategory);
  if (search) filtered = filtered.filter(b => b.name.toLowerCase().includes(search));
  renderBrandList(filtered);
}

function renderBrandList(brands) {
  const list = document.getElementById('brand-list-modal');
  if (brands.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--gray);font-size:13px;">검색 결과가 없어요</div>';
    return;
  }
  const catEmoji = { '커피':'☕', '치킨':'🍗', '버거':'🍔', '한식':'🍱', '피자':'🍕', '디저트':'🧋', '편의점':'🏪', '기타':'🏬' };
  list.innerHTML = brands.map(b => `
    <div class="brand-item" data-brand-id="${b.id}">
      <div>
        <div class="brand-item-name"></div>
        <div class="brand-item-cat"></div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`).join('');
  list.querySelectorAll('.brand-item').forEach((el, i) => {
    const b = brands[i];
    el.querySelector('.brand-item-name').textContent = b.name;
    el.querySelector('.brand-item-cat').textContent = (catEmoji[b.category] || '🏬') + ' ' + b.category;
    el.addEventListener('click', () => selectBrand(b.id, b.name, b.category));
  });
}

function selectBrand(id, name, category) {
  document.getElementById('su-brand').value = id;
  document.getElementById('su-brand-label').textContent = name;
  document.getElementById('su-brand-label').style.color = 'var(--navy)';
  closeBrandModal();
}
