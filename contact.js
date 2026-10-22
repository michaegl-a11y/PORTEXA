const { Resend } = require('resend');
const { jsonError } = require('./_lib');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return jsonError(res, 400, 'Name, email, and message are required.');
  if (String(message).length > 5000) return jsonError(res, 400, 'Message is too long.');
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return jsonError(res, 503, 'Email is not configured yet.');
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [process.env.PORTEXA_RECEIVING_EMAIL || 'Portexa09@gmail.com'],
      replyTo: String(email).slice(0, 254),
      subject: `Portexa website enquiry from ${String(name).slice(0, 120)}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });
    if (error) return jsonError(res, 502, 'Email could not be sent. Please try WhatsApp instead.');
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('Resend error:', e.message);
    return jsonError(res, 500, 'Email could not be sent.');
  }
};
