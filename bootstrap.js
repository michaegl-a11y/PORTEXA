const { supabaseAdmin, getUserFromRequest, jsonError } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const expected = process.env.ADMIN_SETUP_TOKEN;
  const provided = req.headers['x-admin-setup-token'];
  if (!expected || !provided || provided !== expected) return jsonError(res, 403, 'Admin setup token is missing or invalid.');
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonError(res, 401, 'Sign in to the account you want to make admin first.');
    const db = supabaseAdmin();
    const { error } = await db.from('profiles').upsert({ id: user.id, full_name: user.user_metadata?.full_name || '', role: 'admin' }, { onConflict: 'id' });
    if (error) return jsonError(res, 500, 'Could not assign admin role.');
    return res.status(200).json({ success: true, message: 'Admin role assigned. Remove ADMIN_SETUP_TOKEN from Vercel now.' });
  } catch (e) {
    console.error('Admin bootstrap error:', e.message);
    return jsonError(res, 500, 'Admin setup failed.');
  }
};
