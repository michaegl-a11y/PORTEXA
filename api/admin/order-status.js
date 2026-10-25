const {
  supabaseAdmin,
  getUserFromRequest,
  isAdmin,
  jsonError
} = require('../_lib');

// Payment status is controlled only by Paystack verification, never from here.
const ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const user = await getUserFromRequest(req);
    if (!user || !(await isAdmin(user.id))) {
      return jsonError(res, 403, 'Admin access required.');
    }
    const body = req.body || {};
    const orderId = String(body.orderId || '');
    const status = String(body.status || '').toLowerCase();

    if (!/^[a-f0-9-]{8,64}$/i.test(orderId)) {
      return jsonError(res, 400, 'Order is invalid.');
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return jsonError(res, 400, 'That order status is not allowed.');
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id,status')
      .maybeSingle();

    if (error) {
      console.error('Order status update failed:', error.code, error.message);
      return jsonError(
        res,
        500,
        error.code === '23514'
          ? `Your database does not allow the status "${status}" yet.`
          : 'The order status could not be saved.'
      );
    }
    if (!data) return jsonError(res, 404, 'Order not found.');

    return res.status(200).json({ success: true, order: data });
  } catch (error) {
    console.error('Order status error:', error.message);
    return jsonError(res, 500, 'Could not update the order.');
  }
};
