// ===== 프로필 로드 =====
async function loadProfile() {
  const { data } = await sb.from('profiles')
    .select('*, brands(name, category, avg_labor_rate, avg_material_rate, avg_rent_rate, avg_delivery_rate, avg_utility_rate, avg_royalty_rate, avg_other_rate, avg_net_profit_rate)')
    .eq('id', currentUser.id).single();
  currentProfile = data;
  currentBrand = data?.brands;
}

// ===== 초기화 =====
async function init() {
  const { data: { session } } = await sb.auth.getSession();

  // 토큰이 포함된 해시(비밀번호 재설정 등)만 제거, 페이지 해시는 유지
  if (window.location.hash && window.location.hash.includes('=')) {
    history.replaceState(null, '', window.location.pathname);
  }

  // 비밀번호 재설정 정상 링크 (type=recovery)
  if (_initParams.get('type') === 'recovery') {
    const access_token = _initParams.get('access_token');
    const refresh_token = _initParams.get('refresh_token');
    if (access_token && refresh_token) {
      await sb.auth.setSession({ access_token, refresh_token });
    }
    await loadBrands();
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    showPage('reset-password');
    return;
  }

  // 비밀번호 재설정 링크 오류 (만료 등)
  if (_initParams.get('error')) {
    await loadBrands();
    showPage('login');
    showAlert('login-alert', '비밀번호 재설정 링크가 만료됐어요. 다시 요청해주세요.', 'error');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    return;
  }

  if (session) {
    currentUser = session.user;
    await loadProfile();

    // 새로고침 시 마지막 페이지 복원
    const savedPage = window.location.hash.slice(1);
    const adminPages = ['admin'];
    const approvedPages = ['home', 'store-data', 'community', 'mypage'];

    if (currentUser.email === ADMIN_EMAIL) {
      const target = [...adminPages, ...approvedPages].includes(savedPage) ? savedPage : 'admin';
      showPage(target);
    } else if (currentProfile?.auth_status === 'approved') {
      const target = approvedPages.includes(savedPage) ? savedPage : 'home';
      showPage(target);
    } else {
      showPage('mypage');
    }
  } else {
    showPage('landing');
  }
  await loadBrands();
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

// ===== 로그인 =====
function showForgotPassword() {
  const overlay = document.getElementById('forgot-overlay');
  overlay.style.display = 'flex';
  document.getElementById('forgot-email').value = document.getElementById('login-email').value;
  document.getElementById('forgot-alert').innerHTML = '';
}

function hideForgotPassword() {
  document.getElementById('forgot-overlay').style.display = 'none';
}

async function sendResetEmail() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) return showAlert('forgot-alert', '이메일을 입력해주세요.', 'error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert('forgot-alert', '올바른 이메일 형식이 아니에요.', 'error');
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
      return showAlert('forgot-alert', '잠시 후 다시 시도해주세요. (이메일 발송 횟수 제한)', 'error');
    }
    return showAlert('forgot-alert', `전송 실패: ${error.message}`, 'error');
  }
  showAlert('forgot-alert', '재설정 링크를 발송했어요. 이메일을 확인해주세요.', 'success');
  setTimeout(hideForgotPassword, 3000);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-pw').value;
  if (!email || !pw) return showAlert('login-alert', '이메일과 비밀번호를 입력해주세요.', 'error');
  const { error } = await sb.auth.signInWithPassword({ email, password: pw });
  if (error) return showAlert('login-alert', '이메일 또는 비밀번호가 틀렸어요.', 'error');
  const { data: { user } } = await sb.auth.getUser();
  currentUser = user;
  await loadProfile();
  if (currentUser.email === ADMIN_EMAIL) return showPage('admin');
  if (currentProfile?.auth_status === 'approved') showPage('home');
  else showPage('mypage');
}

// ===== 비밀번호 재설정 =====
async function doResetPassword() {
  const pw = document.getElementById('reset-pw').value;
  const pw2 = document.getElementById('reset-pw2').value;
  if (!pw || pw.length < 6) return showAlert('reset-alert', '비밀번호는 6자 이상 입력해주세요.', 'error');
  if (pw !== pw2) return showAlert('reset-alert', '비밀번호가 일치하지 않아요.', 'error');
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return showAlert('reset-alert', `비밀번호 변경에 실패했어요: ${error.message}`, 'error');
  showAlert('reset-alert', '비밀번호가 변경됐어요! 로그인 페이지로 이동합니다.', 'success');
  await sb.auth.signOut();
  setTimeout(() => showPage('login'), 2000);
}

// ===== 로그아웃 =====
async function doLogout() {
  await sb.auth.signOut();
  currentUser = null; currentProfile = null; currentBrand = null;
  showPage('landing');
}

