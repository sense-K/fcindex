require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('=== 테스트 1: SDK listUsers (perPage: 1) ===');
  const supabase = createClient(URL, KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  console.log('data :', JSON.stringify(data));
  console.log('error:', JSON.stringify(error));

  console.log('\n=== 테스트 2: raw fetch (status + body) ===');
  const res = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`
    }
  });
  console.log('status :', res.status);
  console.log('headers:', JSON.stringify(Object.fromEntries(res.headers)));
  const body = await res.text();
  console.log('body   :', body);

  console.log('\n=== 테스트 3: raw fetch — per_page=0 (카운트만) ===');
  const res2 = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=0`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  console.log('status:', res2.status, '/ body:', await res2.text());

  console.log('\n=== 테스트 4: 단건 deleteUser (profiles에 있던 더미 ID 사용) ===');
  // 이미 profiles에서 삭제된 더미 ID — auth.users에는 남아있을 수 있음
  const dummyId = 'b1647ea9-794c-45bf-b9c8-d8d1fff8c9a9'; // 2@3.com (is_dummy=false였던 테스트 계정)
  const { data: delData, error: delErr } = await supabase.auth.admin.deleteUser(dummyId);
  console.log('deleteUser data :', JSON.stringify(delData));
  console.log('deleteUser error:', JSON.stringify(delErr));

  console.log('\n=== 테스트 5: REST API로 단건 삭제 시도 ===');
  const res3 = await fetch(`${URL}/auth/v1/admin/users/${dummyId}`, {
    method: 'DELETE',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  console.log('status:', res3.status, '/ body:', await res3.text());
}

main().catch(err => { console.error('오류:', err.message); process.exit(1); });
