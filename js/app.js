// ===== 페이지 이동 이벤트 위임 =====
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (btn) showPage(btn.dataset.page);
});

// ===== 회원가입 단계 이동 =====
function gotoSignupStep(n) {
  const current = parseInt(document.querySelector('.su-step.active')?.dataset.step || '1');
  // 앞으로 이동 시 현재 단계 검증
  if (n > current) {
    if (current === 1) {
      const nick = document.getElementById('su-nick').value.trim();
      if (!nick) return showAlert('signup-alert', '닉네임을 입력해주세요.', 'error');
      if (!_googleSignupMode) {
        const email = document.getElementById('su-email').value.trim();
        const pw  = document.getElementById('su-pw').value;
        const pw2 = document.getElementById('su-pw2').value;
        if (!email || !pw || !pw2) return showAlert('signup-alert', '모든 항목을 입력해주세요.', 'error');
        if (pw !== pw2) return showAlert('signup-alert', '비밀번호가 일치하지 않아요.', 'error');
        if (pw.length < 6) return showAlert('signup-alert', '비밀번호는 6자 이상이어야 해요.', 'error');
      }
    }
    if (current === 2) {
      const biz = document.getElementById('su-biz').value.trim().replace(/-/g, '');
      const brand = document.getElementById('su-brand').value;
      const region = document.getElementById('su-region').value;
      if (!biz || !brand || !region) return showAlert('signup-alert', '모든 항목을 입력해주세요.', 'error');
      if (biz.length !== 10 || !/^\d+$/.test(biz)) return showAlert('signup-alert', '사업자등록번호는 숫자 10자리예요.', 'error');
      if (!isValidBizNum(biz)) return showAlert('signup-alert', '유효하지 않은 사업자등록번호예요. 다시 확인해주세요.', 'error');
    }
  }
  document.getElementById('signup-alert').innerHTML = '';
  [1, 2, 3].forEach(i => {
    const el = document.getElementById(`su-step-${i}`);
    if (el) el.classList.toggle('hidden', i !== n);
  });
  document.querySelectorAll('.su-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s === n);
    el.classList.toggle('done', s < n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 사업자번호 체크섬 검증 (국세청 알고리즘) =====
function isValidBizNum(biz) {
  if (biz.length !== 10 || !/^\d+$/.test(biz)) return false;
  const w = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(biz[i]) * w[i];
  sum += Math.floor((parseInt(biz[8]) * 5) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(biz[9]);
}

// ===== 사업자번호 자동 하이픈 =====
function formatBizNum(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 10);
  if (v.length >= 6) v = v.slice(0, 3) + '-' + v.slice(3, 5) + '-' + v.slice(5);
  else if (v.length >= 4) v = v.slice(0, 3) + '-' + v.slice(3);
  input.value = v;
}

// ===== 파일 업로드 파일명 표시 =====
function showFileName(input, targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const name = input.files[0]?.name;
  if (name) {
    el.textContent = '📎 ' + name;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

init();
