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

  const { data, error } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return false;

  return ['admin', 'owner'].includes(data.role);
}
const CATALOG = {
  'white-pad': { name: 'White Day Pad', detail: '245 mm · 10 pieces per pack', price: 2500 },
  'black-pad': { name: 'Black Night Pad', detail: '290 mm · 8 pieces per pack', price: 2500 },
  'purple-pad': { name: 'Purple Heavy-Flow Pad', detail: '360 mm · 6 pieces per pack', price: 3500 },
  'blue-liner': { name: 'Blue Panty Liner', detail: '160 mm · 30 pieces per pack', price: 3500 }
};
function jsonError(res, status, message) { return res.status(status).json({ error: message }); }
// Emails the Portexa inbox when an order is newly marked as paid.
// Never throws: a failed email must not break payment confirmation.
async function notifyNewOrder(order) {
  try {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      console.error('Order email skipped: email is not configured.');
      return;
    }
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const money = (n) => '\u20a6' + Number(n || 0).toLocaleString('en-NG');
    const items = Array.isArray(order.items) ? order.items : [];
    const lines = items.map((i) => `- ${i.name} x ${i.quantity} (${money(i.line_total)})`).join('\n');
    const text = [
      'A new Portexa order has been paid.',
      '',
      `Reference: ${order.payment_reference}`,
      `Amount paid: ${money(order.subtotal)}`,
      '',
      'Items:',
      lines || '(no items listed)',
      '',
      'Customer:',
      `Name: ${order.customer_name}`,
      `Email: ${order.customer_email}`,
      `Phone: ${order.customer_phone}`,
      `Delivery address: ${order.delivery_address}`,
      order.notes ? `Notes: ${order.notes}` : 'Notes: none',
      '',
      'Delivery charges are confirmed separately. Open the admin dashboard to manage this order.'
    ].join('\n');
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [process.env.PORTEXA_RECEIVING_EMAIL || 'Portexa09@gmail.com'],
      replyTo: String(order.customer_email || '').slice(0, 254) || undefined,
      subject: `New paid Portexa order - ${money(order.subtotal)} (${order.payment_reference})`,
      text
    });
    if (error) console.error('Order email failed:', error.message || error);
  } catch (e) {
    console.error('Order email error:', e.message);
  }
}

module.exports = { notifyNewOrder, supabaseAdmin, supabasePublic, getUserFromRequest, isAdmin, CATALOG, jsonError };
