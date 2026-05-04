require('dotenv').config();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const URL = process.env.SUPABASE_URL;
const h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN_ID = '67fd2bab-82f2-45de-8a6b-029bd21d78ae';

(async () => {
  // 1. admin 직접 조회
  const r1 = await fetch(`${URL}/auth/v1/admin/users/${ADMIN_ID}`, { headers: h });
  const j1 = await r1.json();
  console.log('[admin 직접 조회]');
  console.log(`  status: ${r1.status}  email: ${j1.email ?? '(없음)'}  id: ${j1.id?.slice(0,8)}`);

  // 2. 삭제된 유저들 재확인 (404 이어야 함)
  const deletedIds = [
    'b1647ea9-794c-45bf-b9c8-d8d1fff8c9a9', // 2@3.com
    'b2f1eeba-f3d7-4464-8060-99755d2bd9d1', // hjzos
    '3cfbcaa4-5716-48ce-822e-7a2bda2aee33', // zzabhm69
    '9b3baba9-b100-4d5f-ad6e-48587042866a', // zzabh1213m
  ];
  console.log('\n[삭제 확인 — 모두 404이어야 함]');
  for (const id of deletedIds) {
    const r = await fetch(`${URL}/auth/v1/admin/users/${id}`, { headers: h });
    console.log(`  ${id.slice(0,8)} → ${r.status} ${r.status === 404 ? '✅ 삭제됨' : '⚠️ 아직 존재'}`);
  }

  // 3. profiles 현재 상태
  const { count: pc } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  console.log(`\n[profiles 최종 row 수] ${pc}  (목표: 1)`);
})();
