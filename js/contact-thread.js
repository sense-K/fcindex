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

  document.getElementById('contact-thread-back-btn').dataset.page = currentThreadIsAdmin ? 'admin' : 'mypage';

  const { data: thread } = await sb.from('contact_threads')
    .select('*').eq('id', currentThreadId).single();
  if (!thread) return;

  // 문의 유형, 날짜
  document.getElementById('contact-thread-subject').textContent = thread.subject;
  document.getElementById('contact-thread-date').textContent =
    new Date(thread.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 상태 뱃지
  const isClosed = thread.status === 'closed';
  const statusBadge = document.getElementById('contact-thread-status-badge');
  statusBadge.textContent = isClosed ? '종료됨' : '진행중';
  statusBadge.className = isClosed ? 'badge badge-pending' : 'badge badge-approved';

  // 메시지 로드
  const { data: messages } = await sb.from('contact_messages')
    .select('*').eq('thread_id', currentThreadId).order('created_at');

  if (!messages || messages.length === 0) return;

  // 첫 번째 메시지 = 원본 문의 내용
  document.getElementById('contact-thread-original').textContent = messages[0].message;

  // 나머지 = 관리자 답변 목록
  const replies = messages.slice(1).filter(m => m.sender_type === 'admin');
  const repliesEl = document.getElementById('contact-thread-replies');

  if (replies.length === 0) {
    repliesEl.innerHTML = `<div style="text-align:center;font-size:13px;color:var(--gray);padding:16px 0;">아직 답변이 등록되지 않았어요</div>`;
  } else {
    repliesEl.innerHTML = replies.map(m => {
      const date = new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      return `
        <div class="card" style="border-left:3px solid var(--blue);padding:12px 14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <div style="width:20px;height:20px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:700;">관</div>
            <span style="font-size:12px;font-weight:600;color:var(--navy);">관리자</span>
            <span style="font-size:11px;color:var(--gray);">${date}</span>
          </div>
          <div style="font-size:13px;line-height:1.75;white-space:pre-wrap;word-break:break-word;">${escapeHtml(m.message)}</div>
        </div>`;
    }).join('');
  }

  // 답변 폼 / 종료 안내 표시 제어
  const replyForm = document.getElementById('contact-thread-reply-form');
  const closedNotice = document.getElementById('contact-thread-closed-notice');
  const closeBtn = document.getElementById('contact-thread-close-btn');

  if (isClosed) {
    replyForm.classList.add('hidden');
    closedNotice.classList.remove('hidden');
    closeBtn.classList.add('hidden');
  } else if (currentThreadIsAdmin) {
    replyForm.classList.remove('hidden');
    closedNotice.classList.add('hidden');
    closeBtn.classList.remove('hidden');
  } else {
    replyForm.classList.add('hidden');
    closedNotice.classList.add('hidden');
    closeBtn.classList.add('hidden');
  }

  // 읽음 처리
  const unreadIds = messages
    .filter(m => !m.is_read && (currentThreadIsAdmin ? m.sender_type === 'user' : m.sender_type === 'admin'))
    .map(m => m.id);
  if (unreadIds.length > 0) {
    await sb.from('contact_messages').update({ is_read: true }).in('id', unreadIds);
  }
}

async function sendThreadReply() {
  if (!currentThreadIsAdmin) return;
  const input = document.getElementById('contact-thread-reply-input');
  const message = input.value.trim();
  if (!message) return;

  const btn = document.getElementById('contact-thread-send-btn');
  btn.disabled = true;
  btn.textContent = '등록 중...';

  const { error } = await sb.from('contact_messages').insert({
    thread_id: currentThreadId,
    sender_type: 'admin',
    message
  });

  btn.disabled = false;
  btn.textContent = '답변 등록';

  if (error) return alert('등록 실패: ' + error.message);
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
