const { supabaseAdmin, getUserFromRequest, isAdmin, jsonError } = require('../_lib');

// Letters, numbers and dashes only (matches the ids Supabase generates).
const ID_PATTERN = /^[a-f0-9-]{8,64}$/i;

// One endpoint for admin chat actions:
//   reply   (default)  - send a reply to a customer (unchanged behaviour)
//   delete             - permanently remove one message
//   close / reopen     - mark a conversation closed or open again
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getUserFromRequest(req);
    if (!user || !(await isAdmin(user.id))) return jsonError(res, 403, 'Admin access required.');
    const body = req.body || {};
    const action = String(body.action || 'reply');
    const conversationId = String(body.conversationId || '');
    const db = supabaseAdmin();

    if (action === 'reply') {
      const message = String(body.message || '').trim();
      if (!conversationId || !message || message.length > 4000) return jsonError(res, 400, 'Conversation and a message are required.');
      const { error } = await db.from('chat_messages').insert({ conversation_id: conversationId, sender_role: 'admin', sender_id: user.id, message });
      if (error) return jsonError(res, 500, 'Reply could not be saved.');
      await db.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
      return res.status(200).json({ success: true });
    }

    if (action === 'delete') {
      const messageId = String(body.messageId || '');
      if (!ID_PATTERN.test(conversationId) || !ID_PATTERN.test(messageId)) {
        return jsonError(res, 400, 'Message is invalid.');
      }
      const { data, error } = await db
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('conversation_id', conversationId)
        .select('id');
      if (error) {
        console.error('Admin delete message error:', error.message);
        return jsonError(res, 500, 'The message could not be deleted.');
      }
      if (!data || !data.length) return jsonError(res, 404, 'Message not found.');
      return res.status(200).json({ success: true });
    }

    if (action === 'close' || action === 'reopen') {
      if (!ID_PATTERN.test(conversationId)) return jsonError(res, 400, 'Conversation is invalid.');
      const status = action === 'close' ? 'closed' : 'open';
      const { data, error } = await db
        .from('chat_conversations')
        .update({ status })
        .eq('id', conversationId)
        .select('id,status')
        .maybeSingle();
      if (error) {
        console.error('Admin chat status error:', error.code, error.message);
        return jsonError(
          res,
          500,
          error.code === '23514'
            ? `Your database does not allow the chat status "${status}" yet.`
            : 'The chat status could not be saved.'
        );
      }
      if (!data) return jsonError(res, 404, 'Conversation not found.');
      return res.status(200).json({ success: true, status });
    }

    return jsonError(res, 400, 'Unknown action.');
  } catch (e) {
    console.error('Admin reply error:', e.message);
    return jsonError(res, 500, 'Could not complete that action.');
  }
};
