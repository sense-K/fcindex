// ===== 어드민 =====
const BRAND_CAT_EMOJI = { '커피':'☕', '치킨':'🍗', '버거':'🍔', '한식':'🍱', '피자':'🍕', '디저트':'🧋', '편의점':'🏪', '기타':'🏬' };

function toggleBrandManage() {
  const body = document.getElementById('brand-manage-body');
  const icon = document.getElementById('brand-manage-toggle-icon');
  const isHidden = body.classList.contains('hidden');
  body.classList.toggle('hidden');
  icon.style.transform = isHidden ? 'rotate(180deg)' : '';
  if (isHidden) loadAdminBrands();
}

async function loadAdminBrands() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
  const { data: brands } = await sb.from('brands').select('id, name, category').order('category').order('name');
  const listEl = document.getElementById('brand-manage-list');
  if (!brands || brands.length === 0) {
    listEl.innerHTML = '<div style="font-size:13px;color:var(--gray);padding:4px 0 8px;">등록된 브랜드가 없어요</div>';
    return;
  }
  listEl.innerHTML = brands.map(b => `
    <div class="admin-row" style="padding:8px 0;">
      <span style="font-size:13px;flex:1;">${BRAND_CAT_EMOJI[b.category] || '🏬'} ${b.category} · ${escapeHtml(b.name)}</span>
      <button class="btn btn-danger btn-sm" style="padding:4px 10px;font-size:11px;" onclick="adminDeleteBrand('${b.id}', '${escapeHtml(b.name)}')">삭제</button>
    </div>
  `).join('');
}

async function adminAddBrand() {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
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
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
  if (!confirm(`'${name}' 브랜드를 삭제할까요?\n해당 브랜드를 사용 중인 회원이 있으면 삭제할 수 없어요.`)) return;
  const { error } = await sb.from('brands').delete().eq('id', id);
  if (error) return alert('삭제 실패: ' + error.message);
  await loadBrands();
  await loadAdminBrands();
}

