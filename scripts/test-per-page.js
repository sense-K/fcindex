require('dotenv').config();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const URL = process.env.SUPABASE_URL;
const h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

async function test(n) {
  const r = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=${n}`, { headers: h });
  const j = await r.json();
  const users = j.users?.length ?? 'N/A';
  const info  = j.total ?? j.msg ?? '';
  console.log(`per_page=${String(n).padStart(4)} → status=${r.status}  users=${users}  ${info}`);
}

(async () => {
  for (const n of [1, 2, 3, 5, 10, 20]) await test(n);
})();
