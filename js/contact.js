// ===== 문의하기 =====
function loadContact() {
  document.getElementById('contact-alert').innerHTML = '';
  document.getElementById('contact-subject').value = '';
  document.getElementById('contact-message').value = '';
  if (currentProfile) {
    document.getElementById('contact-name').value = currentProfile.nickname || '';
  }
}

async function submitContact() {
  const name = document.getElementById('contact-name').value.trim();
  const subject = document.getElementById('contact-subject').value;
  const message = document.getElementById('contact-message').value.trim();

  if (!subject || !message) return showAlert('contact-alert', '문의 유형과 내용을 입력해주세요.', 'error');

  const btn = document.getElementById('contact-submit-btn');
  btn.disabled = true;
  btn.textContent = '전송 중...';

  const { error } = await sb.from('contacts').insert({
    user_id: currentUser?.id || null,
    nickname: name || currentProfile?.nickname || '익명',
    email: currentUser?.email || null,
    subject,
    message
  });

  btn.disabled = false;
  btn.textContent = '문의 보내기';

  if (error) return showAlert('contact-alert', '전송 실패: ' + error.message, 'error');

  showAlert('contact-alert', '문의가 접수됐어요! 빠르게 검토할게요.', 'success');
  document.getElementById('contact-subject').value = '';
  document.getElementById('contact-message').value = '';
}
