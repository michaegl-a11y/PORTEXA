const { supabaseAdmin, jsonError, notifyNewOrder } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return jsonError(res, 503, 'Paystack is not configured yet.');
    const reference = String((req.method === 'GET' ? req.query.reference : (req.body || {}).reference) || '');
    if (!/^PORTEXA-[a-f0-9]{24}$/.test(reference)) return jsonError(res, 400, 'Payment reference is invalid.');
    const db = supabaseAdmin();
    const { data: order, error } = await db.from('orders').select('id,subtotal,currency,payment_reference,payment_status,status').eq('payment_reference', reference).maybeSingle();
    if (error || !order) return jsonError(res, 404, 'We could not find this order.');
    if (order.payment_status === 'paid') return res.status(200).json({ success: true, alreadyVerified: true, orderId: order.id });
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const result = await verifyResponse.json();
    const transaction = result.data;
    if (!verifyResponse.ok || !result.status || !transaction) return jsonError(res, 502, 'Paystack verification could not be completed.');
    const valid = transaction.status === 'success'
      && transaction.reference === order.payment_reference
      && transaction.currency === order.currency
      && Number(transaction.amount) === Number(order.subtotal) * 100;
    if (!valid) {
      if (transaction.status === 'failed' || transaction.status === 'abandoned') {
        await db.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
      }
      return res.status(200).json({ success: false, message: 'Payment has not been confirmed. Do not repeat payment until you check with Portexa.' });
    }
    const { data: updatedRows, error: updateError } = await db.from('orders').update({
      payment_status: 'paid',
      amount_paid: Number(transaction.amount),
      paid_at: transaction.paid_at || new Date().toISOString(),
      status: 'confirmed'
    }).eq('id', order.id).neq('payment_status', 'paid')
      .select('id,items,subtotal,payment_reference,customer_name,customer_email,customer_phone,delivery_address,notes');
    if (updateError) {
      console.error('Order payment update failed:', updateError.message);
      return jsonError(res, 500, 'Payment was verified but the order update needs attention. Contact Portexa with your payment reference.');
    }
    if (updatedRows && updatedRows.length) await notifyNewOrder(updatedRows[0]);
    return res.status(200).json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Verify error:', error.message);
    return jsonError(res, 500, 'Payment verification failed.');
  }
};
