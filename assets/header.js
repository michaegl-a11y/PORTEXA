/* Portexa shared header and footer.
   Use on a page with:
   <script src="/assets/header.js" data-part="header"></script>
   <script src="/assets/header.js" data-part="footer"></script>
   Edit the links below once and every page that uses this file updates. */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var part = script.getAttribute('data-part') || 'header';

  var LINKS = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop.html' },
    { label: 'About us', href: '/about.html' },
    { label: 'Contact', href: '/contact.html' }
  ];
  var WHATSAPP = 'https://wa.me/2349138176684';
  var INSTAGRAM = 'https://www.instagram.com/portexa.finds';
  var TIKTOK = 'https://www.tiktok.com/@portexa';

  var path = location.pathname.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  function isCurrent(href) {
    var h = href.replace(/\/+$/, '') || '/';
    return h === path;
  }

  var ICON = {
    user: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.1 4.2 5 4.4"/></svg>'
  };

  function injectStyle() {
    if (document.getElementById('px-style')) return;
    var css = [
      ':root{--px-green:#17483b;--px-deep:#10372d;--px-gold:#ffbc0f;--px-cream:#faf6f1;--px-line:#e3e8e5}',
      'header.px-header{position:sticky;top:0;z-index:30;background:#fff;border-bottom:1px solid var(--px-line);backdrop-filter:none}',
      '.px-bar{max-width:1160px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.px-brand{display:flex;align-items:center;text-decoration:none;color:var(--px-green);font-weight:800;letter-spacing:.1em;font-size:1.2rem}',
      '.px-brand img{height:30px;width:auto;max-width:150px;display:block;object-fit:contain}',
      '.px-links{display:none}',
      '.px-icons{display:flex;align-items:center;gap:2px}',
      '.px-ic{position:relative;display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;border:0;background:transparent;color:var(--px-green);cursor:pointer;padding:0;text-decoration:none}',
      '.px-ic:hover,.px-ic:focus-visible{background:#eaf2ed}',
      '.px-badge{position:absolute;top:4px;right:2px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--px-gold);color:var(--px-deep);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1}',
      '.px-toggle .px-x{display:none}',
      '.px-header.px-open .px-toggle .px-x{display:block}',
      '.px-header.px-open .px-toggle .px-m{display:none}',
      '.px-menu{display:none;background:var(--px-cream);border-top:1px solid var(--px-line);padding:6px 16px 14px}',
      '.px-header.px-open .px-menu{display:block}',
      '.px-menu a{display:block;padding:13px 2px;font-size:1.05rem;color:var(--px-deep);text-decoration:none;border-bottom:1px solid #eadfd3}',
      '.px-menu a:last-child{border-bottom:0}',
      '.px-menu a[aria-current="page"]{font-weight:700}',
      '@media (min-width:860px){',
      '.px-bar{padding:12px 24px}',
      '.px-brand img{height:38px;max-width:170px}',
      '.px-links{display:flex;gap:30px;align-items:center}',
      '.px-links a{color:var(--px-green);text-decoration:none;font-size:.97rem;padding:6px 0;border-bottom:2px solid transparent}',
      '.px-links a:hover{border-bottom-color:#d9e6df}',
      '.px-links a[aria-current="page"]{border-bottom-color:var(--px-gold)}',
      '.px-toggle,.px-menu,.px-header.px-open .px-menu{display:none}',
      '}',
      'footer.px-footer{background:var(--px-deep);color:#eaf2ed;margin-top:40px;padding:34px 20px 22px}',
      '.px-fgrid{max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:26px}',
      '.px-footer h3{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:1.1rem;margin:0 0 10px;color:#fff}',
      '.px-footer a{color:#eaf2ed;text-decoration:none}',
      '.px-footer a:hover{text-decoration:underline}',
      '.px-flist a{display:block;padding:5px 0;font-size:.98rem}',
      '.px-social{display:flex;gap:16px}',
      '.px-social a{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid rgba(255,255,255,.4);border-radius:50%;color:#fff}',
      '.px-social a:hover{background:rgba(255,255,255,.12);text-decoration:none}',
      '.px-fbottom{max-width:1160px;margin:26px auto 0;padding-top:16px;border-top:1px solid rgba(255,255,255,.18);font-size:.85rem;color:#b7cfc5;display:flex;flex-direction:column;gap:6px}',
      '@media (min-width:760px){.px-fgrid{grid-template-columns:repeat(3,1fr)}.px-fbottom{flex-direction:row;justify-content:space-between}}'
    ].join('');
    var s = document.createElement('style');
    s.id = 'px-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function link(l, extra) {
    return '<a href="' + l.href + '"' + (isCurrent(l.href) ? ' aria-current="page"' : '') + (extra || '') + '>' + l.label + '</a>';
  }

  function headerHtml() {
    var desk = LINKS.map(function (l) { return link(l); }).join('');
    var mob = LINKS.map(function (l) { return link(l); }).join('');
    return '<header class="px-header" id="px-header">' +
      '<div class="px-bar">' +
      '<a class="px-brand" href="/" aria-label="Portexa home"><img src="/images/portexa-logo-green.png" alt="Portexa" onerror="this.outerHTML=\'PORTEXA\'"></a>' +
      '<nav class="px-links" aria-label="Main navigation">' + desk + '</nav>' +
      '<div class="px-icons">' +
      '<a class="px-ic" href="/account.html" aria-label="Account">' + ICON.user + '</a>' +
      '<a class="px-ic" href="/cart.html" aria-label="Cart">' + ICON.bag + '<span class="px-badge" data-cart-count>0</span></a>' +
      '<button class="px-ic px-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="px-menu"><span class="px-m">' + ICON.menu + '</span><span class="px-x">' + ICON.close + '</span></button>' +
      '</div></div>' +
      '<nav class="px-menu" id="px-menu" aria-label="Mobile navigation">' + mob + '</nav>' +
      '</header>';
  }

  function footerHtml() {
    var quick = LINKS.concat([{ label: 'Account', href: '/account.html' }, { label: 'Cart', href: '/cart.html' }])
      .map(function (l) { return '<a href="' + l.href + '">' + l.label + '</a>'; }).join('');
    return '<footer class="px-footer"><div class="px-fgrid">' +
      '<div><h3>Quick links</h3><div class="px-flist">' + quick + '</div></div>' +
      '<div><h3>Get in touch</h3><div class="px-flist"><a href="/contact.html">Email us</a><a href="' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp</a></div></div>' +
      '<div><h3>Follow Portexa</h3><div class="px-social">' +
      '<a href="' + INSTAGRAM + '" target="_blank" rel="noopener" aria-label="Portexa on Instagram">' + ICON.instagram + '</a>' +
      '<a href="' + TIKTOK + '" target="_blank" rel="noopener" aria-label="Portexa on TikTok">' + ICON.tiktok + '</a>' +
      '</div></div></div>' +
      '<div class="px-fbottom"><span>Built on trust, delivered with excellence.</span><span>\u00a9 ' + new Date().getFullYear() + ' Portexa. All rights reserved.</span></div>' +
      '</footer>';
  }

  injectStyle();

  if (part === 'footer') {
    script.insertAdjacentHTML('beforebegin', footerHtml());
    return;
  }

  script.insertAdjacentHTML('beforebegin', headerHtml());

  var header = document.getElementById('px-header');
  var toggle = header.querySelector('.px-toggle');
  function setOpen(open) {
    header.classList.toggle('px-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setOpen(!header.classList.contains('px-open')); });
  header.querySelectorAll('.px-menu a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 860) setOpen(false); });

  if (window.portexaCart && typeof window.portexaCart.count === 'function') {
    header.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = window.portexaCart.count(); });
  }
})();
