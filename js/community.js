// ===== 커뮤니티 =====
async function loadCommunity() {
  const brandName = currentBrand?.name || '전체';
  document.getElementById('comm-brand-badge').textContent = brandName + ' 점주방';

  let query = sb.from('posts')
    .select('id, author_id, brand_id, title, content, like_count, comment_count, created_at, is_anonymous, region, nickname')
    .order('created_at', { ascending: false });
  if (currentProfile?.brand_id) {
    query = query.eq('brand_id', currentProfile.brand_id);
  }
  const { data, error } = await query;

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
    div.innerHTML = `
      <div class="post-top">
        <div class="post-avatar" style="background:${color};">익</div>
        <div><div class="post-user">${authorLabel(p.nickname, p.region)}</div><div class="post-brand">${currentBrand?.name || '전체'} · ${date}</div></div>
      </div>
      <div class="post-title">${p.title}</div>
      <div class="post-footer"><span class="post-stat">💬 ${p.comment_count || 0}</span><span class="post-stat">👍 ${p.like_count || 0}</span></div>`;
    div.onclick = () => showPostDetail(p, color);
    list.appendChild(div);
  });
}

function showPostDetail(p, color) {
  currentPostId = p.id;
  currentPostAuthorId = p.author_id;
  const date = new Date(p.created_at).toLocaleDateString('ko-KR');
  document.getElementById('detail-avatar').textContent = '익';
  document.getElementById('detail-avatar').style.background = color || 'var(--orange)';
  document.getElementById('detail-author').textContent = authorLabel(p.nickname, p.region);
  document.getElementById('detail-meta').textContent = (currentBrand?.name || '') + ' · ' + date;
  document.getElementById('detail-title').textContent = p.title;
  document.getElementById('detail-content').textContent = p.content;
  document.getElementById('detail-likes').textContent = p.like_count || 0;
  document.getElementById('detail-comments').textContent = p.comment_count || 0;
  setLikeBtn(false);

  // 삭제 버튼 — 본인 글만
  const actions = document.getElementById('post-author-actions');
  const isAuthor = currentUser && String(p.author_id) === String(currentUser.id);
  if (isAuthor) {
    actions.innerHTML = `<button class="nav-btn" onclick="deletePost()" style="font-size:12px;color:#FCA5A5;">삭제</button>`;
  } else {
    actions.innerHTML = '';
  }

  document.getElementById('post-view-card').classList.remove('hidden');
  document.getElementById('post-edit-card').classList.add('hidden');
  showPage('post-detail');
  loadComments();
  loadLikeStatus(p.id);
}

async function loadComments() {
  if (!currentPostId) return;
  const { data, error } = await sb.from('post_comments')
    .select('id, author_id, content, created_at, region, nickname')
    .eq('post_id', currentPostId)
    .order('created_at', { ascending: true });
  const list = document.getElementById('comment-list');
  if (error) {
    list.innerHTML = `<div style="padding:12px;font-size:12px;color:#DC2626;background:#FEF2F2;border-radius:8px;">⚠️ ${error.message}<br><span style="color:#6B7280;">supabase-rls.sql을 실행했는지 확인해주세요.</span></div>`;
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
        <span class="comment-author">${authorLabel(c.nickname, c.region)}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="comment-date">${date}</span>
          ${isMine ? `<button class="comment-delete-btn" onclick="deleteComment('${c.id}')">삭제</button>` : ''}
        </div>
      </div>
      <div class="comment-text">${c.content}</div>`;
    list.appendChild(div);
  });
}

async function submitComment() {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;
  if (!currentUser || !currentPostId) return;
  const { error } = await sb.from('post_comments').insert({
    post_id: currentPostId,
    author_id: currentUser.id,
    content,
    region: currentProfile?.region || null,
    nickname: currentProfile?.nickname || null
  });
  if (error) { alert('댓글 등록 실패: ' + error.message); return; }
  input.value = '';
  const { data: post } = await sb.from('posts').select('comment_count').eq('id', currentPostId).single();
  const newCount = (post?.comment_count || 0) + 1;
  await sb.from('posts').update({ comment_count: newCount }).eq('id', currentPostId);
  document.getElementById('detail-comments').textContent = newCount;
  loadComments();
}

async function deleteComment(commentId) {
  if (!confirm('댓글을 삭제할까요?')) return;
  await sb.from('post_comments').delete().eq('id', commentId);
  const { data: post } = await sb.from('posts').select('comment_count').eq('id', currentPostId).single();
  const newCount = Math.max((post?.comment_count || 1) - 1, 0);
  await sb.from('posts').update({ comment_count: newCount }).eq('id', currentPostId);
  document.getElementById('detail-comments').textContent = newCount;
  loadComments();
}

function startEditPost() {
  const title = document.getElementById('detail-title').textContent;
  const content = document.getElementById('detail-content').textContent;
  document.getElementById('edit-title-input').value = title;
  document.getElementById('edit-content-input').value = content;
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
  if (!title || !content) { alert('제목과 내용을 입력해주세요.'); return; }
  const { error } = await sb.from('posts').update({ title, content }).eq('id', currentPostId);
  if (error) { alert('수정 실패: ' + error.message); return; }
  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-content').textContent = content;
  cancelEditPost();
}

async function deletePost() {
  if (!currentPostId) { alert('게시글 ID를 찾을 수 없어요.'); return; }
  if (!confirm('게시글을 삭제할까요? 삭제 후 복구할 수 없어요.')) return;
  const { error } = await sb.from('posts').delete().eq('id', currentPostId);
  if (error) { alert('삭제 실패: ' + error.message); return; }
  currentPostId = null;
  showPage('community');
  loadCommunity();
}

function setLikeBtn(liked) {
  const btn = document.getElementById('detail-like-btn');
  if (!btn) return;
  if (liked) {
    btn.style.borderColor = 'var(--orange)';
    btn.style.color = 'var(--orange)';
    btn.style.background = 'rgba(232,121,12,0.08)';
  } else {
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--navy)';
    btn.style.background = '#fff';
  }
}

async function loadLikeStatus(postId) {
  if (!currentUser || !postId) return;
  const { data } = await sb.from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', currentUser.id)
    .maybeSingle();
  setLikeBtn(!!data);
}

async function toggleLike() {
  if (!currentPostId || !currentUser) return;
  const { data: existing } = await sb.from('post_likes')
    .select('post_id')
    .eq('post_id', currentPostId)
    .eq('user_id', currentUser.id)
    .maybeSingle();

  const countEl = document.getElementById('detail-likes');
  const current = parseInt(countEl.textContent) || 0;

  if (existing) {
    await sb.from('post_likes').delete()
      .eq('post_id', currentPostId).eq('user_id', currentUser.id);
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
}

function showWritePost() { document.getElementById('write-post-form').classList.remove('hidden'); }

function hideWritePost() {
  document.getElementById('write-post-form').classList.add('hidden');
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
}

async function submitPost() {
  const title = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  if (!title || !content) return alert('제목과 내용을 입력해주세요.');
  if (!currentUser) return alert('로그인이 필요해요.');

  const { data, error } = await sb.from('posts').insert({
    author_id: currentUser.id,
    brand_id: currentProfile?.brand_id || null,
    region: currentProfile?.region || null,
    nickname: currentProfile?.nickname || null,
    title, content, is_anonymous: true
  }).select();

  if (error) { alert('글 등록 실패: ' + error.message); return; }
  hideWritePost();
  loadCommunity();
}
