const TAB_ICONS = {
  home: `<svg viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>`,
  'store-data': `<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
  community: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  mypage: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  'post-detail': `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`,
  admin: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`
};

const NORMAL_TABS = [
  { page: 'store-data', label: '매출 기록' },
  { page: 'home', label: '분석' },
  { page: 'community', label: '언더커버' },
  { page: 'mypage', label: '마이페이지' },
];

const ADMIN_TABS = [
  { page: 'store-data', label: '매출 기록' },
  { page: 'home', label: '분석' },
  { page: 'community', label: '언더커버' },
  { page: 'mypage', label: '마이페이지' },
  { page: 'admin', label: '관리자' },
];

function renderTabBar(activePage) {
  const bar = document.getElementById('global-tab-bar');
  const noTabPages = ['landing', 'login', 'signup', 'reset-password', 'reapply'];
  if (noTabPages.includes(activePage) || !currentUser) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const tabs = isAdmin ? ADMIN_TABS : NORMAL_TABS;
  // post-detail은 community가 active
  const activeKey = activePage === 'post-detail' ? 'community' : activePage;
  bar.innerHTML = tabs.map(t => `
    <button class="tab-item${t.page === activeKey ? ' active' : ''}" data-page="${t.page}">
      <span class="tab-icon">${TAB_ICONS[t.page]}</span>
      <span class="tab-label">${t.label}</span>
    </button>`).join('');
}

function showPage(name) {
  const restrictedPages = ['store-data', 'community'];
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  if (restrictedPages.includes(name) && !isAdmin && currentProfile?.auth_status !== 'approved') {
    showRestrictedPage(name);
    return;
  }

  // URL 해시 업데이트 (새로고침 시 복원용)
  const noHashPages = ['landing', 'login', 'signup', 'reset-password', 'reapply'];
  if (!noHashPages.includes(name)) {
    history.replaceState(null, '', '#' + name);
  } else {
    history.replaceState(null, '', window.location.pathname);
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) { pg.classList.add('active'); window.scrollTo(0, 0); }
  renderTabBar(name);
  if (name === 'home') loadHome();
  if (name === 'mypage') loadMypage();
  if (name === 'store-data') loadStoreDataPage();
  if (name === 'community') loadCommunity();
  if (name === 'admin') loadAdmin();
  if (name === 'reapply') loadReapplyPage();
  if (name === 'contact') loadContact();
  if (name === 'contact-thread') loadContactThread();
  if (name === 'landing') renderLandingForUser();
}

function showRestrictedPage(name) {
  const labels = { 'store-data': '매출 기록', 'community': '점주방' };
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) { pg.classList.add('active'); window.scrollTo(0, 0); }
  renderTabBar(name);
  const notice = `<div style="text-align:center;padding:80px 20px;">
    <div style="font-size:40px;margin-bottom:16px;">🔒</div>
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;">${labels[name]}</div>
    <div style="font-size:13px;color:var(--gray);">점주 인증 승인 후 이용 가능해요.<br>마이페이지에서 심사 상태를 확인해보세요.</div>
    <button class="btn btn-outline btn-sm" style="margin-top:20px;width:auto;padding:10px 24px;" data-page="mypage">마이페이지로 이동</button>
  </div>`;
  const container = pg?.querySelector('.container');
  if (container) container.innerHTML = notice;
}

function renderLandingForUser() {
  const navRight = document.getElementById('landing-nav-right');
  const actions = document.getElementById('landing-actions');
  if (currentUser) {
    const dest = currentUser.email === ADMIN_EMAIL ? 'admin' : (currentProfile?.auth_status === 'approved' ? 'home' : 'mypage');
    navRight.innerHTML = `<button class="btn btn-primary btn-sm" data-page="${dest}">앱으로 이동</button>`;
    actions.innerHTML = `<button class="btn btn-primary" data-page="${dest}" style="padding:14px;">앱으로 이동 →</button>`;
  } else {
    navRight.innerHTML = `<button class="nav-btn" data-page="login">로그인</button><button class="btn btn-primary btn-sm" data-page="signup">시작하기</button>`;
    actions.innerHTML = `<button class="btn btn-primary" data-page="signup" style="padding:14px;">무료로 시작하기 →</button><button class="btn btn-outline" data-page="login" style="padding:14px;">로그인</button>`;
  }
}

function switchPreview(tab) {
  document.getElementById('preview-data').classList.toggle('hidden', tab !== 'data');
  document.getElementById('preview-comm').classList.toggle('hidden', tab !== 'comm');
  document.getElementById('preview-tab-data').classList.toggle('active', tab === 'data');
  document.getElementById('preview-tab-comm').classList.toggle('active', tab === 'comm');
}
