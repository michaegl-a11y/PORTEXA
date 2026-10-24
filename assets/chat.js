/* Portexa site menu: top-left menu button, slide-out menu, cart shortcut, social links */
(function () {
  var nav = document.querySelector('header .site-nav');
  if (!nav) return;
  var header = nav.closest('header');
  var links = nav.querySelector('.navlinks');
  var brand = nav.querySelector('.brand');
  if (!links || !brand) return;

  var INSTAGRAM = 'https://www.instagram.com/portexa.finds';
  var TIKTOK = 'https://www.tiktok.com/@portexa';

  var ICON_INSTAGRAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>';
  var ICON_TIKTOK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"></path></svg>';
  var ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.2l2.1 10.2a1 1 0 0 0 1 .8h8.4a1 1 0 0 0 1-.78L19.5 8H6.1"></path><circle cx="9" cy="19.5" r="1.4"></circle><circle cx="17" cy="19.5" r="1.4"></circle></svg>';

  function socialHTML() {
    return '<a href="' + INSTAGRAM + '" target="_blank" rel="noopener noreferrer" aria-label="Portexa on Instagram">' + ICON_INSTAGRAM + '<span>Instagram</span></a>' +
           '<a href="' + TIKTOK + '" target="_blank" rel="noopener noreferrer" aria-label="Portexa on TikTok">' + ICON_TIKTOK + '<span>TikTok</span></a>';
  }

  /* Menu button (top left) */
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-btn';
  btn.setAttribute('aria-label', 'Open menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.insertBefore(btn, nav.firstChild);

  /* Cart shortcut (top right) */
  var cart = document.createElement('a');
  cart.className = 'top-cart';
  cart.href = '/cart.html';
  cart.setAttribute('aria-label', 'Cart');
  cart.innerHTML = ICON_CART;
  nav.appendChild(cart);

  /* Dim background behind the menu */
  var backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';
  header.appendChild(backdrop);

  /* Social links inside the menu and in the footer */
  var menuSocial = document.createElement('div');
  menuSocial.className = 'social-links';
  menuSocial.innerHTML = socialHTML();
  links.appendChild(menuSocial);

  var footer = document.querySelector('.site-footer');
  if (footer) {
    var footerSocial = document.createElement('div');
    footerSocial.className = 'footer-social';
    footerSocial.innerHTML = '<span>Follow Portexa</span><div class="social-links">' + socialHTML() + '</div>';
    footer.appendChild(footerSocial);
  }

  /* Highlight the current page in the menu */
  function norm(p) {
    p = p.split('?')[0].split('#')[0].replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    return p.length > 1 ? p.replace(/\/$/, '') : p;
  }
  var here = norm(location.pathname);
  links.querySelectorAll('a').forEach(function (a) {
    if (a.classList.contains('nav-cta') || a.closest('.social-links')) return;
    if (norm(a.getAttribute('href') || '') === here) a.setAttribute('aria-current', 'page');
  });

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('menu-open'));
  });
  backdrop.addEventListener('click', function () { setOpen(false); });
  links.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900) setOpen(false);
  });
})();

/* Portexa live chat (unchanged) */
(function(){
const markup=`<div class="chat-launcher"><button type="button" id="px-chat-open" class="button" style="box-shadow:0 8px 24px #0002">Chat with Portexa</button></div><section id="px-chat-panel" class="chat-panel" aria-label="Portexa live chat"><header><strong>Portexa support</strong><button id="px-chat-close" class="close" type="button" aria-label="Close chat">×</button></header><div id="px-chat-messages" class="chat-messages"><p>Send us a message. We’ll reply as soon as we can.</p></div><form id="px-chat-form" style="padding:12px;border-top:1px solid #eee"><input id="px-chat-name" placeholder="Your name" required maxlength="120"><input id="px-chat-email" placeholder="Your email" type="email" required maxlength="254"><textarea id="px-chat-message" placeholder="Write your message…" required maxlength="4000" rows="2"></textarea><button class="button" type="submit" id="px-chat-send" style="width:100%;margin-top:6px">Send message</button><small id="px-chat-status" role="status"></small></form></section>`;
document.body.insertAdjacentHTML('beforeend',markup);const $=id=>document.getElementById(id);const panel=$('px-chat-panel'),messages=$('px-chat-messages');let token=localStorage.getItem('portexa_chat_token')||'';
$('px-chat-open').addEventListener('click',()=>{panel.style.display='flex';load()});$('px-chat-close').addEventListener('click',()=>panel.style.display='none');
function render(items){if(!items||!items.length)return;messages.innerHTML='';items.forEach(m=>{const row=document.createElement('div');row.style.cssText='margin:8px 0;padding:9px 11px;border-radius:10px;background:'+(m.sender_role==='admin'?'#eaf4ef':'#f3f0f6');const title=document.createElement('strong');title.textContent=m.sender_role==='admin'?'Portexa':'You';const body=document.createElement('div');body.style.whiteSpace='pre-wrap';body.style.overflowWrap='anywhere';body.textContent=m.message;row.append(title,body);messages.appendChild(row)});messages.scrollTop=messages.scrollHeight}
async function load(){if(!token)return;try{const r=await fetch('/api/chat?visitorToken='+encodeURIComponent(token));const d=await r.json();if(r.ok)render(d.messages)}catch(e){}}
$('px-chat-form').addEventListener('submit',async e=>{e.preventDefault();const btn=$('px-chat-send'),status=$('px-chat-status');btn.disabled=true;status.textContent='Sending…';try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('px-chat-name').value,email:$('px-chat-email').value,message:$('px-chat-message').value,visitorToken:token})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not send message');token=d.visitorToken;localStorage.setItem('portexa_chat_token',token);$('px-chat-message').value='';status.textContent='Message sent. We’ll get back to you.';await load()}catch(err){status.textContent=err.message||'Could not send message'}finally{btn.disabled=false}});setInterval(load,15000)
})();
