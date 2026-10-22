const { supabaseAdmin, getUserFromRequest, isAdmin, jsonError } = require('../_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromRequest(req);
    if (!user || !(await isAdmin(user.id))) return jsonError(res, 403, 'Admin access required.');
    const body = req.body || {};
    const conversationId = String(body.conversationId || '');
    const message = String(body.message || '').trim();
    if (!conversationId || !message || message.length > 4000) return jsonError(res, 400, 'Conversation and a message are required.');
    const db = supabaseAdmin();
    const { error } = await db.from('chat_messages').insert({ conversation_id: conversationId, sender_role: 'admin', sender_id: user.id, message });
    if (error) return jsonError(res, 500, 'Reply could not be saved.');
    await db.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Admin reply error:', e.message);
    return jsonError(res, 500, 'Could not send reply.');
  }
};
