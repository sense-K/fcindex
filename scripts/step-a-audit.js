require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function count(table, filter) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  if (error) return `오류: ${error.message}`;
  return c;
}

async function main() {
  console.log('── Step A: 데이터 현황 조사 ──────────────────\n');

  // 1. 각 테이블 row 수
  const [
    profilesTotal,
    profilesAdmin,
    postsTotal,
    commentsTotal,
    likesTotal,
    storeDataTotal,
    threadsTotal,
    messagesTotal,
  ] = await Promise.all([
    count('profiles'),
    count('profiles', q => q.eq('email', 'zzabhm@gmail.com')),
    count('posts'),
    count('post_comments'),
    count('post_likes'),
    count('store_data'),
    count('contact_threads'),
    count('contact_messages'),
  ]);

  console.log('[1] 테이블별 row 수');
  console.log(`  profiles            : ${profilesTotal}  (admin: ${profilesAdmin})`);
  console.log(`  posts               : ${postsTotal}`);
  console.log(`  post_comments       : ${commentsTotal}`);
  console.log(`  post_likes          : ${likesTotal}`);
  console.log(`  store_data          : ${storeDataTotal}`);
  console.log(`  contact_threads     : ${threadsTotal}`);
  console.log(`  contact_messages    : ${messagesTotal}`);

  // 2. auth.users 전체 수 (Admin API)
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({
    page: 1, perPage: 1
  });
  // total은 헤더에 있으므로 전체 카운트를 위해 따로 조회
  let authTotal = 'N/A';
  let adminAuthRow = 'N/A';
  if (!usersErr) {
    // 전체 가져오기 (최대 1000명)
    const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (allUsers?.users) {
      authTotal = allUsers.users.length;
      adminAuthRow = allUsers.users.filter(u => u.email === 'zzabhm@gmail.com').length;
    }
  } else {
    console.log('  auth.users 조회 오류:', usersErr.message);
  }
  console.log(`  auth.users          : ${authTotal}  (admin: ${adminAuthRow})`);

  // 3. is_dummy 분포 확인
  console.log('\n[2] is_dummy 분포');
  const [dummyPosts, realPosts, dummyProfiles, realProfiles] = await Promise.all([
    count('posts',    q => q.eq('is_dummy', true)),
    count('posts',    q => q.eq('is_dummy', false)),
    count('profiles', q => q.eq('is_dummy', true)),
    count('profiles', q => q.eq('is_dummy', false)),
  ]);
  console.log(`  posts    - dummy: ${dummyPosts} / real: ${realPosts}`);
  console.log(`  profiles - dummy: ${dummyProfiles} / real: ${realProfiles}`);

  // 4. admin 프로필 상세
  console.log('\n[3] 보존 대상 admin row 확인');
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, email, nickname, auth_status, is_dummy, created_at')
    .eq('email', 'zzabhm@gmail.com')
    .single();
  if (adminProfile) {
    console.log(`  id          : ${adminProfile.id}`);
    console.log(`  email       : ${adminProfile.email}`);
    console.log(`  nickname    : ${adminProfile.nickname}`);
    console.log(`  auth_status : ${adminProfile.auth_status}`);
    console.log(`  is_dummy    : ${adminProfile.is_dummy}`);
    console.log(`  created_at  : ${adminProfile.created_at}`);
  } else {
    console.log('  ⚠️  admin 프로필 없음');
  }

  // 5. store_data / contact 데이터가 admin 것인지 확인
  if (adminProfile) {
    const [adminStore, adminThread] = await Promise.all([
      count('store_data',      q => q.eq('owner_id', adminProfile.id)),
      count('contact_threads', q => q.eq('user_id',  adminProfile.id)),
    ]);
    console.log(`\n[4] admin 소유 데이터`);
    console.log(`  store_data rows     : ${adminStore}`);
    console.log(`  contact_threads     : ${adminThread}`);
  }

  console.log('\n── 조사 완료 ──');
}

main().catch(err => {
  console.error('오류:', err.message);
  process.exit(1);
});
