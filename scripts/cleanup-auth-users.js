require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL  = 'zzabhm@gmail.com';
const DRY_RUN      = process.argv.includes('--dry-run');
const SLEEP_MS     = 300;  // 100명마다 sleep (rate limit 대비)
// per_page: 1000→500오류, 100→500오류. 50으로 제한.
const FETCH_PER_PAGE = 50;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

const authHeaders = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
};

// SDK listUsers가 per_page 제한으로 500 발생 → raw fetch로 대체
async function fetchAllUsers() {
  const allUsers = [];
  let page = 1;

  while (true) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${FETCH_PER_PAGE}`;
    const res = await fetch(url, { headers: authHeaders });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`page ${page} 조회 실패 (${res.status}): ${body}`);
    }

    const json = await res.json();
    const users = json.users ?? [];
    allUsers.push(...users);

    if (users.length < FETCH_PER_PAGE) break;  // 마지막 페이지
    page++;
  }

  return allUsers;
}

async function main() {
  console.log(`🔍 auth.users 조회 중... (per_page=${FETCH_PER_PAGE})`);
  console.log(`   모드: ${DRY_RUN ? 'DRY-RUN (실제 삭제 없음)' : '⚠️  실제 삭제 모드'}\n`);

  const allUsers = await fetchAllUsers();
  const total    = allUsers.length;
  const adminUser = allUsers.find(u => u.email === ADMIN_EMAIL);
  const targets   = allUsers.filter(u => u.email !== ADMIN_EMAIL);

  console.log('[조회 결과]');
  console.log(`  auth.users 전체 : ${total}명`);
  console.log(`  admin 보존      : ${adminUser
    ? `있음 (id: ${adminUser.id})`
    : '⚠️  없음 — 이메일 재확인 필요!'}`);
  console.log(`  삭제 대상       : ${targets.length}명`);

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN: 삭제 대상 목록 (최대 30개 표시)]`);
    console.log(`  ${'email'.padEnd(35)} id`);
    console.log(`  ${'─'.repeat(72)}`);
    targets.slice(0, 30).forEach(u => {
      const email = (u.email ?? '(no email)').padEnd(35);
      console.log(`  ${email} ${u.id}`);
    });
    if (targets.length > 30) {
      console.log(`  ... 외 ${targets.length - 30}명 생략`);
    }
    console.log(`\n── DRY-RUN 완료. 실제 삭제하려면 "auth 삭제 진행" 이라고 하세요. ──`);
    return;
  }

  // ── 실제 삭제 ─────────────────────────────────────────────────
  console.log(`\n🗑️  삭제 시작...\n`);
  let deleted = 0;
  const failed = [];

  for (let i = 0; i < targets.length; i++) {
    const user = targets[i];

    // 삭제: SDK deleteUser (단건 삭제는 안정적으로 동작 확인됨)
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      failed.push({ id: user.id, email: user.email, error: error.message });
    } else {
      deleted++;
    }
    process.stdout.write(
      `\r  ⏳ ${deleted + failed.length}/${targets.length}  (성공: ${deleted} / 실패: ${failed.length})`
    );

    if ((i + 1) % 100 === 0) await sleep(SLEEP_MS);
  }

  console.log(`\n\n── 삭제 결과 ──────────────────────────────────`);
  console.log(`  ✅ 성공: ${deleted}명`);
  if (failed.length > 0) {
    console.log(`  ❌ 실패: ${failed.length}명`);
    failed.forEach(f => console.log(`     ${f.email ?? '(no email)'} (${f.id}): ${f.error}`));
  }

  // 최종 검증
  console.log(`\n[최종 auth.users 잔여 확인]`);
  try {
    const remaining = await fetchAllUsers();
    console.log(`  남은 수: ${remaining.length}명  (목표: 1)`);
    remaining.forEach(u => console.log(`  → ${u.email ?? '(no email)'} (${u.id})`));
  } catch (e) {
    console.log(`  (잔여 확인 실패: ${e.message})`);
  }
}

main().catch(err => { console.error('오류:', err.message); process.exit(1); });
