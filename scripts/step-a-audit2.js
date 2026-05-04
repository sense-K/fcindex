require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // 1. 실제(non-dummy) 프로필 3개 상세 확인
  const { data: realProfiles } = await supabase
    .from('profiles')
    .select('id, email, nickname, auth_status, is_dummy, brand_id, created_at')
    .eq('is_dummy', false);

  console.log('[실제 프로필 목록 (is_dummy=false)]');
  realProfiles?.forEach(p => {
    console.log(`  id: ${p.id}`);
    console.log(`  email: ${p.email}`);
    console.log(`  nickname: ${p.nickname}`);
    console.log(`  auth_status: ${p.auth_status}`);
    console.log(`  brand_id: ${p.brand_id}`);
    console.log(`  created_at: ${p.created_at}`);
    console.log();
  });

  // 2. auth.users - fetch 직접 호출로 시도
  console.log('[auth.users - REST API 직접 호출]');
  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      }
    }
  );
  const json = await res.json();
  if (json.users) {
    console.log(`  auth.users 총 수: ${json.users.length}`);
    const adminUser = json.users.find(u => u.email === 'zzabhm@gmail.com');
    console.log(`  admin user 존재: ${adminUser ? '있음' : '없음'}`);
    if (adminUser) {
      console.log(`  admin id: ${adminUser.id}`);
      console.log(`  admin email_confirmed: ${adminUser.email_confirmed_at ? '확인됨' : '미확인'}`);
    }
  } else {
    console.log('  응답:', JSON.stringify(json).slice(0, 200));
  }

  // 3. store_data 2개 내용 확인
  console.log('\n[store_data 2개 내용]');
  const { data: storeData } = await supabase
    .from('store_data')
    .select('id, owner_id, data_year, data_month, revenue');
  storeData?.forEach(d => {
    console.log(`  ${d.data_year}-${d.data_month}  revenue: ${d.revenue}  owner: ${d.owner_id}`);
  });
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
