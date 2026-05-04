require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const ADMIN_PROFILE_ID = '67fd2bab-82f2-45de-8a6b-029bd21d78ae';
const BATCH_SIZE = 200;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function countTable(table) {
  const { count: c } = await supabase.from(table).select('*', { count: 'exact', head: true });
  return c ?? 0;
}

// ID 배치를 가져와서 삭제 (timeout 방지)
async function batchDeleteById(table, idCol = 'id', filter = null) {
  let totalDeleted = 0;
  while (true) {
    let q = supabase.from(table).select(idCol).limit(BATCH_SIZE);
    if (filter) q = filter(q);
    const { data: rows, error: fetchErr } = await q;
    if (fetchErr) throw new Error(`[${table}] ID 조회 실패: ${fetchErr.message}`);
    if (!rows || rows.length === 0) break;

    const ids = rows.map(r => r[idCol]);
    const { error: delErr } = await supabase.from(table).delete().in(idCol, ids);
    if (delErr) throw new Error(`[${table}] 배치 삭제 실패: ${delErr.message}`);

    totalDeleted += ids.length;
    process.stdout.write(`\r    삭제됨: ${totalDeleted}건`);
  }
  return totalDeleted;
}

async function main() {
  console.log('🗑️  더미 데이터 삭제 시작 (배치 방식)\n');
  const completed = [];

  try {
    // ── Step 1: post_comments 배치 삭제 ───────────────────────
    // (posts CASCADE로 처리되지 않은 orphan 댓글 포함 대비)
    const commentsCount = await countTable('post_comments');
    console.log(`  post_comments (${commentsCount}건) 배치 삭제 중...`);
    const deletedComments = await batchDeleteById('post_comments');
    const commentsAfter = await countTable('post_comments');
    console.log(`\n  ✅ 완료 (삭제: ${deletedComments}건 / 남은 수: ${commentsAfter})`);
    completed.push('post_comments');

    // ── Step 2: post_likes 삭제 ───────────────────────────────
    const likesCount = await countTable('post_likes');
    console.log(`  post_likes (${likesCount}건) 삭제 중...`);
    if (likesCount > 0) {
      await batchDeleteById('post_likes', 'post_id');
    }
    const likesAfter = await countTable('post_likes');
    console.log(`  ✅ 완료 (남은 수: ${likesAfter})`);
    completed.push('post_likes');

    // ── Step 3: posts 배치 삭제 ───────────────────────────────
    const postsCount = await countTable('posts');
    console.log(`  posts (${postsCount}건) 배치 삭제 중...`);
    const deletedPosts = await batchDeleteById('posts');
    const postsAfter = await countTable('posts');
    console.log(`\n  ✅ 완료 (삭제: ${deletedPosts}건 / 남은 수: ${postsAfter})`);
    completed.push('posts');

    // ── Step 4: contact_messages, contact_threads ──────────────
    const msgCount = await countTable('contact_messages');
    const threadCount = await countTable('contact_threads');
    console.log(`  contact_messages (${msgCount}건) + contact_threads (${threadCount}건) 삭제 중...`);
    if (msgCount > 0) await batchDeleteById('contact_messages');
    if (threadCount > 0) await batchDeleteById('contact_threads');
    console.log(`  ✅ 완료`);
    completed.push('contact_messages', 'contact_threads');

    // ── Step 5: profiles (admin 제외) ─────────────────────────
    const profilesCount = await countTable('profiles');
    console.log(`  profiles (${profilesCount}건 중 admin 제외 삭제 중)...`);
    const deletedProfiles = await batchDeleteById(
      'profiles',
      'id',
      q => q.neq('id', ADMIN_PROFILE_ID)
    );
    const profilesAfter = await countTable('profiles');
    console.log(`\n  ✅ 완료 (삭제: ${deletedProfiles}건 / 남은 수: ${profilesAfter})`);
    completed.push('profiles');

    // ── 최종 확인 ─────────────────────────────────────────────
    console.log('\n── 최종 상태 확인 ────────────────────────────');
    const [p, po, pc, pl, sd, br] = await Promise.all([
      countTable('profiles'),
      countTable('posts'),
      countTable('post_comments'),
      countTable('post_likes'),
      countTable('store_data'),
      countTable('brands'),
    ]);

    const ok = v => v === 0 ? '✅' : '⚠️';
    const okN = (v, n) => v === n ? '✅' : '⚠️';

    console.log(`  ${okN(p,1)} profiles      : ${p}  (목표: 1)`);
    console.log(`  ${ok(po)} posts          : ${po}  (목표: 0)`);
    console.log(`  ${ok(pc)} post_comments  : ${pc}  (목표: 0)`);
    console.log(`  ${ok(pl)} post_likes     : ${pl}  (목표: 0)`);
    console.log(`  ${okN(sd,2)} store_data   : ${sd}  (목표: 2)`);
    console.log(`  brands         : ${br}`);

    console.log('\n✅ SQL 정리 완료.');
    console.log('   다음: node scripts/cleanup-auth-users.js --dry-run\n');

  } catch (err) {
    console.error(`\n❌ 오류 발생: ${err.message}`);
    console.error(`   완료된 단계: ${completed.join(' → ')}`);
    process.exit(1);
  }
}

main().catch(err => { console.error('예상치 못한 오류:', err.message); process.exit(1); });
