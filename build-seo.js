'use strict';

// ── 환경변수 로드 ─────────────────────────────────────────────
// 로컬: .env 파일에서 로드. Cloudflare Pages: 대시보드 환경변수에서 자동 주입.
// .env 파일이 없어도 에러 없이 넘어감 (override:false 가 기본값).
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── 유틸: 타임스탬프 로그 ─────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── 유틸: slug 생성 ───────────────────────────────────────────
function toSlug(name) {
  return name.trim()
    .replace(/\s+/g, '-')
    .replace(/[\/\\?#&=<>"']/g, '');
}

// ── 유틸: 업종 이모지 매핑 ────────────────────────────────────
const CATEGORY_EMOJI = {
  '커피':   '☕',
  '치킨':   '🍗',
  '버거':   '🍔',
  '피자':   '🍕',
  '한식':   '🍱',
  '디저트': '🍰',
  '편의점': '🏪',
  '기타':   '🏬',
};
function getEmoji(cat) {
  return CATEGORY_EMOJI[cat] || '🏬';
}

// ── 유틸: 오늘 날짜 YYYY-MM-DD ────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}

// ── 관련 브랜드 HTML 생성 (이름만, 수치 없음) ─────────────────
function renderRelatedBrands(current, allBrands) {
  const related = allBrands
    .filter(b => b.category === current.category && b.id !== current.id)
    .slice(0, 6);

  if (related.length === 0) return '';
  return related.map(b => `
    <a class="related-item" href="/brands/${toSlug(b.name)}">
      <div class="ri-emoji">${getEmoji(b.category)}</div>
      <div class="ri-name">${b.name}</div>
      <div class="ri-status">🔜 수집 중</div>
    </a>`).join('');
}

// ── 템플릿 치환 ───────────────────────────────────────────────
function renderPage(template, replacements) {
  let html = template;
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    html = html.replaceAll(`{{${key}}}`, replacements[key] ?? '');
  }
  return html;
}

// ── sitemap.xml 생성 ──────────────────────────────────────────
function writeSitemap(brands, buildDate) {
  const siteUrl = process.env.SITE_URL || 'https://undercov.kr';
  const urls = [
    `  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...brands.map(b => {
      const slug = toSlug(b.name);
      return `  <url>\n    <loc>${siteUrl}/brands/${slug}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
  ].join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync('sitemap.xml', xml, 'utf-8');
  return brands.length + 1;
}

// ── robots.txt 생성 ───────────────────────────────────────────
function writeRobots() {
  const siteUrl = process.env.SITE_URL || 'https://undercov.kr';
  const content = `User-agent: *\nDisallow: /community\nDisallow: /community/\nDisallow: /admin\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync('robots.txt', content, 'utf-8');
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  // 1. 환경변수 검증
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ 환경변수에 SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.');
    console.error('   로컬: 프로젝트 루트 .env 파일에 입력 (cp .env.example .env)');
    console.error('   Cloudflare Pages: 대시보드 Settings > Variables and Secrets 에 등록');
    process.exit(1);
  }

  // 2. Supabase 클라이언트 (service_role = RLS 우회)
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
  log('Supabase 연결 준비');

  // 3. 브랜드 데이터 조회 (seo_enabled=true 만)
  const { data: brands, error: brandsErr } = await sb
    .from('brands')
    .select('id, name, category, seo_enabled')
    .eq('seo_enabled', true)
    .order('category')
    .order('name');

  if (brandsErr) {
    console.error('❌ 브랜드 조회 실패:', brandsErr.message);
    process.exit(1);
  }
  log(`브랜드 로드: ${brands.length}개`);

  // 4. 출력 디렉토리 준비 (기존 HTML 삭제 후 재생성)
  if (!fs.existsSync('brands')) {
    fs.mkdirSync('brands', { recursive: true });
  } else {
    const existing = fs.readdirSync('brands').filter(f => f.endsWith('.html'));
    existing.forEach(f => fs.unlinkSync(path.join('brands', f)));
    if (existing.length > 0) log(`기존 brands/*.html ${existing.length}개 삭제`);
  }

  // 5. 템플릿 로드
  const templatePath = 'templates/brand-template.html';
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 템플릿 파일 없음: ${templatePath}`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');
  log(`템플릿 로드: ${templatePath}`);
  log('생성 시작...');

  // 6. 브랜드별 HTML 생성
  const buildDate = today();
  let success = 0;
  const failures = [];

  for (const brand of brands) {
    try {
      const slug    = toSlug(brand.name);
      const related = renderRelatedBrands(brand, brands);

      const replacements = {
        'BRAND_NAME':     brand.name,
        'BRAND_SLUG':     slug,
        'CATEGORY_EMOJI': getEmoji(brand.category),
        'CATEGORY':       brand.category,
        'RELATED_BRANDS': related,
        'BUILD_DATE':     buildDate,
      };

      const html = renderPage(template, replacements);
      fs.writeFileSync(path.join('brands', `${slug}.html`), html, 'utf-8');
      console.log(`  ✓ brands/${slug}.html`);
      success++;
    } catch (e) {
      failures.push({ name: brand.name, err: e.message });
      console.error(`  ✗ ${brand.name}: ${e.message}`);
    }
  }

  // 7. sitemap.xml 생성
  const urlCount = writeSitemap(brands, buildDate);
  log(`sitemap.xml 생성: ${urlCount}개 URL`);

  // 8. robots.txt 생성
  writeRobots();
  log('robots.txt 생성');

  // 9. 최종 보고
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('═══════════════════════════════════════');
  log(`완료: 성공 ${success} / 실패 ${failures.length}`);
  log(`소요 시간: ${elapsed}초`);

  if (failures.length > 0) {
    console.error('\n⚠️  실패 브랜드 목록:');
    failures.forEach(f => console.error(`   - ${f.name}: ${f.err}`));
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ 예기치 않은 오류:', e);
  process.exit(1);
});
