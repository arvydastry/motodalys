/* RunMoto demo: pirmo puslapio logika */
(function () {
  'use strict';
  var RM = window.RM, $ = RM.$, $$ = RM.$$, esc = RM.esc, icon = RM.icon;

  /* ---------- finder tabs ---------- */
  var finder = $('[data-finder]');
  if (finder) {
    var tabs = $$('[data-ftab]', finder);
    function select(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length], true); }
      });
    });
    var hform = $('[data-vpick="hero"]', finder);
    if (hform) RM.initPicker(hform, function (id, year) {
      RM.addVehicle(id, year);
      filter = null; setTab('fit');
      scrollToProducts();
    });
    var eg = $('[data-engine-grid]', finder);
    if (eg) {
      var main = ['MIN-H-LC', 'MIN-H-AC', 'MIN-V', 'PIA-2T', 'PEU-H', 'PEU-V', 'GY6-50', 'AM6'];
      eg.innerHTML = main.map(function (k) {
        var n = RM.vehicles.filter(function (v) { return v.engine === k; }).length;
        return '<button type="button" aria-pressed="false" data-engine="' + k + '">' + esc(RM.engines[k]) + '<span>' + n + ' ' + RM.plural(n, 'modelis', 'modeliai', 'modelių') + '</span></button>';
      }).join('');
      eg.addEventListener('click', function (e) {
        var b = e.target.closest('[data-engine]'); if (!b) return;
        $$('[data-engine]', eg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var k = b.getAttribute('data-engine');
        filter = { type: 'engine', value: k, label: RM.engines[k] };
        setTab('fit'); scrollToProducts();
      });
    }
    var oem = $('[data-oem-form]', finder);
    if (oem) oem.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('input', oem).value.trim(); if (!v) return;
      var inp = window.innerWidth < 1024 ? $('#search-q-m') : $('#hdr-q');
      inp.value = v; RM.openSearch(); inp.dispatchEvent(new Event('input'));
      if (window.innerWidth >= 1024) { window.scrollTo({ top: 0, behavior: RM.reduced ? 'auto' : 'smooth' }); setTimeout(function () { inp.focus(); }, 300); }
    });
  }
  function scrollToProducts() {
    var t = $('#prekes'); if (!t) return;
    if (RM.lenis) RM.lenis.scrollTo(t, { offset: -110 }); else t.scrollIntoView({ behavior: RM.reduced ? 'auto' : 'smooth' });
  }

  /* ---------- category tiles -> filter ---------- */
  $$('[data-cat]').forEach(function (a) {
    a.addEventListener('click', function () {
      var c = RM.category(a.getAttribute('data-cat'));
      filter = { type: 'cat', value: c.slug, label: c.name }; setTab('fit');
    });
  });
  var megaCta = $('[data-open-mega-cta]');
  if (megaCta) megaCta.addEventListener('click', function () { if (window.innerWidth < 1024) RM.openDrawer('menu-drawer'); else { window.scrollTo({ top: 0 }); RM.openMega(); } });

  /* ---------- products ---------- */
  var track = $('[data-ptrack]'), ptabs = $('[data-ptabs]'), vctx = $('[data-vctx]'), fitTab = $('[data-fit-tab]');
  var current = 'bestseller', filter = null;
  function list() {
    var av = RM.activeVehicle();
    if (current === 'fit') {
      if (filter && filter.type === 'cat') return RM.products.filter(function (p) { return p.cat === filter.value || (filter.value === 'naudotos' && p.condition === 'used'); });
      if (filter && filter.type === 'engine') return RM.products.filter(function (p) { return p.engines && p.engines.indexOf(filter.value) > -1; });
      if (av) {
        var yes = RM.products.filter(function (p) { return RM.fitStatus(p, av) === 'yes'; });
        var uni = RM.products.filter(function (p) { return p.universal && p.cat === 'chemija'; });
        return yes.concat(uni);
      }
      return [];
    }
    return RM.collections[current].map(RM.product);
  }
  function render(keepScroll) {
    var av = RM.activeVehicle();
    var prevScroll = track.scrollLeft;
    if (fitTab) {
      fitTab.hidden = !(av || filter);
      fitTab.textContent = filter ? filter.label : (av ? 'Tinka jūsų ' + av.v.model : '');
      if (fitTab.hidden && current === 'fit') current = 'bestseller';
    }
    $$('[data-ptab]', ptabs).forEach(function (b) { var on = b.getAttribute('data-ptab') === current; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; if (on) track.setAttribute('aria-labelledby', b.id); });
    var items = list();
    if (!items.length) {
      track.innerHTML = '<div class="empty-state" style="grid-column:1/-1">' + icon('magnifying-glass') + '<p>Demo kataloge šiam pasirinkimui prekių nėra. Tikroje parduotuvėje čia bus visas asortimentas.</p></div>';
    } else track.innerHTML = items.map(function (p) { return RM.productCard(p); }).join('');
    var parts = [];
    if (av) parts.push('<span class="vctx__veh">' + icon(av.v.type === 'moto' ? 'motorcycle' : 'moped') + esc(RM.vehicleName(av)) + '</span>');
    if (current === 'fit' && filter) parts.push('<span>Filtras: <strong>' + esc(filter.label) + '</strong>, rasta ' + items.length + '</span><button type="button" data-clear-filter>Išvalyti filtrą</button>');
    else if (current === 'fit' && av) parts.push('<span>Rodomos tik tinkančios dalys: ' + items.length + '</span>');
    else if (av) parts.push('<span>Kortelėse matote, ar dalis tinka.</span>');
    if (av) parts.push('<button type="button" data-open-garage>Keisti techniką</button>');
    vctx.innerHTML = parts.join('');
    var car = track.closest('.carousel'); track.scrollLeft = keepScroll ? prevScroll : 0; if (car && car._update) car._update();
  }
  function setTab(t) { current = t; render(); }
  if (ptabs) {
    ptabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ptab]'); if (!b) return;
      setTab(b.getAttribute('data-ptab'));
    });
    ptabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = $$('[data-ptab]:not([hidden])', ptabs), i = tabs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      setTab(n.getAttribute('data-ptab')); n.focus();
    });
  }
  /* nuorodos į akcijas ir variklio platformas (mega meniu, kiti puslapiai) */
  function engineFilter(k) {
    if (!RM.engines[k]) return;
    filter = { type: 'engine', value: k, label: RM.engines[k] };
    $$('[data-engine]').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-engine') === k)); });
    setTab('fit');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href$="#akcijos"]'); if (a) { filter = null; setTab('sale'); }
    var ep = e.target.closest('[data-engine-pick]'); if (ep) { engineFilter(ep.getAttribute('data-engine-pick')); }
  });
  if (vctx) vctx.addEventListener('click', function (e) {
    if (e.target.closest('[data-clear-filter]')) { filter = null; $$('[data-engine]').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); setTab(RM.activeVehicle() ? 'fit' : 'bestseller'); }
  });

  /* ---------- used ---------- */
  var ug = $('[data-used-grid]');
  function renderUsed() { if (ug) ug.innerHTML = RM.collections.used.map(function (id) { return RM.productCard(RM.product(id)); }).join(''); }
  var dl = $('[data-donors]');
  if (dl) dl.innerHTML = RM.donors.map(function (d) {
    return '<li><a class="donor" href="#naudotos" data-demo="Donoro puslapis: visos išardytos technikos dalys su nuotraukomis (demo)"><img src="' + d.image + '" alt="" width="84" height="84" loading="lazy"><span><span class="donor__name">' + esc(d.name) + '</span><span class="donor__meta">' + d.year + ' m.</span><span class="donor__parts">' + icon('recycle') + d.parts + ' ' + RM.plural(d.parts, 'dalis', 'dalys', 'dalių') + ' sandėlyje</span></span></a></li>';
  }).join('');

  /* ---------- B2B card ---------- */
  var b2p = $('[data-b2b-prices]');
  function renderB2B() {
    if (!b2p) return;
    var p = RM.product(1002), net = p.price / (1 + RM.meta.vat), you = net * (1 - RM.meta.b2b.discount);
    b2p.innerHTML = '<div><dt>Mažmeninė kaina su PVM</dt><dd>' + RM.money(p.price) + '</dd></div>' +
      '<div><dt>Mažmeninė kaina be PVM</dt><dd>' + RM.money(net) + '</dd></div>' +
      '<div class="is-you"><dt>Jūsų kaina be PVM</dt><dd>' + RM.money(you) + '</dd></div>' +
      '<div class="is-save"><dt>Sutaupote</dt><dd>' + RM.money(net - you) + ' (−' + Math.round(RM.meta.b2b.discount * 100) + ' %)</dd></div>';
  }

  /* ---------- brands ---------- */
  var bl = $('[data-brands]');
  if (bl) {
    bl.innerHTML = RM.partBrands.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
    var clone = bl.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); bl.parentNode.appendChild(clone);
  }

  /* ---------- reviews ---------- */
  var rg = $('[data-reviews]');
  if (rg) rg.innerHTML = RM.reviews.map(function (r) {
    var p = RM.product(r.product);
    return '<article class="review">' + RM.stars(r.rating) + '<p class="review__text">„' + esc(r.text) + '“</p><p class="review__who">' + esc(r.name) + '<span>' + esc(r.city) + '</span></p><span class="review__verified">' + icon('seal-check-fill') + 'Patvirtintas pirkimas</span>' +
      '<a class="review__prod" href="' + (p.pdp || '#') + '"' + (p.pdp ? '' : ' data-qv="' + p.id + '"') + '><img src="' + p.images[0] + '" alt="" width="40" height="40" loading="lazy">' + esc(p.title) + '</a></article>';
  }).join('');

  /* ---------- newsletter ---------- */
  var nf = $('[data-news-form]');
  function newsVeh() {
    var lab = $('[data-news-veh-label]'), av = RM.activeVehicle();
    if (lab) lab.textContent = av ? 'Pridėti mano techniką: ' + RM.vehicleName(av) : 'Pridėti mano techniką iš garažo';
  }
  if (nf) nf.addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#news-email'), err = $('#news-err');
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
    if (!ok) { err.textContent = inp.value.trim() ? 'Patikrinkite el. pašto adresą, pvz. vardas@pastas.lt' : 'Įveskite el. pašto adresą'; err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    var av = RM.activeVehicle(), withVeh = $('[data-news-veh]').checked && av;
    nf.innerHTML = '<div class="news__ok" role="status">' + icon('check-circle-fill') + '<p class="h3">Ačiū! Patikrinkite el. paštą</p><p class="muted">Patvirtinimo laišką išsiuntėme į ' + esc(inp.value.trim()) + '. Paspaudę nuorodą laiške, pradėsite gauti pasiūlymus' + (withVeh ? ', pritaikytus ' + esc(RM.vehicleName(av)) : '') + '.</p></div>';
  });

  /* ---------- background video ---------- */
  var vid = $('[data-bg-video]'), vt = $('[data-video-toggle]');
  if (vid) {
    var userPaused = RM.reduced, inView = false;
    function play() { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
    function sync() { if (inView && !userPaused && !document.hidden) play(); else vid.pause(); if (vt) { $('use', vt).setAttribute('href', '#i-' + (userPaused ? 'play' : 'pause')); $('.sr-only', vt).textContent = userPaused ? 'Paleisti fono vaizdo įrašą' : 'Sustabdyti fono vaizdo įrašą'; } }
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (inView && vid.preload === 'none') { vid.preload = 'auto'; vid.load(); } sync(); }, { threshold: 0.2 }).observe(vid);
    document.addEventListener('visibilitychange', sync);
    if (vt) vt.addEventListener('click', function () { userPaused = !userPaused; sync(); });
    sync();
  }

  /* ---------- state ---------- */
  RM.on(function (what) {
    if (what === 'garage') { if (RM.activeVehicle() && !filter) current = 'fit'; render(); renderUsed(); newsVeh(); }
    if (what === 'price') { render(true); renderUsed(); renderB2B(); }
  });
  if (RM.activeVehicle()) current = 'fit';
  var qs = new URLSearchParams(location.search).get('variklis');
  if (qs && RM.engines[qs]) { filter = { type: 'engine', value: qs, label: RM.engines[qs] }; current = 'fit'; }
  if (location.hash === '#akcijos') current = 'sale';
  render(); renderUsed(); renderB2B(); newsVeh();
})();
