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

// ── 유틸: 업종 이모지 매핑 (DB에 있는 8개 업종만) ───────────
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

// ── 업종별 평균 계산 ──────────────────────────────────────────
function computeCatStats(brands) {
  const stats = {};
  brands.forEach(b => {
    if (!stats[b.category]) {
      stats[b.category] = { count: 0, totalNet: 0, totalRoyalty: 0 };
    }
    stats[b.category].count++;
    stats[b.category].totalNet     += b.avg_net_profit_rate || 0;
    stats[b.category].totalRoyalty += b.avg_royalty_rate    || 0;
  });
  Object.keys(stats).forEach(cat => {
    const s = stats[cat];
    s.avg_net     = Math.round((s.totalNet     / s.count) * 10) / 10;
    s.avg_royalty = Math.round((s.totalRoyalty / s.count) * 10) / 10;
  });
  return stats;
}

// ── 관련 브랜드 HTML 생성 ─────────────────────────────────────
function renderRelatedBrands(current, allBrands) {
  const related = allBrands
    .filter(b => b.category === current.category && b.id !== current.id)
    .sort((a, b) => b.avg_net_profit_rate - a.avg_net_profit_rate)
    .slice(0, 6);

  if (related.length === 0) return '';
  return related.map(b => `
    <a class="related-item" href="/brands/${toSlug(b.name)}">
      <div class="ri-name">${b.name}</div>
      <div class="ri-rate">${b.avg_net_profit_rate}%</div>
      <div class="ri-label">평균 수익률</div>
    </a>`).join('');
}

// ── 인사이트 4개 생성 ─────────────────────────────────────────
function buildInsights(brand, catAvg) {
  const net     = brand.avg_net_profit_rate;
  const labor   = brand.avg_labor_rate;
  const rent    = brand.avg_rent_rate;
  const royalty = brand.avg_royalty_rate;
  const cat     = brand.category;
  const diff    = net - catAvg.avg_net;
  const rdiff   = royalty - catAvg.avg_royalty;

  // 인사이트 1: 수익률 포지션
  let i1t, i1d;
  if (diff >= 3) {
    i1t = '업종 평균 대비 높은 수익률';
    i1d = `${cat} 업종 평균(${catAvg.avg_net}%) 대비 수익률이 높은 편입니다. 운영 방식과 입지에 따라 결과가 달라질 수 있습니다.`;
  } else if (diff <= -3) {
    i1t = '업종 평균 대비 낮은 수익률';
    i1d = `${cat} 업종 평균(${catAvg.avg_net}%) 대비 수익률이 낮은 편입니다. 비용 구조 최적화 여지가 있을 수 있습니다.`;
  } else {
    i1t = '업종 평균 수준의 수익률';
    i1d = `${cat} 업종 평균(${catAvg.avg_net}%)과 비슷한 수준의 수익률입니다. 수익률은 입지와 운영 방식에 따라 달라질 수 있습니다.`;
  }

  // 인사이트 2: 인건비
  let i2t, i2d;
  if (labor > 25) {
    i2t = `인건비 ${labor}% — 업종 평균보다 높은 편`;
    i2d = '인건비 비중이 높은 편으로, 인력 운영 효율이 수익에 큰 영향을 미칠 수 있습니다. 1인·가족 운영 시 이 비용을 일부 절감할 여지가 있습니다.';
  } else if (labor < 15) {
    i2t = `인건비 ${labor}% — 업종 평균보다 낮은 편`;
    i2d = '인건비 비중이 상대적으로 낮습니다. 운영 인력 구조를 확인하시고, 매장별 상황에 따라 다를 수 있음을 고려하세요.';
  } else {
    i2t = `인건비 ${labor}% — 일반적 수준`;
    i2d = '인건비 비중이 업종 내 일반적인 수준입니다. 1인·가족 운영 시 추가 절감 여지가 있을 수 있습니다.';
  }

  // 인사이트 3: 임대료
  let i3t, i3d;
  if (rent > 15) {
    i3t = `임대료 ${rent}% — 입지 민감도 높음`;
    i3d = '임대료 비중이 15%를 초과하는 경우 수익률이 크게 영향받을 수 있습니다. 상권 선택과 임대료 협상이 수익에 직접적인 영향을 미칩니다.';
  } else if (rent < 8) {
    i3t = `임대료 ${rent}% — 비교적 낮음`;
    i3d = '임대료 비중이 낮은 편입니다. 다만 매장 면적과 입지에 따라 편차가 있을 수 있습니다.';
  } else {
    i3t = `임대료 ${rent}% — 일반적 수준`;
    i3d = '임대료 비중이 업종 내 일반적 수준입니다. 2차 상권 검토 시 비용 절감 여지가 있을 수 있습니다.';
  }

  // 인사이트 4: 로열티
  let i4t, i4d;
  if (rdiff >= 1) {
    i4t = `로열티 ${royalty}% — 업종 평균 대비 높은 편`;
    i4d = `${cat} 업종 평균 로열티(${catAvg.avg_royalty}%) 대비 로열티 비중이 높은 편입니다. 계약 조건을 정보공개서에서 확인하시기 바랍니다.`;
  } else if (rdiff <= -1) {
    i4t = `로열티 ${royalty}% — 업종 평균 대비 낮은 편`;
    i4d = `${cat} 업종 평균 로열티(${catAvg.avg_royalty}%) 대비 로열티 부담이 낮은 편입니다.`;
  } else {
    i4t = `로열티 ${royalty}% — 업종 평균 수준`;
    i4d = '로열티가 업종 평균 수준입니다. 정확한 조건은 공정거래위원회 정보공개서를 통해 확인하세요.';
  }

  return { i1t, i1d, i2t, i2d, i3t, i3d, i4t, i4d };
}

