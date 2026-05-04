require('dotenv').config();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const URL = process.env.SUPABASE_URL;
const h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

(async () => {
  // per_page=1 로 page 4, 5, 10 를 각각 조회 — 각 페이지가 정상 응답하는지 확인
  for (const page of [4, 5, 10, 100]) {
    const r = await fetch(`${URL}/auth/v1/admin/users?page=${page}&per_page=1`, { headers: h });
    const j = await r.json();
    const email = j.users?.[0]?.email ?? '(없음)';
    console.log(`page=${String(page).padStart(3)}, per_page=1 → status=${r.status}  email=${email}`);
  }
})();
