function num(id) { return parseFloat(document.getElementById(id).value) || 0; }
function numFmt(n) { return Math.round(n || 0).toLocaleString('ko-KR'); }
function pctFmt(n) { return (n || 0).toFixed(1) + '%'; }

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  if (type !== 'info') setTimeout(() => el.innerHTML = '', 4000);
}

function authorLabel(nickname, region) {
  if (nickname && region) return `${nickname}_${region}`;
  if (nickname) return nickname;
  if (region) return `${region} 익명 점주`;
  return '익명 점주';
}
