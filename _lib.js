const { createClient } = require('@supabase/supabase-js');

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server environment variables are not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function supabasePublic() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase public environment variables are not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const client = supabasePublic();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
async function isAdmin(userId) {
  if (!userId) return false;
  const db = supabaseAdmin();
  const { data, error } = await db.from('profiles').select('role').eq('id', userId).maybeSingle();
  return !error && data && data.role === 'admin';
}
const CATALOG = {
  'white-pad': { name: 'White Day Pad', detail: '245 mm · 10 pieces per pack', price: 2500 },
  'black-pad': { name: 'Black Night Pad', detail: '290 mm · 8 pieces per pack', price: 2500 },
  'purple-pad': { name: 'Purple Heavy-Flow Pad', detail: '360 mm · 6 pieces per pack', price: 3500 },
  'blue-liner': { name: 'Blue Panty Liner', detail: '160 mm · 30 pieces per pack', price: 3500 },
  'memory-foam': { name: 'Memory Foam', detail: 'Confirm size, type, and specification', price: null },
  'spc-floor': { name: 'SPC Vinyl Flooring', detail: 'Confirm area, finish, and specification', price: null },
  'air-fryer': { name: 'Air Fryer', detail: 'Confirm capacity, brand, and features', price: null },
  'washing-machine': { name: 'Washing Machine', detail: 'Confirm capacity, loading style, and brand', price: null }
};
function jsonError(res, status, message) { return res.status(status).json({ error: message }); }
module.exports = { supabaseAdmin, supabasePublic, getUserFromRequest, isAdmin, CATALOG, jsonError };
