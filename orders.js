const { supabaseAdmin, getUserFromRequest, jsonError } = require('../_lib');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonError(res, 401, 'Please sign in.');
    const db = supabaseAdmin();
    const { data, error } = await db.from('orders').select('id,items,subtotal,currency,status,payment_status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    if (error) return jsonError(res, 500, 'Could not load orders.');
    return res.status(200).json({ orders: data || [] });
  } catch (e) { console.error(e.message); return jsonError(res, 500, 'Could not load orders.'); }
};
