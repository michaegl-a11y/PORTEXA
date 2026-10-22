const crypto = require('crypto');
const { supabaseAdmin, getUserFromRequest, CATALOG, jsonError } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return jsonError(res, 503, 'Paystack is not configured yet.');
    const body = req.body || {};
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!customer.name || !customer.email || !customer.phone || !customer.address) {
      return jsonError(res, 400, 'Name, email, phone, and delivery address are required.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email))) {
      return jsonError(res, 400, 'Enter a valid email address.');
    }
    if (!items.length || items.length > 30) return jsonError(res, 400, 'Your order is empty or too large.');
    let subtotal = 0;
    const verifiedItems = [];
    for (const item of items) {
      const product = CATALOG[item.id];
      const qty = Number(item.quantity);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        return jsonError(res, 400, 'An item in your order is invalid.');
      }
      if (product.price === null) return jsonError(res, 400, `${product.name} needs a confirmed quote before online payment.`);
      subtotal += product.price * qty;
      verifiedItems.push({ id: item.id, name: product.name, detail: product.detail, unit_price: product.price, quantity: qty, line_total: product.price * qty });
    }
    if (subtotal < 100) return jsonError(res, 400, 'The order total is invalid.');
    const user = await getUserFromRequest(req);
    const db = supabaseAdmin();
    const reference = 'PORTEXA-' + crypto.randomBytes(12).toString('hex');
    const { data: order, error: insertError } = await db.from('orders').insert({
      user_id: user ? user.id : null,
      customer_name: String(customer.name).trim().slice(0, 160),
      customer_email: String(customer.email).trim().toLowerCase().slice(0, 254),
      customer_phone: String(customer.phone).trim().slice(0, 40),
      delivery_address: String(customer.address).trim().slice(0, 1000),
      notes: String(body.notes || '').trim().slice(0, 2000),
      items: verifiedItems,
      subtotal,
      currency: 'NGN',
      status: 'pending',
      payment_status: 'pending',
      payment_reference: reference
    }).select('id,subtotal,payment_reference').single();
    if (insertError) {
      console.error('Order insert failed:', insertError.message);
      return jsonError(res, 500, 'We could not save the order. Please try again.');
    }
    const origin = `https://${req.headers.host}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer.email,
        amount: String(subtotal * 100),
        currency: 'NGN',
        reference,
        callback_url: `${origin}/payment-result.html`,
        metadata: { order_id: order.id, customer_name: customer.name, custom_fields: [{ display_name: 'Portexa order ID', variable_name: 'order_id', value: order.id }] }
      })
    });
    const paystack = await response.json();
    if (!response.ok || !paystack.status || !paystack.data?.authorization_url) {
      await db.from('orders').update({ payment_status: 'failed' }).eq('id', order.id);
      console.error('Paystack initialization failed:', paystack.message || 'unknown error');
      return jsonError(res, 502, 'Paystack could not start the payment. Please try again.');
    }
    return res.status(200).json({ authorizationUrl: paystack.data.authorization_url, reference, orderId: order.id });
  } catch (error) {
    console.error('Initialize error:', error.message);
    return jsonError(res, 500, 'Something went wrong starting your payment.');
  }
};
