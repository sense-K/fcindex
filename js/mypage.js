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

  // 관리자는 내 문의 카드 숨김 + 브랜드 관리 표시
  const contactCard = document.getElementById('mp-contact-card');
  if (isAdmin) {
    contactCard.classList.add('hidden');
    loadAdminBrands();
    return;
  }
  contactCard.classList.remove('hidden');

  // 내 문의 스레드 로드
  const { data: threads } = await sb.from('contact_threads')
    .select('*, contact_messages(id, is_read, sender_type)')
    .eq('user_id', currentUser.id)
    .order('updated_at', { ascending: false })
    .limit(10);

  const myThreadsEl = document.getElementById('mp-contact-threads');
  const badge = document.getElementById('mp-contact-badge');

  if (!threads || threads.length === 0) {
    myThreadsEl.innerHTML = '<div style="font-size:13px;color:var(--gray);padding:4px 0 8px;">문의 내역이 없어요</div>';
    badge.style.display = 'none';
    return;
  }

  const unreadCount = threads.filter(t =>
    t.contact_messages?.some(m => !m.is_read && m.sender_type === 'admin')
  ).length;
  if (unreadCount > 0) {
    badge.textContent = `답변 ${unreadCount}건`;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }

  myThreadsEl.innerHTML = threads.map(t => {
    const hasUnread = t.contact_messages?.some(m => !m.is_read && m.sender_type === 'admin');
    const date = new Date(t.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const isClosed = t.status === 'closed';
    return `
      <div class="info-row" style="cursor:pointer;" onclick="openContactThread('${t.id}', false)">
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--navy);">${escapeHtml(t.subject)}</div>
          <div style="font-size:11px;color:var(--gray);margin-top:2px;">${date} · ${isClosed ? '종료됨' : '진행중'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${hasUnread ? '<span class="badge badge-orange" style="font-size:9px;">답변</span>' : ''}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>`;
  }).join('');
}

// ===== 비밀번호 변경 =====
function togglePwChange() {
  const form = document.getElementById('pw-change-form');
  const icon = document.getElementById('pw-toggle-icon');
  const isHidden = form.classList.contains('hidden');
  form.classList.toggle('hidden');
  icon.style.transform = isHidden ? 'rotate(180deg)' : '';
  if (isHidden) {
    document.getElementById('pw-change-alert').innerHTML = '';
    document.getElementById('pw-new').value = '';
    document.getElementById('pw-new2').value = '';
  }
}

async function doChangePassword() {
  const pw = document.getElementById('pw-new').value;
  const pw2 = document.getElementById('pw-new2').value;
  if (!pw || pw.length < 6) return showAlert('pw-change-alert', '비밀번호는 6자 이상 입력해주세요.', 'error');
  if (pw !== pw2) return showAlert('pw-change-alert', '비밀번호가 일치하지 않아요.', 'error');
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return showAlert('pw-change-alert', '변경 실패: ' + error.message, 'error');
  showAlert('pw-change-alert', '비밀번호가 변경됐어요!', 'success');
  document.getElementById('pw-new').value = '';
  document.getElementById('pw-new2').value = '';
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

// ===== 관리자: 브랜드 관리 =====
const BRAND_CAT_EMOJI = { '커피':'☕', '치킨':'🍗', '버거':'🍔', '한식':'🍱', '피자':'🍕', '디저트':'🧋', '편의점':'🏪', '기타':'🏬' };

async function loadAdminBrands() {
  const card = document.getElementById('mp-brand-manage');
  card.classList.remove('hidden');
  const { data: brands } = await sb.from('brands').select('id, name, category').order('category').order('name');
  const listEl = document.getElementById('brand-manage-list');
  if (!brands || brands.length === 0) {
    listEl.innerHTML = '<div style="font-size:13px;color:var(--gray);padding:4px 0 8px;">등록된 브랜드가 없어요</div>';
    return;
  }
  listEl.innerHTML = brands.map(b => `
    <div class="info-row" style="padding:6px 0;">
      <span style="font-size:13px;">${BRAND_CAT_EMOJI[b.category] || '🏬'} ${b.category} · ${escapeHtml(b.name)}</span>
      <button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:11px;" onclick="adminDeleteBrand('${b.id}', '${escapeHtml(b.name)}')">삭제</button>
    </div>
  `).join('');
}

async function adminAddBrand() {
  const category = document.getElementById('new-brand-category').value;
  const name = document.getElementById('new-brand-name').value.trim();
  if (!category) return showAlert('brand-add-alert', '카테고리를 선택해주세요.', 'error');
  if (!name) return showAlert('brand-add-alert', '브랜드명을 입력해주세요.', 'error');
  const { error } = await sb.from('brands').insert({ name, category });
  if (error) return showAlert('brand-add-alert', '추가 실패: ' + error.message, 'error');
  document.getElementById('new-brand-name').value = '';
  document.getElementById('new-brand-category').value = '';
  document.getElementById('brand-add-alert').innerHTML = '';
  await loadBrands();
  await loadAdminBrands();
}

async function adminDeleteBrand(id, name) {
  if (!confirm(`'${name}' 브랜드를 삭제할까요?\n해당 브랜드를 사용 중인 회원이 있으면 삭제할 수 없어요.`)) return;
  const { error } = await sb.from('brands').delete().eq('id', id);
  if (error) return alert('삭제 실패: ' + error.message);
  await loadBrands();
  await loadAdminBrands();
}

// ===== 회원 탈퇴 =====
async function deleteAccount() {
  const confirmed = confirm('정말 탈퇴하시겠어요?\n\n탈퇴 시 모든 개인정보와 매출 데이터가 즉시 삭제되며 복구할 수 없어요.\n작성한 게시글과 댓글은 익명으로 유지됩니다.');
  if (!confirmed) return;
  const confirmed2 = confirm('마지막 확인입니다.\n탈퇴 후에는 동일한 사업자등록번호로 재가입이 가능해요.\n정말 탈퇴하시겠어요?');
  if (!confirmed2) return;

  try {
    // 프로필 데이터 삭제 (게시글/댓글은 유지, 개인정보만 삭제)
    await sb.from('store_data').delete().eq('owner_id', currentUser.id);
    await sb.from('profiles').delete().eq('id', currentUser.id);
    // Auth 유저 삭제 (재가입 가능하도록)
    await sb.rpc('delete_own_account');
    await sb.auth.signOut();
    currentUser = null; currentProfile = null; currentBrand = null;
    showPage('landing');
    setTimeout(() => alert('탈퇴가 완료됐어요. 이용해주셔서 감사합니다.'), 300);
  } catch (e) {
    alert('탈퇴 처리 중 오류가 발생했어요. 고객센터에 문의해주세요.');
  }
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
