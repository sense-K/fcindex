// ===== 커뮤니티 =====
let likeInProgress = false;
let currentBoard = 'free';
let currentFlair = null;
let currentPostBoard = 'free';

const BOARD_FLAIRS = {
  free:     ['자유', '수익·매출', '본사 이야기', '직원·인력', '창업·폐업', '세무·법률', '마케팅·배달', '질문'],
  incident: ['진상 손님', '본사 갑질', '사기·피해', '리뷰 테러', '기타'],
  brand:    ['자유', '수익·매출', '본사 이야기', '직원 구인', '메뉴·식재료', '장비·시설', '행사·이벤트', '질문']
};

// 게시판/댓글에 표시할 이름 계산
function getDisplayName(board) {
  const brandName = currentBrand?.name || '익명';
  if (board === 'brand') {
    const region = currentProfile?.region || '';
    return region ? `${brandName}_${region}` : brandName;
  }
  if (board === 'incident') {
    return currentBrand?.category || '프랜차이즈';
  }
  return brandName;
}

// 게시판 탭 전환
async function switchBoard(board) {
  currentBoard = board;
  currentFlair = null;
  renderBoardUI();
  await loadCommunity();
}

// 플레어 필터 전환
async function switchFlair(flair) {
  currentFlair = currentFlair === flair ? null : flair;
  renderFlairFilter();
  await loadCommunity();
}

function renderBoardUI() {
  renderBoardTabs();
  renderFlairFilter();
}

function renderBoardTabs() {
  ['free', 'incident', 'brand'].forEach(b => {
    document.getElementById(`board-tab-${b}`)?.classList.toggle('active', b === currentBoard);
  });
  const descs = {
    free:     '모든 점주가 자유롭게 이야기해요',
    incident: '경험을 공유하고 서로 주의를 나눠요',
    brand:    `${currentBrand?.name || ''} 점주분들만의 공간이에요`
  };
  document.getElementById('comm-board-desc').textContent = descs[currentBoard];

  // 사건사고 면책조항 표시/숨김
  document.getElementById('incident-disclaimer')?.classList.toggle('hidden', currentBoard !== 'incident');

  // 글쓰기 폼 안내 텍스트
  const noticeEl = document.getElementById('write-post-notice');
  if (noticeEl) {
    const notices = {
      free:     '브랜드명으로 익명 작성돼요',
      incident: '업종 카테고리로만 표시돼요 (예: 치킨)',
      brand:    '브랜드명_지역으로 작성돼요'
    };
    noticeEl.textContent = notices[currentBoard];
  }
}

function renderFlairFilter() {
  const container = document.getElementById('flair-filter');
  container.innerHTML = BOARD_FLAIRS[currentBoard].map(f => `
    <button class="month-tab${currentFlair === f ? ' active' : ''}" onclick="switchFlair('${f}')">${f}</button>
  `).join('');
}

function renderWriteFlairs() {
  const select = document.getElementById('post-flair');
  select.innerHTML = '<option value="">머릿글 선택 (선택사항)</option>' +
    BOARD_FLAIRS[currentBoard].map(f => `<option value="${f}">${f}</option>`).join('');
}

// ===== 글 목록 로드 =====
async function loadCommunity() {
  renderBoardUI();

  let query = sb.from('posts')
    .select('id, author_id, brand_id, title, content, like_count, comment_count, created_at, nickname, flair, board')
    .eq('board', currentBoard)
    .order('created_at', { ascending: false });

  if (currentBoard === 'brand' && currentProfile?.brand_id) {
    query = query.eq('brand_id', currentProfile.brand_id);
  }
  if (currentFlair) {
    query = query.eq('flair', currentFlair);
  }

  const { data } = await query;
  const list = document.getElementById('post-list');
  const empty = document.getElementById('comm-empty');
  list.innerHTML = '';

  if (!data || data.length === 0) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  const colors = ['#E8790C', '#378ADD', '#1D9E75', '#D4537E', '#888780'];
  data.forEach((p, i) => {
    const color = colors[i % colors.length];
    const date = new Date(p.created_at).toLocaleDateString('ko-KR');
    const div = document.createElement('div');
    div.className = 'post-card';
    const flairBadge = p.flair
      ? `<span class="badge badge-blue" style="font-size:9px;margin-right:4px;">${p.flair}</span>` : '';
    div.innerHTML = `
      <div class="post-top">
        <div class="post-avatar" style="background:${color};">${(p.nickname || '익')[0]}</div>
        <div>
          <div class="post-user">${escapeHtml(p.nickname || '익명')}</div>
          <div class="post-brand">${flairBadge}${date}</div>
        </div>
      </div>
      <div class="post-title">${escapeHtml(p.title)}</div>
      <div class="post-footer">
        <span class="post-stat">💬 ${p.comment_count || 0}</span>
        <span class="post-stat">👍 ${p.like_count || 0}</span>
      </div>`;
    div.onclick = () => showPostDetail(p, color);
    list.appendChild(div);
  });
}

