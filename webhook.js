const crypto = require('crypto');
const { supabaseAdmin } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(503).send('Paystack not configured');
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const signature = req.headers['x-paystack-signature'];
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(401).send('Invalid signature');
    }
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (event.event !== 'charge.success' || !event.data) return res.status(200).send('Ignored');
    const t = event.data;
    if (!t.reference) return res.status(200).send('Missing reference');
    const db = supabaseAdmin();
    const { data: order } = await db.from('orders').select('id,subtotal,currency,payment_status,payment_reference').eq('payment_reference', t.reference).maybeSingle();
    if (!order || order.payment_status === 'paid') return res.status(200).send('No action');
    if (t.status === 'success' && t.reference === order.payment_reference && t.currency === order.currency && Number(t.amount) === Number(order.subtotal) * 100) {
      await db.from('orders').update({ payment_status: 'paid', amount_paid: Number(t.amount), paid_at: t.paid_at || new Date().toISOString(), status: 'confirmed' }).eq('id', order.id).neq('payment_status', 'paid');
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(500).send('Webhook error');
  }
};
