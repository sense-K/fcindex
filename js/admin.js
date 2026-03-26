// ===== 어드민 =====
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
