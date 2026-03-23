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
  const list = document.getElementById('admin-list');
  if (pending.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray);font-size:13px;">대기 중인 신청이 없어요</div>';
    return;
  }
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

async function updateStatus(userId, status) {
  await sb.from('profiles').update({ auth_status: status }).eq('id', userId);
  loadAdmin();
}