// ── 비교 배지/텍스트 생성 ─────────────────────────────────────
function compareBadge(diff) {
  if (diff >= 3 || diff >= 1 && arguments[1] === 'royalty') return { badge: 'up',   text: '업종 평균보다 낮은 편' };
  if (diff <= -3 || diff <= -1 && arguments[1] === 'royalty') return { badge: 'down', text: '업종 평균보다 높은 편' };
  return { badge: 'same', text: '업종 평균과 비슷' };
}

function profitBadge(diff) {
  if (diff >= 3)  return { badge: 'up',   text: '업종 평균보다 높은 편' };
  if (diff <= -3) return { badge: 'down', text: '업종 평균보다 낮은 편' };
  return { badge: 'same', text: '업종 평균과 비슷' };
}

function royaltyBadge(rdiff) {
  if (rdiff <= -1) return { badge: 'up',   text: '업종 평균 대비 낮은 편' };
  if (rdiff >= 1)  return { badge: 'down', text: '업종 평균 대비 높은 편' };
  return { badge: 'same', text: '업종 평균 수준' };
}

// ── 템플릿 치환 ───────────────────────────────────────────────
function renderPage(template, replacements) {
  let html = template;
  // 긴 변수명부터 치환 (짧은 이름이 긴 이름 일부인 경우 방지)
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
  return brands.length + 1; // 메인 + 브랜드
}

// ── robots.txt 생성 ───────────────────────────────────────────
function writeRobots() {
  const siteUrl = process.env.SITE_URL || 'https://undercov.kr';
  const content = `User-agent: *\nDisallow: /community/\nDisallow: /admin/\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
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
    .select('*')
    .eq('seo_enabled', true)
    .order('category')
    .order('name');

  if (brandsErr) {
    console.error('❌ 브랜드 조회 실패:', brandsErr.message);
    process.exit(1);
  }
  log(`브랜드 로드: ${brands.length}개`);

  // 4. 업종별 평균 계산
  const catStats = computeCatStats(brands);
  log(`업종 평균 계산: ${Object.keys(catStats).length}개 업종`);

  // 5. 출력 디렉토리 준비 (기존 HTML 삭제 후 재생성)
  if (!fs.existsSync('brands')) {
    fs.mkdirSync('brands', { recursive: true });
  } else {
    const existing = fs.readdirSync('brands').filter(f => f.endsWith('.html'));
    existing.forEach(f => fs.unlinkSync(path.join('brands', f)));
    if (existing.length > 0) log(`기존 brands/*.html ${existing.length}개 삭제`);
  }

  // 6. 템플릿 로드
  const templatePath = 'templates/brand-template.html';
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 템플릿 파일 없음: ${templatePath}`);
    process.exit(1);
  }
  const template = fs.readFileSync(templatePath, 'utf-8');
  log(`템플릿 로드: ${templatePath}`);
  log('생성 시작...');

  // 7. 브랜드별 HTML 생성
  const buildDate = today();
  let success = 0;
  const failures = [];

  for (const brand of brands) {
    try {
      const catAvg  = catStats[brand.category] || { avg_net: 0, avg_royalty: 0, count: 0 };
      const slug    = toSlug(brand.name);
      const netDiff = brand.avg_net_profit_rate - catAvg.avg_net;
      const rDiff   = brand.avg_royalty_rate    - catAvg.avg_royalty;
      const pb      = profitBadge(netDiff);
      const rb      = royaltyBadge(rDiff);
      const ins     = buildInsights(brand, catAvg);
      const related = renderRelatedBrands(brand, brands);
      const utilOther = Math.round(((brand.avg_utility_rate || 0) + (brand.avg_other_rate || 0)) * 10) / 10;

      const replacements = {
        'BRAND_NAME':            brand.name,
        'BRAND_SLUG':            slug,
        'CATEGORY_EMOJI':        getEmoji(brand.category),
        'CATEGORY':              brand.category,
        'CAT_AVG_ROYALTY':       catAvg.avg_royalty,
        'CAT_AVG_NET':           catAvg.avg_net,
        'CAT_COUNT':             catAvg.count,
        'NET_PROFIT':            brand.avg_net_profit_rate,
        'LABOR_RATE':            brand.avg_labor_rate,
        'MATERIAL_RATE':         brand.avg_material_rate,
        'RENT_RATE':             brand.avg_rent_rate,
        'DELIVERY_RATE':         brand.avg_delivery_rate,
        'ROYALTY_RATE':          brand.avg_royalty_rate,
        'UTILITY_OTHER_RATE':    utilOther,
        'PROFIT_COMPARE_BADGE':  pb.badge,
        'PROFIT_COMPARE_TEXT':   pb.text,
        'ROYALTY_COMPARE_BADGE': rb.badge,
        'ROYALTY_COMPARE_TEXT':  rb.text,
        'INSIGHT_1_TITLE':       ins.i1t,
        'INSIGHT_1_DESC':        ins.i1d,
        'INSIGHT_2_TITLE':       ins.i2t,
        'INSIGHT_2_DESC':        ins.i2d,
        'INSIGHT_3_TITLE':       ins.i3t,
        'INSIGHT_3_DESC':        ins.i3d,
        'INSIGHT_4_TITLE':       ins.i4t,
        'INSIGHT_4_DESC':        ins.i4d,
        'RELATED_BRANDS':        related,
        'BUILD_DATE':            buildDate,
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

  // 8. sitemap.xml 생성
  const urlCount = writeSitemap(brands, buildDate);
  log(`sitemap.xml 생성: ${urlCount}개 URL`);

  // 9. robots.txt 생성
  writeRobots();
  log('robots.txt 생성');

  // 10. 최종 보고
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