// ===== 글 상세 =====
function showPostDetail(p, color) {
  currentPostId = p.id;
  currentPostAuthorId = p.author_id;
  currentPostBoard = p.board || 'free';

  const date = new Date(p.created_at).toLocaleDateString('ko-KR');
  document.getElementById('detail-avatar').textContent = (p.nickname || '익')[0];
  document.getElementById('detail-avatar').style.background = color || 'var(--orange)';
  document.getElementById('detail-author').textContent = p.nickname || '익명';
  document.getElementById('detail-meta').textContent = (p.flair ? `[${p.flair}] · ` : '') + date;
  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-content').textContent = p.content;
  document.getElementById('detail-likes').textContent = p.like_count || 0;
  document.getElementById('detail-comments').textContent = p.comment_count || 0;
  setLikeBtn(false);

  const actions = document.getElementById('post-author-actions');
  const isAuthor = currentUser && String(p.author_id) === String(currentUser.id);
  actions.innerHTML = isAuthor
    ? `<button class="nav-btn" onclick="deletePost()" style="font-size:12px;color:#FCA5A5;">삭제</button>` : '';

  document.getElementById('post-view-card').classList.remove('hidden');
  document.getElementById('post-edit-card').classList.add('hidden');
  showPage('post-detail');
  loadComments();
  loadLikeStatus(p.id);
}

