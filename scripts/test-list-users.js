require('dotenv').config();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const URL = process.env.SUPABASE_URL;
const h = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

(async () => {
  const r = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=3`, { headers: h });
  const j = await r.json();
  console.log('status:', r.status);
  console.log('x-total-count:', r.headers.get('x-total-count'));
  (j.users ?? []).forEach(u => {
    console.log(`  email=${u.email}  id=${u.id}  created=${u.created_at?.slice(0,10)}`);
  });
})();
