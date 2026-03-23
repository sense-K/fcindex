// ===== 마이페이지 =====
async function loadMypage() {
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  // 어드민 브랜드 변경 드롭다운 (profile 유무와 무관하게 항상 렌더)
  const editEl = document.getElementById('mp-brand-edit');
  if (isAdmin) {
    const { data: brands } = await sb.from('brands').select('id, name, category').order('category').order('name');
    const options = (brands || []).map(b =>
      `<option value="${b.id}" ${b.id === currentProfile?.brand_id ? 'selected' : ''}>${b.category} · ${b.name}</option>`
    ).join('');
    editEl.innerHTML = `<select class="form-select" style="margin-left:8px;font-size:12px;padding:4px 8px;height:auto;" onchange="adminChangeBrand(this.value)"><option value="">브랜드 선택</option>${options}</select>`;
  } else {
    editEl.innerHTML = '';
  }

  if (!currentProfile) return;
  document.getElementById('mp-nick').textContent = currentProfile.nickname || '-';
  document.getElementById('mp-email').textContent = currentProfile.email || '-';
  document.getElementById('mp-brand').textContent = currentBrand?.name || '-';
  document.getElementById('mp-region').textContent = currentProfile.region || '-';
  document.getElementById('mp-biz').textContent = currentProfile.biz_number || '-';
  const status = currentProfile.auth_status;
  const statusEl = document.getElementById('mp-status');
  document.getElementById('mp-pending').classList.add('hidden');
  document.getElementById('mp-rejected').classList.add('hidden');
  if (status === 'pending') {
    statusEl.innerHTML = '<span class="badge badge-pending">심사중</span>';
    document.getElementById('mp-pending').classList.remove('hidden');
  } else if (status === 'approved') {
    statusEl.innerHTML = '<span class="badge badge-approved">승인 완료</span>';
  } else {
    statusEl.innerHTML = '<span class="badge badge-rejected">반려</span>';
    document.getElementById('mp-rejected').classList.remove('hidden');
  }
}

async function adminChangeBrand(brandId) {
  if (!brandId) return;
  const { error } = await sb.from('profiles').upsert({
    id: currentUser.id,
    email: currentUser.email,
    brand_id: brandId,
    auth_status: 'approved'
  }, { onConflict: 'id' });
  if (error) return alert('브랜드 변경 실패: ' + error.message);
  await loadProfile();
  document.getElementById('mp-brand').textContent = currentBrand?.name || '-';
}

// ===== 재신청 =====
function loadReapplyPage() {
  document.getElementById('ra-nick').textContent = currentProfile?.nickname || '-';
  document.getElementById('ra-brand').textContent = currentBrand?.name || '-';
  document.getElementById('ra-region').textContent = currentProfile?.region || '-';
  document.getElementById('ra-biz').value = currentProfile?.biz_number || '';
  document.getElementById('ra-biz-img').value = '';
  document.getElementById('reapply-alert').innerHTML = '';
}

async function doReapply() {
  const biz = document.getElementById('ra-biz').value.trim().replace(/-/g, '');
  const file = document.getElementById('ra-biz-img').files[0];
  if (!biz || !file) return showAlert('reapply-alert', '사업자등록번호와 이미지를 모두 입력해주세요.', 'error');
  if (biz.length !== 10 || !/^\d+$/.test(biz)) return showAlert('reapply-alert', '사업자등록번호는 숫자 10자리예요.', 'error');

  // 다른 계정의 사업자번호 중복 체크
  const { data: dupCheck } = await sb.from('profiles').select('id').eq('biz_number', biz).maybeSingle();
  if (dupCheck && dupCheck.id !== currentUser.id) return showAlert('reapply-alert', '이미 가입된 사업자등록번호예요.', 'error');

  showAlert('reapply-alert', '처리 중이에요...', 'info');

  const ext = file.name.split('.').pop();
  const filePath = `biz/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('biz-images').upload(filePath, file);
  if (upErr) return showAlert('reapply-alert', '이미지 업로드에 실패했어요: ' + upErr.message, 'error');

  const { data: urlData } = sb.storage.from('biz-images').getPublicUrl(filePath);
  const bizImageUrl = urlData.publicUrl;

  const { error } = await sb.from('profiles').update({
    biz_number: biz,
    biz_image: bizImageUrl,
    auth_status: 'pending'
  }).eq('id', currentUser.id);

  if (error) return showAlert('reapply-alert', '재신청에 실패했어요: ' + error.message, 'error');

  await loadProfile();
  showPage('mypage');
}
