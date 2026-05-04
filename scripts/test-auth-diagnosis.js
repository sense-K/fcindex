require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const URL = process.env.SUPABASE_URL;
const h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };
const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN_PROFILE_ID = '67fd2bab-82f2-45de-8a6b-029bd21d78ae'; // zzabhm@gmail.com 의 profile ID

(async () => {
  // [A] admin을 auth에서 직접 UUID로 조회
  console.log('[A] GET /admin/users/{admin_profile_id}');
  const rA = await fetch(`${URL}/auth/v1/admin/users/${ADMIN_PROFILE_ID}`, { headers: h });
  console.log(`  status: ${rA.status}`);
  const jA = await rA.json();
  console.log(`  email: ${jA.email ?? jA.msg ?? JSON.stringify(jA)}`);

  // [B] 현재 보이는 3명 전부 삭제 (non-admin)
  console.log('\n[B] 보이는 3명 조회 후 비-admin 삭제');
  const rB = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=3`, { headers: h });
  const jB = await rB.json();
  for (const u of jB.users ?? []) {
    if (u.email === 'zzabhm@gmail.com') {
      console.log(`  SKIP admin: ${u.email}`);
      continue;
    }
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    console.log(`  DELETE ${u.email} (${u.id.slice(0,8)}) → ${error ? '❌ '+error.message : '✅ 성공'}`);
  }

  // [C] 삭제 후 x-total-count 재확인
  console.log('\n[C] 삭제 후 x-total-count 확인');
  const rC = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=1`, { headers: h });
  const jC = await rC.json();
  console.log(`  status: ${rC.status}`);
  console.log(`  x-total-count: ${rC.headers.get('x-total-count')}`);
  console.log(`  page1 user: ${jC.users?.[0]?.email ?? '(없음)'}`);

  // [D] page=2 with per_page=1 — 남은 유저 있는지 확인
  console.log('\n[D] page=2 per_page=1 확인');
  const rD = await fetch(`${URL}/auth/v1/admin/users?page=2&per_page=1`, { headers: h });
  const jD = await rD.json();
  console.log(`  status: ${rD.status}`);
  console.log(`  page2 user: ${jD.users?.[0]?.email ?? jD.msg ?? '(없음)'}`);
})();
