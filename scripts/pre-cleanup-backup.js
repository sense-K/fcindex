require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function count(table) {
  const { count: c } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return c ?? 0;
}

async function main() {
  console.log('📦 백업 스냅샷 생성 중...\n');

  const [profiles, posts, comments, likes, storeData, brands] = await Promise.all([
    count('profiles'),
    count('posts'),
    count('post_comments'),
    count('post_likes'),
    count('store_data'),
    count('brands'),
  ]);

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'zzabhm@gmail.com')
    .single();

  const { data: adminStoreData } = await supabase
    .from('store_data')
    .select('*')
    .eq('owner_id', adminProfile.id);

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(__dirname, '..', 'backups', `pre-cleanup-${ts}.sql`);

  const lines = [
    `-- ============================================================`,
    `-- 삭제 전 스냅샷 백업`,
    `-- 생성 시각: ${new Date().toISOString()}`,
    `-- SUPABASE: ${process.env.SUPABASE_URL}`,
    `-- ============================================================`,
    ``,
    `-- [row 수 스냅샷]`,
    `-- profiles       : ${profiles}`,
    `-- posts          : ${posts}`,
    `-- post_comments  : ${comments}`,
    `-- post_likes     : ${likes}`,
    `-- store_data     : ${storeData}`,
    `-- brands         : ${brands}`,
    ``,
    `-- [보존 대상: admin profile]`,
    `-- 아래 INSERT는 복구가 필요할 때 참고용`,
    `INSERT INTO public.profiles (${Object.keys(adminProfile).join(', ')})`,
    `VALUES (${Object.values(adminProfile).map(v =>
      v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
    ).join(', ')})`,
    `ON CONFLICT (id) DO NOTHING;`,
    ``,
    `-- [보존 대상: admin store_data]`,
  ];

  for (const row of adminStoreData ?? []) {
    lines.push(`INSERT INTO public.store_data (${Object.keys(row).join(', ')})`);
    lines.push(`VALUES (${Object.values(row).map(v =>
      v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
    ).join(', ')})`);
    lines.push(`ON CONFLICT (id) DO NOTHING;`);
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

  console.log(`✅ 백업 파일 생성 완료`);
  console.log(`   경로: ${outPath}`);
  console.log(`\n[스냅샷 요약]`);
  console.log(`  profiles     : ${profiles}`);
  console.log(`  posts        : ${posts}`);
  console.log(`  post_comments: ${comments}`);
  console.log(`  post_likes   : ${likes}`);
  console.log(`  store_data   : ${storeData}`);
  console.log(`  brands       : ${brands}`);
}

main().catch(err => { console.error('오류:', err.message); process.exit(1); });
