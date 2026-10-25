const {
  supabaseAdmin,
  getUserFromRequest,
  isAdmin,
  jsonError
} = require('../_lib');

// Columns every order has (this is what the dashboard already loaded before).
const BASE_COLUMNS =
  'id,customer_name,customer_email,customer_phone,delivery_address,items,subtotal,currency,status,created_at';
const PAYMENT_COLUMNS = 'payment_status,payment_reference,paid_at';

// We try the richest column list first and fall back step by step, so the
// dashboard keeps working even if the database is missing optional columns
// (for example, the payment columns from supabase-migration.sql).
const ORDER_COLUMN_SETS = [
  { cols: `${BASE_COLUMNS},notes,${PAYMENT_COLUMNS}`, payment: true, notes: true },
  { cols: `${BASE_COLUMNS},${PAYMENT_COLUMNS}`, payment: true, notes: false },
  { cols: `${BASE_COLUMNS},notes`, payment: false, notes: true },
  { cols: BASE_COLUMNS, payment: false, notes: false }
];

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

    const conversationsPromise = db
      .from('chat_conversations')
      .select('id,name,email,visitor_token,status,created_at,updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    let orders = null;
    let ordersMeta = null;
    let lastOrderError = null;
    for (const set of ORDER_COLUMN_SETS) {
      const result = await db
        .from('orders')
        .select(set.cols)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!result.error) {
        orders = result.data || [];
        ordersMeta = set;
        break;
      }
      lastOrderError = result.error;
    }

    const conversationsResult = await conversationsPromise;

    if (!orders || conversationsResult.error) {
      console.error('Admin data query errors:', {
        orders: lastOrderError?.message,
        conversations: conversationsResult.error?.message
      });
      return jsonError(res, 500, 'Could not load admin data.');
    }

    const conversations = conversationsResult.data || [];

    // Work out which conversations are waiting for a reply from Portexa.
    // This is extra information only: if it fails, the dashboard still loads.
    const lastByConversation = {};
    if (conversations.length) {
      try {
        const latest = await db
          .from('chat_messages')
          .select('conversation_id,sender_role,message,created_at')
          .in('conversation_id', conversations.map(c => c.id))
          .order('created_at', { ascending: false })
          .limit(1000);
        if (!latest.error) {
          for (const row of latest.data || []) {
            if (!lastByConversation[row.conversation_id]) {
              lastByConversation[row.conversation_id] = row;
            }
          }
        } else {
          console.error('Admin last-message query failed:', latest.error.message);
        }
      } catch (error) {
        console.error('Admin last-message error:', error.message);
      }
    }

    const enriched = conversations.map(c => {
      const last = lastByConversation[c.id];
      return {
        ...c,
        last_message: last ? String(last.message || '').slice(0, 160) : '',
        last_sender_role: last ? last.sender_role : null,
        last_message_at: last ? last.created_at : null,
        closed: c.status === 'closed',
        needs_reply: !!last && last.sender_role === 'customer' && c.status !== 'closed'
      };
    });

    const warnings = [];
    if (!ordersMeta.payment) {
      warnings.push(
        'Payment columns are missing from the orders table, so payment status cannot be shown. Run supabase-migration.sql in the Supabase SQL Editor before taking payments.'
      );
    }

    return res.status(200).json({
      orders,
      conversations: enriched,
      warnings,
      paymentColumns: ordersMeta.payment
    });
  } catch (error) {
    console.error('Admin data error:', error);
    return jsonError(res, 500, 'Could not load admin data.');
  }
};