// ===== 댓글 =====
async function loadComments() {
  if (!currentPostId) return;
  const { data, error } = await sb.from('post_comments')
    .select('id, author_id, content, created_at, nickname')
    .eq('post_id', currentPostId)
    .order('created_at', { ascending: true });
  const list = document.getElementById('comment-list');
  if (error) {
    list.innerHTML = `<div style="padding:12px;font-size:12px;color:#DC2626;background:#FEF2F2;border-radius:8px;">⚠️ ${error.message}</div>`;
    document.getElementById('comment-count-label').textContent = 0;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:16px 0;font-size:12px;color:var(--gray);">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</div>';
    document.getElementById('comment-count-label').textContent = 0;
    return;
  }
  document.getElementById('comment-count-label').textContent = data.length;
  document.getElementById('detail-comments').textContent = data.length;
  list.innerHTML = '';
  data.forEach(c => {
    const date = new Date(c.created_at).toLocaleDateString('ko-KR');
    const isMine = currentUser && c.author_id === currentUser.id;
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(c.nickname || '익명')}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="comment-date">${date}</span>
          ${isMine ? `<button class="comment-delete-btn">삭제</button>` : ''}
        </div>
      </div>
      <div class="comment-text"></div>`;
    div.querySelector('.comment-text').textContent = c.content;
    if (isMine) {
      div.querySelector('.comment-delete-btn').addEventListener('click', () => deleteComment(c.id));
    }
    list.appendChild(div);
  });
}

async function submitComment() {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content || !currentUser || !currentPostId) return;
  const btn = document.getElementById('comment-submit-btn');
  if (btn) btn.disabled = true;
  try {
    const { error } = await sb.from('post_comments').insert({
      post_id: currentPostId,
      author_id: currentUser.id,
      content,
      nickname: getDisplayName(currentPostBoard)
    });
    if (error) { alert('댓글 등록 실패: ' + error.message); return; }
    input.value = '';
    const { data: post } = await sb.from('posts').select('comment_count').eq('id', currentPostId).single();
    await sb.from('posts').update({ comment_count: (post?.comment_count || 0) + 1 }).eq('id', currentPostId);
    await loadComments();
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function deleteComment(commentId) {
  if (!confirm('댓글을 삭제할까요?')) return;
  const { error } = await sb.from('post_comments').delete().eq('id', commentId);
  if (error) { alert('댓글 삭제 실패: ' + error.message); return; }
  const { data: post } = await sb.from('posts').select('comment_count').eq('id', currentPostId).single();
  await sb.from('posts').update({ comment_count: Math.max((post?.comment_count || 1) - 1, 0) }).eq('id', currentPostId);
  await loadComments();
}

// ===== 글 작성 =====
function showWritePost() {
  renderWriteFlairs();
  document.getElementById('write-post-form').classList.remove('hidden');
}

function hideWritePost() {
  document.getElementById('write-post-form').classList.add('hidden');
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('post-flair').value = '';
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const flair = document.getElementById('post-flair').value;
  if (!title || !content) return showAlert('comm-alert', '제목과 내용을 입력해주세요.', 'error');
  if (!currentUser) return showAlert('comm-alert', '로그인이 필요해요.', 'error');

  const { error } = await sb.from('posts').insert({
    author_id: currentUser.id,
    brand_id: currentProfile?.brand_id || null,
    nickname: getDisplayName(currentBoard),
    title, content,
    board: currentBoard,
    flair: flair || null,
    is_anonymous: true
  });
  if (error) { showAlert('comm-alert', '글 등록 실패: ' + error.message, 'error'); return; }
  hideWritePost();
  loadCommunity();
}

// ===== 글 수정/삭제 =====
function startEditPost() {
  document.getElementById('edit-title-input').value = document.getElementById('detail-title').textContent;
  document.getElementById('edit-content-input').value = document.getElementById('detail-content').textContent;
  document.getElementById('post-view-card').classList.add('hidden');
  document.getElementById('post-edit-card').classList.remove('hidden');
}
function cancelEditPost() {
  document.getElementById('post-view-card').classList.remove('hidden');
  document.getElementById('post-edit-card').classList.add('hidden');
}
async function saveEditPost() {
  const title = document.getElementById('edit-title-input').value.trim();
  const content = document.getElementById('edit-content-input').value.trim();
  if (!title || !content) { showAlert('post-edit-alert', '제목과 내용을 입력해주세요.', 'error'); return; }
  const { error } = await sb.from('posts').update({ title, content }).eq('id', currentPostId);
  if (error) { showAlert('post-edit-alert', '수정 실패: ' + error.message, 'error'); return; }
  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-content').textContent = content;
  cancelEditPost();
}
async function deletePost() {
  if (!currentPostId) return;
  if (!confirm('게시글을 삭제할까요?')) return;
  const { error } = await sb.from('posts').delete().eq('id', currentPostId);
  if (error) { alert('삭제 실패: ' + error.message); return; }
  currentPostId = null;
  showPage('community');
}

// ===== 좋아요 =====
function setLikeBtn(liked) {
  const btn = document.getElementById('detail-like-btn');
  if (!btn) return;
  btn.style.borderColor = liked ? 'var(--orange)' : 'var(--border)';
  btn.style.color = liked ? 'var(--orange)' : 'var(--navy)';
  btn.style.background = liked ? 'rgba(232,121,12,0.08)' : '#fff';
}
async function loadLikeStatus(postId) {
  if (!currentUser || !postId) return;
  const { data } = await sb.from('post_likes').select('post_id')
    .eq('post_id', postId).eq('user_id', currentUser.id).maybeSingle();
  setLikeBtn(!!data);
}
async function toggleLike() {
  if (!currentPostId || !currentUser || likeInProgress) return;
  likeInProgress = true;
  try {
    const { data: existing } = await sb.from('post_likes').select('post_id')
      .eq('post_id', currentPostId).eq('user_id', currentUser.id).maybeSingle();
    const countEl = document.getElementById('detail-likes');
    const current = parseInt(countEl.textContent) || 0;
    if (existing) {
      await sb.from('post_likes').delete().eq('post_id', currentPostId).eq('user_id', currentUser.id);
      const newCount = Math.max(current - 1, 0);
      await sb.from('posts').update({ like_count: newCount }).eq('id', currentPostId);
      countEl.textContent = newCount;
      setLikeBtn(false);
    } else {
      await sb.from('post_likes').insert({ post_id: currentPostId, user_id: currentUser.id });
      const newCount = current + 1;
      await sb.from('posts').update({ like_count: newCount }).eq('id', currentPostId);
      countEl.textContent = newCount;
      setLikeBtn(true);
    }
  } finally {
    likeInProgress = false;
  }
}
