// ===== 문의하기 =====
function loadContact() {
  document.getElementById('contact-alert').innerHTML = '';
  document.getElementById('contact-subject').value = '';
  document.getElementById('contact-message').value = '';
}

async function submitContact() {
  const subject = document.getElementById('contact-subject').value;
  const message = document.getElementById('contact-message').value.trim();

  if (!subject || !message) return showAlert('contact-alert', '문의 유형과 내용을 입력해주세요.', 'error');

  const btn = document.getElementById('contact-submit-btn');
  btn.disabled = true;
  btn.textContent = '전송 중...';

  // 스레드 생성
  const { data: thread, error: threadErr } = await sb.from('contact_threads').insert({
    user_id: currentUser.id,
    nickname: currentProfile?.nickname || '익명',
    subject
  }).select().single();

  if (threadErr) {
    btn.disabled = false;
    btn.textContent = '문의 보내기';
    return showAlert('contact-alert', '전송 실패: ' + threadErr.message, 'error');
  }

  // 첫 메시지 생성
  const { error: msgErr } = await sb.from('contact_messages').insert({
    thread_id: thread.id,
    sender_type: 'user',
    message
  });

  btn.disabled = false;
  btn.textContent = '문의 보내기';

  if (msgErr) return showAlert('contact-alert', '전송 실패: ' + msgErr.message, 'error');

  // 관리자에게 문의 알림 이메일 발송
  fetch('https://vogyfomyhrvqswivqhdv.supabase.co/functions/v1/notify-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ type: 'contact', nickname: currentProfile?.nickname || '익명', subject, message })
  }).catch(() => {});

  showAlert('contact-alert', '문의가 접수됐어요!', 'success');
  document.getElementById('contact-subject').value = '';
  document.getElementById('contact-message').value = '';

  // 1초 후 스레드 상세로 이동
  setTimeout(() => openContactThread(thread.id, false), 1000);
}