// ===== 회원가입 =====
async function doSignup() {
  const email = document.getElementById('su-email').value.trim();
  const nick = document.getElementById('su-nick').value.trim();
  const pw = document.getElementById('su-pw').value;
  const pw2 = document.getElementById('su-pw2').value;
  const biz = document.getElementById('su-biz').value.trim().replace(/-/g, '');
  const brandId = document.getElementById('su-brand').value;
  const region = document.getElementById('su-region').value;
  const file = document.getElementById('su-biz-img').files[0];

  if (!email || !nick || !pw || !biz || !brandId || !region || !file) return showAlert('signup-alert', '모든 항목을 입력해주세요.', 'error');
  if (pw !== pw2) return showAlert('signup-alert', '비밀번호가 일치하지 않아요.', 'error');
  if (pw.length < 6) return showAlert('signup-alert', '비밀번호는 6자 이상이어야 해요.', 'error');
  if (biz.length !== 10 || !/^\d+$/.test(biz)) return showAlert('signup-alert', '사업자등록번호는 숫자 10자리예요.', 'error');

  // 이메일 중복 체크
  const { data: emailCheck } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
  if (emailCheck) return showAlert('signup-alert', '이미 가입된 이메일이에요.', 'error');

  // 닉네임 중복 체크
  const { data: nickCheck } = await sb.from('profiles').select('id').eq('nickname', nick).maybeSingle();
  if (nickCheck) return showAlert('signup-alert', '이미 사용 중인 닉네임이에요.', 'error');

  // 사업자번호 중복 체크
  const { data: dupCheck } = await sb.from('profiles').select('id').eq('biz_number', biz).maybeSingle();
  if (dupCheck) return showAlert('signup-alert', '이미 가입된 사업자등록번호예요.', 'error');

  showAlert('signup-alert', '사업자번호 확인 중이에요...', 'info');

  // 국세청 사업자번호 유효성 검증
  try {
    const bizRes = await fetch('https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=93e94121cb07ec28f29f47201298fe3b5aaf830ce9dc0b2f603fcfcd53d4ada9', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ b_no: [biz] })
    });
    const bizData = await bizRes.json();
    const bizStatus = bizData?.data?.[0]?.b_stt_cd;
    if (bizStatus === '03') return showAlert('signup-alert', '폐업된 사업자등록번호예요. 확인해주세요.', 'error');
    if (!bizStatus) {
      const valid = validateBizNum(biz);
      if (!valid) return showAlert('signup-alert', '유효하지 않은 사업자등록번호예요.', 'error');
    }
  } catch (e) {
    const valid = validateBizNum(biz);
    if (!valid) return showAlert('signup-alert', '유효하지 않은 사업자등록번호예요.', 'error');
  }

  showAlert('signup-alert', '처리 중이에요...', 'info');

  const ext = file.name.split('.').pop();
  const filePath = `biz/${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from('biz-images').upload(filePath, file);
  if (upErr) return showAlert('signup-alert', '이미지 업로드에 실패했어요: ' + upErr.message, 'error');

  const { data: urlData } = sb.storage.from('biz-images').getPublicUrl(filePath);
  const bizImageUrl = urlData.publicUrl;

  const { data: authData, error: authErr } = await sb.auth.signUp({ email, password: pw });
  if (authErr) return showAlert('signup-alert', authErr.message, 'error');
  if (!authData?.user) return showAlert('signup-alert', '이미 가입된 이메일이에요.', 'error');
  if (authData.user.identities?.length === 0) return showAlert('signup-alert', '이미 가입된 이메일이에요.', 'error');

  const { error: profileErr } = await sb.from('profiles').insert({
    id: authData.user.id, email, nickname: nick,
    biz_number: biz, biz_image: bizImageUrl,
    brand_id: brandId, auth_status: 'pending', region
  });
  if (profileErr) return showAlert('signup-alert', '가입 처리 실패: ' + profileErr.message, 'error');

  // 관리자에게 가입 알림 이메일 발송
  const brandName = allBrands.find(b => String(b.id) === String(brandId))?.name || brandId;
  fetch('https://vogyfomyhrvqswivqhdv.supabase.co/functions/v1/smooth-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ type: 'signup', nickname: nick, brand: brandName, biz_number: biz, email })
  }).catch(() => {}); // 알림 실패해도 가입은 정상 처리

  currentUser = authData.user;
  await loadProfile();
  showPage('mypage');
}

// 사업자번호 체크섬 검증
function validateBizNum(biz) {
  if (biz.length !== 10) return false;
  const d = biz.split('').map(Number);
  const k = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += k[i] * d[i];
  sum += Math.floor((k[8] * d[8]) / 10);
  return (10 - (sum % 10)) % 10 === d[9];
}