async function loadAdmin() {
  const { data: profiles } = await sb.from('profiles')
    .select('*, brands(name)').order('created_at', { ascending: false });
  if (!profiles) return;
  const pending = profiles.filter(p => p.auth_status === 'pending');
  const approved = profiles.filter(p => p.auth_status === 'approved');
  document.getElementById('admin-pending-count').textContent = `대기 ${pending.length}건`;
  document.getElementById('stat-total').textContent = profiles.length + '명';
  document.getElementById('stat-approved').textContent = approved.length + '명';
  document.getElementById('stat-pending').textContent = pending.length + '명';
  const { count } = await sb.from('store_data').select('*', { count: 'exact', head: true });
  document.getElementById('stat-data').textContent = (count || 0) + '건';

  // 가입 신청 목록
  const list = document.getElementById('admin-list');
  if (pending.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray);font-size:13px;">대기 중인 신청이 없어요</div>';
  } else {
    list.innerHTML = '';
    pending.forEach(p => {
      list.innerHTML += `
        <div class="admin-row">
          <div class="admin-avatar">${(p.nickname || '?')[0]}</div>
          <div class="admin-info">
            <div class="admin-name">${p.nickname} · ${p.brands?.name || '-'}</div>
            <div class="admin-sub">${p.biz_number} · ${p.email}</div>
            ${p.biz_image ? `<div style="margin-top:6px;"><a href="${p.biz_image}" target="_blank" style="font-size:11px;color:var(--blue);text-decoration:none;background:rgba(55,138,221,0.1);padding:3px 8px;border-radius:4px;">📎 사업자등록증 보기</a></div>` : '<div style="margin-top:4px;font-size:10px;color:var(--gray);">이미지 없음</div>'}
          </div>
          <div class="admin-btns">
            <button class="btn btn-sm" style="background:#D1FAE5;color:#059669;border:none;" onclick="updateStatus('${p.id}','approved')">승인</button>
            <button class="btn btn-sm" style="background:#FEE2E2;color:#DC2626;border:none;" onclick="updateStatus('${p.id}','rejected')">반려</button>
          </div>
        </div>`;
    });
  }

  // 문의 스레드 목록
  const { data: threads } = await sb.from('contact_threads')
    .select('*, contact_messages(id, is_read, sender_type)')
    .order('updated_at', { ascending: false });

  const contactList = document.getElementById('admin-contact-list');
  const unreadCount = (threads || []).filter(t =>
    t.contact_messages?.some(m => !m.is_read && m.sender_type === 'user')
  ).length;
  const badge = document.getElementById('admin-contact-badge');
  badge.textContent = `미확인 ${unreadCount}건`;
  badge.style.display = unreadCount > 0 ? '' : 'none';

  if (!threads || threads.length === 0) {
    contactList.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray);font-size:13px;">접수된 문의가 없어요</div>';
    return;
  }

  contactList.innerHTML = '';
  threads.forEach(t => {
    const hasUnread = t.contact_messages?.some(m => !m.is_read && m.sender_type === 'user');
    const date = new Date(t.updated_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const isClosed = t.status === 'closed';
    contactList.innerHTML += `
      <div class="admin-row" style="cursor:pointer;${isClosed ? 'opacity:0.5;' : ''}" onclick="openContactThread('${t.id}', true)">
        <div class="admin-avatar" style="background:${hasUnread ? 'var(--orange)' : 'var(--blue)'};">${(t.nickname || '?')[0]}</div>
        <div class="admin-info">
          <div class="admin-name" style="display:flex;align-items:center;gap:6px;">
            ${escapeHtml(t.nickname)} · ${escapeHtml(t.subject)}
            ${hasUnread ? '<span class="badge badge-orange" style="font-size:9px;">NEW</span>' : ''}
          </div>
          <div class="admin-sub">${date} · ${isClosed ? '종료됨' : '진행중'}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
  });

  // 승인된 회원 목록
  const approvedList = document.getElementById('admin-approved-list');
  document.getElementById('admin-approved-count').textContent = `${approved.length}명`;
  if (approved.length === 0) {
    approvedList.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray);font-size:13px;">승인된 회원이 없어요</div>';
  } else {
    approvedList.innerHTML = '';
    approved.forEach(p => {
      const date = new Date(p.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
      approvedList.innerHTML += `
        <div class="admin-row" style="flex-wrap:wrap;gap:6px;">
          <div class="admin-avatar" style="background:#059669;">${(p.nickname || '?')[0]}</div>
          <div class="admin-info" style="flex:1;min-width:0;">
            <div class="admin-name">${escapeHtml(p.nickname)} · ${p.brands?.name || '-'}</div>
            <div class="admin-sub">${p.biz_number} · ${p.email}</div>
            <div class="admin-sub">${date} 승인</div>
            ${p.biz_image ? `<div style="margin-top:4px;"><a href="${p.biz_image}" target="_blank" style="font-size:11px;color:var(--blue);text-decoration:none;background:rgba(55,138,221,0.1);padding:3px 8px;border-radius:4px;">📎 사업자등록증 보기</a></div>` : '<div style="margin-top:2px;font-size:10px;color:var(--gray);">이미지 없음</div>'}
          </div>
          <button class="btn btn-sm" style="background:#FEF3C7;color:#D97706;border:none;flex-shrink:0;" onclick="revokeApproval('${p.id}', '${escapeHtml(p.nickname)}')">승인 취소</button>
        </div>`;
    });
  }

  // 브랜드 관리
  await loadAdminBrands();
}

async function revokeApproval(userId, nickname) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;
  if (!confirm(`'${nickname}' 회원의 승인을 취소하고 심사중으로 전환할까요?`)) return;
  const { error } = await sb.from('profiles').update({ auth_status: 'pending' }).eq('id', userId);
  if (error) return alert('처리 실패: ' + error.message);
  await loadAdmin();
}

// ===== 관리자: 게시글 관리 =====
let adminPostPage = 0;
const ADMIN_POSTS_PER_PAGE = 20;

async function loadAdminPosts(append = false) {
  if (!append) adminPostPage = 0;
  const from = adminPostPage * ADMIN_POSTS_PER_PAGE;
  const to = from + ADMIN_POSTS_PER_PAGE - 1;

  const { data: posts } = await sb.from('posts')
    .select('id, title, nickname, board, created_at, like_count, comment_count')
    .order('created_at', { ascending: false })
    .range(from, to);

  const list = document.getElementById('admin-posts-list');
  if (!append) list.innerHTML = '';

  const boardLabels = { free: '자유', incident: '사건사고', brand: '브랜드' };
  if (!posts || posts.length === 0) {
    if (!append) list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray);font-size:13px;">게시글이 없어요</div>';
    document.getElementById('admin-posts-load-more')?.classList.add('hidden');
    return;
  }

  posts.forEach(p => {
    const date = new Date(p.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    list.innerHTML += `
      <div class="admin-row">
        <div class="admin-info" style="flex:1;min-width:0;">
          <div class="admin-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.title)}</div>
          <div class="admin-sub">${boardLabels[p.board] || p.board} · ${escapeHtml(p.nickname)} · ${date} · 💬${p.comment_count||0} 👍${p.like_count||0}</div>
        </div>
        <button class="btn btn-sm" style="background:#FEE2E2;color:#DC2626;border:none;flex-shrink:0;" onclick="adminDeletePost('${p.id}')">삭제</button>
      </div>`;
  });

  const loadMoreBtn = document.getElementById('admin-posts-load-more');
  if (loadMoreBtn) loadMoreBtn.classList.toggle('hidden', posts.length < ADMIN_POSTS_PER_PAGE);
}

async function loadMoreAdminPosts() {
  adminPostPage++;
  await loadAdminPosts(true);
}

async function adminDeletePost(postId) {
  if (!confirm('이 게시글을 삭제할까요?')) return;
  const { error } = await sb.from('posts').delete().eq('id', postId);
  if (error) { alert('삭제 실패: ' + error.message); return; }
  await loadAdminPosts();
}

async function updateStatus(userId, status) {
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert('관리자만 처리할 수 있어요.');
    return;
  }
  const { error } = await sb.from('profiles').update({ auth_status: status }).eq('id', userId);
  if (error) {
    alert('처리 실패: ' + error.message);
    return;
  }
  await loadAdmin();
}
