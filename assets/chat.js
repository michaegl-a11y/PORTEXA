/* Portexa customer chat widget (browser side).
   Talks to the existing /api/chat endpoint:
   POST {name,email,message,visitorToken}  ->  {visitorToken, message}
   GET  ?visitorToken=...                  ->  {messages:[...]}
   No secrets live in this file. */
(function () {
  'use strict';
  if (window.__portexaChatLoaded) return;
  window.__portexaChatLoaded = true;

  var KEY = 'portexa_chat';
  var POLL_MS = 10000;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function save(patch) {
    var s = load();
    for (var k in patch) s[k] = patch[k];
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }

  var state = load();            // {token, name, email, seen}
  var open = false;
  var messages = [];
  var timer = null;

  // --- minimal extra styles (site.css already styles the panel shell) ---
  var style = document.createElement('style');
  style.textContent =
    '.chat-launcher button{display:flex;align-items:center;gap:8px;border:0;cursor:pointer;background:#075b4b;color:#fff;font:inherit;font-weight:700;padding:13px 18px;border-radius:999px;box-shadow:0 8px 24px #0003}' +
    '.chat-launcher button:hover{background:#064638}' +
    '.chat-launcher .chat-dot{display:none;min-width:20px;height:20px;padding:0 6px;border-radius:10px;background:#f2c500;color:#173b35;font-size:12px;line-height:20px;text-align:center}' +
    '.chat-panel.is-open{display:flex}' +
    '.chat-panel header{position:static;backdrop-filter:none;border:0;font-weight:700}' +
    '.chat-panel .chat-sub{font-weight:400;font-size:12px;opacity:.85}' +
    '.chat-messages .cm{max-width:85%;padding:9px 12px;border-radius:14px;margin:6px 0;background:#eef3ef;overflow-wrap:anywhere;white-space:pre-wrap}' +
    '.chat-messages .cm.me{margin-left:auto;background:#075b4b;color:#fff}' +
    '.chat-messages .cm small{display:block;opacity:.7;font-size:11px;margin-bottom:2px}' +
    '.chat-messages .chat-empty{color:#687a75;text-align:center;margin-top:24px}' +
    '.chat-form{padding:10px 12px 12px;border-top:1px solid #dce7e1;background:#fff}' +
    '.chat-form textarea{resize:none;min-height:60px}' +
    '.chat-form .chat-send{width:100%;border:0;border-radius:10px;background:#075b4b;color:#fff;font:inherit;font-weight:700;padding:11px;cursor:pointer}' +
    '.chat-form .chat-send:disabled{opacity:.6;cursor:default}' +
    '.chat-form .chat-err{color:#8b2922;font-size:13px;margin:0 0 6px;min-height:0}' +
    '@media(max-width:480px){.chat-panel{right:8px;left:8px;width:auto;bottom:74px;height:70vh}}';
  document.head.appendChild(style);

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  // --- launcher ---
  var launcher = el('div', { 'class': 'chat-launcher' });
  var launchBtn = el('button', { type: 'button', 'aria-label': 'Open chat with Portexa', 'aria-expanded': 'false' });
  launchBtn.appendChild(el('span', null, 'Chat with us'));
  var dot = el('span', { 'class': 'chat-dot', 'aria-hidden': 'true' }, '0');
  launchBtn.appendChild(dot);
  launcher.appendChild(launchBtn);

  // --- panel ---
  var panel = el('div', { 'class': 'chat-panel', role: 'dialog', 'aria-label': 'Chat with Portexa' });
  var head = el('header');
  var title = el('div');
  title.appendChild(el('div', null, 'Chat with Portexa'));
  title.appendChild(el('div', { 'class': 'chat-sub' }, 'Ask us about products and orders'));
  var closeBtn = el('button', { type: 'button', 'class': 'close', 'aria-label': 'Close chat' }, '\u00d7');
  head.appendChild(title); head.appendChild(closeBtn);

  var list = el('div', { 'class': 'chat-messages', 'aria-live': 'polite' });

  var form = el('form', { 'class': 'chat-form', novalidate: 'novalidate' });
  var err = el('p', { 'class': 'chat-err', role: 'alert' });
  var nameIn = el('input', { type: 'text', placeholder: 'Your name', maxlength: '120', autocomplete: 'name', 'aria-label': 'Your name' });
  var emailIn = el('input', { type: 'email', placeholder: 'Your email', maxlength: '254', autocomplete: 'email', 'aria-label': 'Your email' });
  var msgIn = el('textarea', { placeholder: 'Type your message\u2026', maxlength: '4000', 'aria-label': 'Message' });
  var sendBtn = el('button', { type: 'submit', 'class': 'chat-send' }, 'Send');
  form.appendChild(err); form.appendChild(nameIn); form.appendChild(emailIn); form.appendChild(msgIn); form.appendChild(sendBtn);

  panel.appendChild(head); panel.appendChild(list); panel.appendChild(form);

  function fmt(v) {
    try { return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; }
  }

  function render() {
    list.textContent = '';
    if (!messages.length) {
      list.appendChild(el('p', { 'class': 'chat-empty' }, 'Hello! Send us a message and we will reply here.'));
    }
    messages.forEach(function (m) {
      var mine = m.sender_role !== 'admin';
      var b = el('div', { 'class': 'cm' + (mine ? ' me' : '') });
      b.appendChild(el('small', null, (mine ? 'You' : 'Portexa') + ' \u00b7 ' + fmt(m.created_at)));
      b.appendChild(el('span', null, m.message || ''));
      list.appendChild(b);
    });
    list.scrollTop = list.scrollHeight;
    // hide name/email once we know them
    var known = !!(state.name && state.email);
    nameIn.style.display = emailIn.style.display = known ? 'none' : 'block';
    if (known) { nameIn.value = state.name; emailIn.value = state.email; }
  }

  function adminCount() {
    return messages.filter(function (m) { return m.sender_role === 'admin'; }).length;
  }
  function updateBadge() {
    var unseen = Math.max(0, adminCount() - (state.seen || 0));
    if (open || !unseen) { dot.style.display = 'none'; return; }
    dot.textContent = String(unseen); dot.style.display = 'inline-block';
  }
  function markSeen() { state = save({ seen: adminCount() }); updateBadge(); }

  function fetchMessages() {
    if (!state.token) return Promise.resolve();
    return fetch('/api/chat?visitorToken=' + encodeURIComponent(state.token), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !Array.isArray(d.messages)) return;
        var changed = d.messages.length !== messages.length;
        messages = d.messages;
        if (open) { if (changed) render(); markSeen(); } else { updateBadge(); }
      })
      .catch(function () { /* stay quiet; try again on next poll */ });
  }

  function startPolling() {
    if (timer || !state.token) return;
    timer = setInterval(function () { if (!document.hidden) fetchMessages(); }, POLL_MS);
  }

  function setOpen(v) {
    open = v;
    panel.classList.toggle('is-open', v);
    launchBtn.setAttribute('aria-expanded', String(v));
    if (v) {
      render();
      fetchMessages().then(function () { render(); markSeen(); });
      msgIn.focus();
    } else { updateBadge(); }
  }

  launchBtn.addEventListener('click', function () { setOpen(!open); });
  closeBtn.addEventListener('click', function () { setOpen(false); launchBtn.focus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });

  // Enter sends, Shift+Enter makes a new line
  msgIn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : sendBtn.click(); }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var name = (state.name || nameIn.value).trim();
    var email = (state.email || emailIn.value).trim();
    var text = msgIn.value.trim();
    if (!name || !email) { err.textContent = 'Please enter your name and email.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address.'; return; }
    if (!text) { err.textContent = 'Please type a message.'; return; }
    sendBtn.disabled = true; sendBtn.textContent = 'Sending\u2026';
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: text, visitorToken: state.token || '' })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d && res.d.error || 'Message could not be sent.');
        state = save({ token: res.d.visitorToken, name: name, email: email });
        msgIn.value = '';
        startPolling();
        return fetchMessages();
      })
      .then(function () { render(); markSeen(); })
      .catch(function (ex) { err.textContent = ex.message || 'Message could not be sent. Please try again.'; })
      .then(function () { sendBtn.disabled = false; sendBtn.textContent = 'Send'; });
  });

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(launcher);
    render();
    if (state.token) { fetchMessages(); startPolling(); }
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
