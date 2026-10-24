const {
  supabaseAdmin,
  getUserFromRequest,
  isAdmin,
  jsonError
} = require('../_lib');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getUserFromRequest(req);
    if (!user || !(await isAdmin(user.id))) {
      return jsonError(res, 403, 'Admin access required.');
    }
    const db = supabaseAdmin();
    const [orders, conversations] = await Promise.all([
      db
        .from('orders')
        .select(
          'id,customer_name,customer_email,customer_phone,delivery_address,items,subtotal,currency,status,created_at'
        )
        .order('created_at', { ascending: false })
        .limit(100),
      db
        .from('chat_conversations')
        .select(
          'id,name,email,visitor_token,status,created_at,updated_at'
        )
        .order('updated_at', { ascending: false })
        .limit(100)
    ]);
    if (orders.error || conversations.error) {
      console.error('Admin data query errors:', {
        orders: orders.error?.message,
        conversations: conversations.error?.message
      });
      return jsonError(res, 500, 'Could not load admin data.');
    }
    return res.status(200).json({
      orders: orders.data || [],
      conversations: conversations.data || []
    });
  } catch (error) {
    console.error('Admin data error:', error);
    return jsonError(res, 500, 'Could not load admin data.');
  }
};
// deploy trigger
