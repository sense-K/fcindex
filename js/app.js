// ===== 페이지 이동 이벤트 위임 =====
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (btn) showPage(btn.dataset.page);
});

init();
