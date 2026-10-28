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
// ---- Branded email layout (shared by the order, enquiry and chat emails) ----
function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function siteUrl() {
  return String(process.env.SITE_URL || 'https://myportexa.vercel.app').replace(/\/+$/, '');
}
function isEmailAddress(v) {
  return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(String(v || ''));
}
function renderEmail(o) {
  const G = '#17483b', D = '#10372d', GOLD = '#ffbc0f', CREAM = '#faf6f1';
  const F = 'Arial,Helvetica,sans-serif', S = 'Georgia,\'Times New Roman\',serif';
  let body = '';
  (o.sections || []).forEach((sec) => {
    body += `<div style="font:11px ${F};letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4f;margin:22px 0 8px">${esc(sec.label)}</div>`;
    if (sec.type === 'rows') {
      body += '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">' +
        sec.rows.map((r) => `<tr><td style="padding:9px 0;border-bottom:1px solid #eef0ee;font:14px ${F};color:${D}">${esc(r[0])}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #eef0ee;font:14px ${F};color:${D};white-space:nowrap">${esc(r[1])}</td></tr>`).join('') +
        '</table>';
    } else if (sec.type === 'box') {
      body += `<div style="background:${CREAM};border-radius:8px;padding:13px 15px;font:14px/1.7 ${F};color:${D}">` + sec.lines.map(esc).join('<br>') + '</div>';
    } else if (sec.type === 'message') {
      body += `<div style="background:${CREAM};border-left:3px solid ${GOLD};border-radius:4px;padding:13px 15px;font:15px/1.6 ${F};color:${D}">${esc(sec.text).replace(/\r?\n/g, '<br>')}</div>`;
    }
  });
  const pill = o.pill ? `<span style="display:inline-block;background:#e3f2e8;color:${G};border-radius:999px;font:12px ${F};padding:3px 10px;margin-left:8px;vertical-align:middle">${esc(o.pill)}</span>` : '';
  const sub = o.subtitle ? `<p style="margin:0 0 16px;font:13px ${F};color:#6b7f76;word-break:break-all">${esc(o.subtitle)}</p>` : '<div style="height:12px"></div>';
  const amount = o.amount ? `<p style="margin:0;font:bold 30px ${F};color:${G}">${esc(o.amount)}</p>` : '';
  const button = o.button && o.button.href ? `<a href="${esc(o.button.href)}" style="display:block;text-align:center;background:${GOLD};color:${D};text-decoration:none;font:bold 15px ${F};border-radius:999px;padding:14px;margin-top:24px">${esc(o.button.label)}</a>` : '';
  const note = o.note ? `<p style="margin:16px 0 0;font:12px/1.5 ${F};color:#6b7f76">${esc(o.note)}</p>` : '';
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">' +
    `<title>${esc(o.title)}</title></head>` +
    `<body style="margin:0;padding:0;background:${CREAM}">` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${CREAM}"><tr><td align="center" style="padding:18px 10px">` +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">' +
    `<tr><td style="padding:16px 22px;border-bottom:3px solid ${GOLD}"><img src="${esc(siteUrl())}/images/portexa-logo-green.png" alt="Portexa" height="32" style="display:block;height:32px;width:auto;border:0;font:bold 18px ${F};color:${G}"></td></tr>` +
    `<tr><td style="padding:22px">` +
    `<h1 style="margin:0 0 4px;font:400 22px/1.25 ${S};color:${D}">${esc(o.title)}${pill}</h1>${sub}${amount}${body}${button}${note}` +
    '</td></tr>' +
    `<tr><td align="center" style="background:${D};padding:18px 22px;font:12px/1.6 ${F};color:#b7cfc5"><div style="font:14px ${S};color:#ffffff;margin-bottom:4px">Built on trust, delivered with excellence.</div>Automatic message from your Portexa website.</td></tr>` +
    '</table></td></tr></table></body></html>';
}

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
      text,
      html: renderEmail({
        title: 'New order',
        pill: 'Paid',
        subtitle: `Reference: ${order.payment_reference}`,
        amount: money(order.subtotal),
        sections: [
          { label: 'Items', type: 'rows', rows: items.map((i) => [`${i.name} \u00d7 ${i.quantity}`, money(i.line_total)]) },
          { label: 'Customer', type: 'box', lines: [order.customer_name, order.customer_email, order.customer_phone, order.delivery_address, order.notes ? `Notes: ${order.notes}` : 'Notes: none'] }
        ],
        button: { label: 'Open admin dashboard', href: `${siteUrl()}/admin.html` },
        note: 'Delivery charges are confirmed separately.'
      })
    });
    if (error) console.error('Order email failed:', error.message || error);
  } catch (e) {
    console.error('Order email error:', e.message);
  }
}

module.exports = { notifyNewOrder, renderEmail, siteUrl, isEmailAddress, supabaseAdmin, supabasePublic, getUserFromRequest, isAdmin, CATALOG, jsonError };
