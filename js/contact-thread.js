// ===== 문의 스레드 상세 =====
let currentThreadId = null;
let currentThreadIsAdmin = false;

function openContactThread(threadId, fromAdmin) {
  currentThreadId = threadId;
  currentThreadIsAdmin = fromAdmin;
  showPage('contact-thread');
}

async function loadContactThread() {
  if (!currentThreadId) return;

  // 뒤로가기 버튼 목적지 설정
  document.getElementById('contact-thread-back-btn').dataset.page = currentThreadIsAdmin ? 'admin' : 'mypage';

  // 관리자 전용 '종료' 버튼
  const closeBtn = document.getElementById('contact-thread-close-btn');
  if (currentThreadIsAdmin) closeBtn.classList.remove('hidden');
  else closeBtn.classList.add('hidden');

  const { data: thread } = await sb.from('contact_threads')
    .select('*').eq('id', currentThreadId).single();
  if (!thread) return;

  document.getElementById('contact-thread-subject').textContent = thread.subject;
  document.getElementById('contact-thread-date').textContent =
    new Date(thread.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const statusBadge = document.getElementById('contact-thread-status-badge');
  const isClosed = thread.status === 'closed';
  if (isClosed) {
    statusBadge.textContent = '종료됨';
    statusBadge.className = 'badge badge-pending';
    document.getElementById('contact-thread-reply-form').classList.add('hidden');
    document.getElementById('contact-thread-closed-notice').classList.remove('hidden');
  } else {
    statusBadge.textContent = '진행중';
    statusBadge.className = 'badge badge-approved';
    document.getElementById('contact-thread-reply-form').classList.remove('hidden');
    document.getElementById('contact-thread-closed-notice').classList.add('hidden');
  }

  // 메시지 로드
  const { data: messages } = await sb.from('contact_messages')
    .select('*').eq('thread_id', currentThreadId).order('created_at');

  const container = document.getElementById('contact-thread-messages');
  if (!messages || messages.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:32px;color:var(--gray);font-size:13px;">메시지가 없어요</div>';
    return;
  }

  container.innerHTML = messages.map(m => {
    const isAdmin = m.sender_type === 'admin';
    const date = new Date(m.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const bg = isAdmin ? '#fff' : 'var(--navy)';
    const color = isAdmin ? 'var(--navy)' : '#fff';
    const border = isAdmin ? '1px solid var(--border)' : 'none';
    const radius = isAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px';
    return `
      <div style="display:flex;flex-direction:column;align-items:${isAdmin ? 'flex-start' : 'flex-end'};">
        <div style="max-width:78%;background:${bg};color:${color};border:${border};border-radius:${radius};padding:10px 14px;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${escapeHtml(m.message)}</div>
        <div style="font-size:10px;color:var(--gray);margin-top:4px;">${isAdmin ? '관리자 · ' : ''}${date}</div>
      </div>`;
  }).join('');

  window.scrollTo(0, document.body.scrollHeight);

  // 읽음 처리
  const unreadIds = messages
    .filter(m => !m.is_read && (currentThreadIsAdmin ? m.sender_type === 'user' : m.sender_type === 'admin'))
    .map(m => m.id);
  if (unreadIds.length > 0) {
    sb.from('contact_messages').update({ is_read: true }).in('id', unreadIds);
  }
}

async function sendThreadReply() {
  const input = document.getElementById('contact-thread-reply-input');
  const message = input.value.trim();
  if (!message) return;

  const btn = document.getElementById('contact-thread-send-btn');
  btn.disabled = true;
  btn.textContent = '...';

  const { error } = await sb.from('contact_messages').insert({
    thread_id: currentThreadId,
    sender_type: currentThreadIsAdmin ? 'admin' : 'user',
    message
  });

  btn.disabled = false;
  btn.textContent = '전송';

  if (error) return alert('전송 실패: ' + error.message);
  input.value = '';
  await loadContactThread();
}

async function closeContactThread() {
  if (!confirm('문의를 종료할까요? 종료 후에는 추가 답변이 불가해요.')) return;
  await sb.from('contact_threads').update({ status: 'closed' }).eq('id', currentThreadId);
  await loadContactThread();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
