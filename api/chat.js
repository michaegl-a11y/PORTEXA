const crypto = require('crypto');
const { Resend } = require('resend');
const { supabaseAdmin, jsonError, renderEmail, siteUrl } = require('./_lib');

module.exports = async function handler(req, res) {
  try {
    const db = supabaseAdmin();
    if (req.method === 'POST') {
      const body = req.body || {};
      const name = String(body.name || '').trim().slice(0, 120);
      const email = String(body.email || '').trim().slice(0, 254);
      const message = String(body.message || '').trim();
      let token = String(body.visitorToken || '');
      if (!name || !email || !message || message.length > 4000) return jsonError(res, 400, 'Please enter your name, email, and a message (maximum 4,000 characters).');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError(res, 400, 'Enter a valid email address.');
      if (!/^[a-f0-9-]{20,80}$/i.test(token)) token = crypto.randomUUID();
      let { data: conversation } = await db.from('chat_conversations').select('id,name,email,visitor_token,status').eq('visitor_token', token).maybeSingle();
      if (!conversation) {
        const created = await db.from('chat_conversations').insert({ name, email, visitor_token: token }).select('id,name,email,visitor_token,status').single();
        if (created.error) return jsonError(res, 500, 'Could not start the chat. Please try again.');
        conversation = created.data;
      }
      const inserted = await db.from('chat_messages').insert({ conversation_id: conversation.id, sender_role: 'customer', message }).select('id,message,sender_role,created_at').single();
      if (inserted.error) return jsonError(res, 500, 'Message could not be saved.');
      if (conversation.status === 'closed') {
        try {
          const reopened = await db.from('chat_conversations').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', conversation.id);
          if (reopened.error) console.error('Chat reopen failed:', reopened.error.message);
        } catch (e) { console.error('Chat reopen failed:', e.message); }
      }
      if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL,
            to: [process.env.PORTEXA_RECEIVING_EMAIL || 'Portexa09@gmail.com'],
            subject: `New Portexa chat message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nConversation ID: ${conversation.id}`,
            html: renderEmail({
              title: 'New chat message',
              subtitle: 'From the website chat',
              sections: [
                { label: 'From', type: 'box', lines: [name, email] },
                { label: 'Message', type: 'message', text: message }
              ],
              button: { label: 'Open admin dashboard', href: `${siteUrl()}/admin.html` },
              note: `Conversation ID: ${conversation.id}`
            })
          });
        } catch (e) { console.error('Chat email notification failed:', e.message); }
      }
      return res.status(200).json({ visitorToken: token, conversationId: conversation.id, message: inserted.data });
    }
    if (req.method === 'GET') {
      const token = String(req.query.visitorToken || '');
      if (!/^[a-f0-9-]{20,80}$/i.test(token)) return jsonError(res, 400, 'Chat session is invalid.');
      const { data: conversation } = await db.from('chat_conversations').select('id,status').eq('visitor_token', token).maybeSingle();
      if (!conversation) return res.status(200).json({ messages: [] });
      const { data, error } = await db.from('chat_messages').select('id,message,sender_role,created_at').eq('conversation_id', conversation.id).order('created_at', { ascending: true }).limit(100);
      if (error) return jsonError(res, 500, 'Could not load messages.');
      return res.status(200).json({ messages: data || [] });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Chat error:', e.message);
    return jsonError(res, 500, 'Chat is temporarily unavailable.');
  }
};
