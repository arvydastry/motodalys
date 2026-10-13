/* RunMoto demo: prekės puslapio logika */
(function () {
  'use strict';
  var RM = window.RM, $ = RM.$, $$ = RM.$$, esc = RM.esc, icon = RM.icon;
  var root = $('[data-pdp]'); if (!root) return;
  var P = RM.product(+root.getAttribute('data-pdp'));
  /* komplekto kaina lyginama su 2 vnt. atskirai, ne su išgalvota sena kaina (Omnibus eilutė tik pavienei prekei) */
  var PACKS = { 1: { label: '1 vnt.', price: P.price, old: P.old }, 2: { label: 'Komplektas (2 vnt.)', price: 169, old: null, compare: P.price * 2 } };
  var COLORS = { 'Sidabrinė': 6, 'Juoda': 4, 'Auksinė': 0 };
  var st = { pack: 1, color: 'Sidabrinė', qty: 1 };
  var MONTHS = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  var DAYS = ['sekmadienį', 'pirmadienį', 'antradienį', 'trečiadienį', 'ketvirtadienį', 'penktadienį', 'šeštadienį'];

  function unit() { return PACKS[st.pack].price; }
  function total() { return unit() * st.qty; }
  function stock() { return COLORS[st.color]; }

  /* ---------- price block ---------- */
  var priceEl = $('[data-pdp-price]'), info = $('.pinfo');
  function renderPrice() {
    var pk = PACKS[st.pack], b2b = RM.isB2B();
    var pct = pk.old ? Math.round((1 - pk.price / pk.old) * 100) : 0;
    if (b2b) {
      priceEl.innerHTML = '<div class="pprice__row"><span class="pprice__now num">' + RM.money(RM.shown(pk.price)) + '</span><span class="pprice__vatline num">' + RM.money(pk.price) + ' su PVM</span></div>' +
        '<p class="pprice__note">Verslo kaina be PVM, kainų grupė „' + esc(RM.meta.b2b.group) + '“ (−' + Math.round(RM.meta.b2b.discount * 100) + ' % nuo mažmeninės be PVM). Sąskaita faktūra su užsakymu.</p>';
    } else {
      priceEl.innerHTML = '<div class="pprice__row"><span class="pprice__now num' + (pk.old ? ' is-sale' : '') + '">' + RM.money(pk.price) + '</span>' + (pk.old ? '<span class="pprice__old num">' + RM.money(pk.old) + '</span>' : '') + '</div>' +
        (pk.old ? '<p class="pprice__save">Sutaupote ' + RM.money(pk.old - pk.price) + '</p>' : '') +
        (pk.compare ? '<p class="pprice__save" style="color:var(--c-ok)">Komplekto kaina: sutaupote ' + RM.money(pk.compare - pk.price) + ' lyginant su 2 × ' + RM.money(P.price) + '</p>' : '') +
        '<p class="pprice__note">Kaina su PVM.' + (pk.old ? ' Mažiausia kaina per 30 d. iki nuolaidos: ' + RM.money(pk.old) : '') + '</p>';
    }
    var badge = $('[data-pdp-badge]'); if (badge) { badge.textContent = '−' + pct + ' %'; badge.hidden = !pct || b2b; }
    info.classList.toggle('is-b2b', b2b);
    var hint = $('[data-b2b-hint]');
    if (hint) {
      hint.setAttribute('data-mode', b2b ? 'b2c' : 'b2b');
      $('span', hint).innerHTML = b2b ? 'Rodomos verslo kainos be PVM. <strong>Grįžti prie mažmeninių kainų</strong>' : 'Servisams ir įmonėms: <strong>' + RM.money(pk.price / (1 + RM.meta.vat) * (1 - RM.meta.b2b.discount)) + '</strong> be PVM. Peržiūrėti verslo kainas';
    }
    $$('[data-pack-price]').forEach(function (el) {
      var k = +el.getAttribute('data-pack-price'), p = PACKS[k];
      el.textContent = RM.money(RM.shown(p.price)) + (k === 2 ? ' · −5 %' : '');
    });
    var pts = Math.floor(total() * RM.meta.pointsPerEuro);
    $('[data-points-line]').textContent = 'Už šią prekę gausite ' + pts + ' lojalumo ' + RM.plural(pts, 'tašką', 'taškus', 'taškų') + ' (' + RM.money(pts * RM.meta.pointValue) + ' kitam pirkiniui)';
    var lease = $('[data-lease-line]'), t = total();
    lease.hidden = t < RM.meta.leasingFrom;
    $('[data-sticky-price]').textContent = RM.money(RM.shown(unit()));
    $('[data-sticky-var]').textContent = PACKS[st.pack].label + ' · ' + st.color;
    renderShipTable();
  }

  /* ---------- stock, shipping, ETA ---------- */
  function vilniusNow() {
    var f = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short' });
    var parts = {}; f.formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var d = new Date(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
    return d;
  }
  function isWork(d) { var w = d.getDay(); return w !== 0 && w !== 6; }
  function addWork(d, n) { var x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (isWork(x)) n--; } return x; }
  function fmtRange(a, b) {
    if (a.getMonth() === b.getMonth()) return MONTHS[a.getMonth()] + ' ' + a.getDate() + (a.getDate() !== b.getDate() ? '-' + b.getDate() : '') + ' d.';
    return MONTHS[a.getMonth()] + ' ' + a.getDate() + ' d. - ' + MONTHS[b.getMonth()] + ' ' + b.getDate() + ' d.';
  }
  function renderShip() {
    var now = vilniusNow(), cut = RM.meta.shipCutoffHour, ship, line;
    var s = stock();
    var sl = $('[data-stock-line]');
    if (s > 3) sl.innerHTML = '<span class="pcard__stock stock--in">Sandėlyje ' + s + ' vnt.</span>';
    else if (s > 0) sl.innerHTML = '<span class="pcard__stock stock--low">Liko tik ' + s + ' vnt.</span>';
    else sl.innerHTML = '<span class="pcard__stock stock--order">Pas tiekėją: išsiunčiame per 3-5 darbo dienas</span>';
    if (s <= 0) { ship = addWork(now, 3); line = 'Spalva „' + st.color + '“ užsakoma iš tiekėjo. Galite užsisakyti jau dabar.'; }
    else if (isWork(now) && now.getHours() < cut) {
      var mins = (cut - now.getHours()) * 60 - now.getMinutes();
      ship = now; var hh = Math.floor(mins / 60);
      line = 'Užsakykite per <strong>' + (hh ? hh + ' val. ' : '') + (mins % 60) + ' min.</strong> ir išsiųsime šiandien';
    } else {
      ship = addWork(now, 1);
      var tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
      line = 'Išsiųsime ' + (ship.toDateString() === tomorrow.toDateString() ? 'rytoj' : DAYS[ship.getDay()]) + ', ' + MONTHS[ship.getMonth()] + ' ' + ship.getDate() + ' d.';
    }
    $('[data-ship-line]').innerHTML = line;
    $('[data-eta-line]').textContent = 'Numatomas pristatymas į paštomatą: ' + fmtRange(addWork(ship, 1), addWork(ship, 2));
  }
  function renderShipTable() {
    var free = total() >= RM.meta.freeShippingFrom;
    var rows = RM.meta.shipping.map(function (o) {
      var isLocker = ['omniva', 'lpexpress', 'dpd', 'venipak'].indexOf(o.id) > -1;
      var price = o.price === 0 || (free && isLocker) ? '<span class="is-free">Nemokamai</span>' : RM.money(o.price);
      return '<tr><td>' + esc(o.name) + '</td><td>' + (o.days[1] ? o.days[0] + '-' + o.days[1] + ' d. d.' : 'Tą pačią dieną') + '</td><td>' + price + '</td></tr>';
    }).join('');
    $$('[data-ship-table]').forEach(function (t) { t.innerHTML = rows; });
  }

  /* ---------- variants + qty ---------- */
  root.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-pack]'))) {
      st.pack = +b.getAttribute('data-pack');
      $$('[data-pack]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      $('[data-vlabel="pack"]').textContent = PACKS[st.pack].label;
      renderPrice();
    }
    if ((b = e.target.closest('[data-color]'))) {
      st.color = b.getAttribute('data-color');
      $$('[data-color]').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      $('[data-vlabel="color"]').textContent = st.color + (COLORS[st.color] ? '' : ' (pas tiekėją)');
      renderShip(); renderPrice();
    }
    if ((b = e.target.closest('[data-step]'))) { setQty(st.qty + (+b.getAttribute('data-step'))); }
    if ((b = e.target.closest('[data-copy]'))) {
      var code = b.getAttribute('data-copy');
      var done = function () { b.classList.add('is-copied'); RM.toast('Nukopijuota: ' + code, 'copy'); setTimeout(function () { b.classList.remove('is-copied'); }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done); else done();
    }
    if (e.target.closest('[data-pricematch]')) RM.toast('Radote pigiau? Atsiųskite nuorodą ir peržiūrėsime kainą (demo forma)', 'tag');
  });
  // radio grupės klaviatūra
  $$('[role="radiogroup"]', root).forEach(function (g) {
    g.addEventListener('keydown', function (e) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
      e.preventDefault();
      var items = $$('[role="radio"]', g), i = items.indexOf(doc().activeElement);
      var n = items[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length];
      n.focus(); n.click();
    });
    $$('[role="radio"]', g).forEach(function (r) { r.tabIndex = r.getAttribute('aria-checked') === 'true' ? 0 : -1; r.addEventListener('click', function () { $$('[role="radio"]', g).forEach(function (x) { x.tabIndex = x === r ? 0 : -1; }); }); });
  });
  function doc() { return document; }
  var qtyIn = $('[data-qty-input]');
  function setQty(v) { st.qty = Math.max(1, Math.min(10, v || 1)); qtyIn.value = st.qty; renderPrice(); }
  qtyIn.addEventListener('change', function () { setQty(parseInt(qtyIn.value, 10)); });

  function add() {
    if (RM.addToCart(P.id, st.qty, PACKS[st.pack].label + ' · ' + st.color, unit(), { silent: true })) {
      $$('[data-pdp-add]').forEach(function (b) { b.classList.add('is-done'); });
      setTimeout(function () { RM.openDrawer('cart-drawer'); }, 250);
    }
  }
  $$('[data-pdp-add]').forEach(function (b) { b.addEventListener('click', add); });

  /* ---------- fitment ---------- */
  var fitbox = $('[data-fitbox]'), fitOpen = false;
  fitbox.addEventListener('click', function (e) { if (e.target.closest('[data-fit-open]')) { fitOpen = true; renderFit(); var s = $('[data-vmake]', fitbox); if (s) s.focus(); } });
  function renderFit() {
    var av = RM.activeVehicle(), f = RM.fitStatus(P, av);
    fitbox.className = 'fitbox' + (f === 'yes' ? ' fitbox--yes' : f === 'no' ? ' fitbox--no' : '');
    if (!av) {
      fitbox.innerHTML = '<div class="fitbox__head"><span class="fitbox__icon">' + icon('garage') + '</span><div><p class="fitbox__title">Ar tiks jūsų motociklui?</p><p class="fitbox__text">Pasirinkite techniką ir patikrinsime pagal suderinamumo sąrašą.</p></div></div>' +
        (fitOpen ? '' : '<button class="btn btn--sm fitbox__open" type="button" data-fit-open>' + icon('motorcycle') + 'Pasirinkti motociklą</button>');
      if (!fitOpen) return;
      fitbox.innerHTML += '<form class="vpick" data-vpick="pdp"><div class="vpick__type" role="group" aria-label="Transporto priemonės tipas"><button type="button" aria-pressed="false" data-vtype="scooter">' + icon('moped') + 'Motoroleris</button><button type="button" aria-pressed="true" data-vtype="moto">' + icon('motorcycle') + 'Motociklas</button></div>' +
        '<div class="vpick__row"><div class="field"><label class="field__label" for="p-make">Gamintojas</label><select class="select" id="p-make" data-vmake></select></div><div class="field"><label class="field__label" for="p-model">Modelis</label><select class="select" id="p-model" data-vmodel disabled></select></div><div class="field"><label class="field__label" for="p-year">Metai</label><select class="select" id="p-year" data-vyear disabled></select></div></div></form>';
      var form = $('[data-vpick="pdp"]', fitbox);
      var picker = RM.initPicker(form, function (id, year) { RM.addVehicle(id, year); });
      picker.setType('moto');
      return;
    }
    var name = esc(RM.vehicleName(av));
    if (f === 'yes') {
      fitbox.innerHTML = '<div class="fitbox__head"><span class="fitbox__icon">' + icon('check-circle-fill') + '</span><div><p class="fitbox__title">Tinka jūsų ' + name + '</p><p class="fitbox__text">Patikrinta pagal suderinamumo sąrašą ir OEM kodą <span class="mono">' + esc(P.oem[0]) + '</span>.</p></div></div>' +
        '<div class="fitbox__actions"><button type="button" data-open-garage>Keisti techniką</button><button type="button" data-tab-link="fit">Visas suderinamumo sąrašas</button></div>';
    } else {
      fitbox.innerHTML = '<div class="fitbox__head"><span class="fitbox__icon">' + icon('warning-circle') + '</span><div><p class="fitbox__title">Netinka jūsų ' + name + '</p><p class="fitbox__text">Šis diskas skirtas kitiems modeliams. Parodysime, kas tinka jūsų technikai.</p></div></div>' +
        '<div class="fitbox__actions"><a href="index.html#prekes">Rodyti tinkamas dalis</a><button type="button" data-open-garage>Keisti techniką</button><button type="button" data-tab-link="fit">Suderinamumo sąrašas</button></div>';
    }
  }
  var fitRows = $('[data-fit-rows]'), fitFilter = $('[data-fit-filter]');
  function renderFitRows() {
    var av = RM.activeVehicle(), q = RM.norm(fitFilter.value);
    var list = RM.fitList(P).sort(function (a, b) { return (a.v.make + a.v.model).localeCompare(b.v.make + b.v.model, 'lt'); });
    $('[data-fit-count]').textContent = list.length;
    var yr = /^\d{4}$/.test(q) ? +q : 0, qc = q.replace(/ /g, '');
    var rows = list.filter(function (o) {
      if (!q) return true;
      if (yr) return yr >= o.from && yr <= o.to;
      var hay = RM.norm(o.v.make + ' ' + o.v.model);
      return hay.indexOf(q) > -1 || hay.replace(/ /g, '').indexOf(qc) > -1;
    }).map(function (o) {
      var mine = av && av.v.id === o.v.id && av.year >= o.from && av.year <= o.to;
      return '<tr' + (mine ? ' class="is-mine"' : '') + '><td>' + esc(o.v.make) + '</td><td>' + esc(o.v.model) + '</td><td class="num">' + o.from + '-' + o.to + '</td><td>' + (mine ? '<span class="fittable__mine">' + icon('check-circle-fill', 'i--sm') + 'Jūsų technika</span>' : 'Priekis, abi pusės') + '</td></tr>';
    }).join('');
    fitRows.innerHTML = rows || '<tr><td colspan="4" class="muted">Pagal „' + esc(fitFilter.value) + '“ modelių nerasta.</td></tr>';
  }
  fitFilter.addEventListener('input', renderFitRows);

  /* ---------- tabs ---------- */
  var tabs = $$('[data-tab]');
  function selectTab(name, focus) {
    tabs.forEach(function (t) { var on = t.getAttribute('data-tab') === name; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $('#' + t.getAttribute('aria-controls')).hidden = !on; if (on && focus) t.focus(); });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault(); selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].getAttribute('data-tab'), true);
    });
  });
  document.addEventListener('click', function (e) {
    var l = e.target.closest('[data-tab-link]'); if (!l) return;
    e.preventDefault(); selectTab(l.getAttribute('data-tab-link'));
    var sec = $('#informacija');
    if (RM.lenis) RM.lenis.scrollTo(sec, { offset: -130 }); else sec.scrollIntoView({ behavior: RM.reduced ? 'auto' : 'smooth' });
  });

  /* ---------- gallery + lightbox ---------- */
  var track = $('[data-gallery-track]'), thumbs = $$('[data-thumb]'), dots = $$('.gallery__dots span'), idx = 0;
  var slides = $$('.gallery__slide', track);
  function goto(i, smooth) { idx = (i + slides.length) % slides.length; track.scrollTo({ left: idx * track.clientWidth, behavior: smooth && !RM.reduced ? 'smooth' : 'auto' }); mark(); }
  function mark() {
    thumbs.forEach(function (t, i) { t.setAttribute('aria-pressed', String(i === idx)); });
    dots.forEach(function (d, i) { d.classList.toggle('is-on', i === idx); });
    $('[data-gallery-index]').textContent = idx + 1;
  }
  thumbs.forEach(function (t) { t.addEventListener('click', function () { goto(+t.getAttribute('data-thumb'), true); }); t.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) goto(+t.getAttribute('data-thumb'), false); }); });
  var sT; track.addEventListener('scroll', function () { clearTimeout(sT); sT = setTimeout(function () { var i = Math.round(track.scrollLeft / track.clientWidth); if (i !== idx) { idx = i; mark(); } }, 60); }, { passive: true });
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    slides.forEach(function (s) {
      s.addEventListener('mousemove', function (e) { var r = s.getBoundingClientRect(); s.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); s.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%'); s.classList.add('is-zoom'); });
      s.addEventListener('mouseleave', function () { s.classList.remove('is-zoom'); });
    });
  }
  var lb = $('[data-lightbox]'), lbImg = $('[data-lb-img]');
  function lbShow(i) { idx = (i + slides.length) % slides.length; var im = $('img', slides[idx]); lbImg.src = im.src; lbImg.alt = im.alt; $('[data-lb-index]').textContent = idx + 1; }
  function lbOpen() { lbShow(idx); lb.showModal(); if (RM.lenis) RM.lenis.stop(); }
  slides.forEach(function (s, i) { s.addEventListener('click', function () { idx = i; lbOpen(); }); });
  $('[data-lightbox-open]').addEventListener('click', lbOpen);
  lb.addEventListener('click', function (e) { var n = e.target.closest('[data-lb]'); if (n) lbShow(idx + (+n.getAttribute('data-lb'))); else if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') lbShow(idx + 1); if (e.key === 'ArrowLeft') lbShow(idx - 1); });
  lb.addEventListener('close', function () { goto(idx, false); if (RM.lenis) RM.lenis.start(); });
  var sx = null;
  lb.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  lb.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; if (Math.abs(dx) > 50) lbShow(idx + (dx < 0 ? 1 : -1)); sx = null; });

  /* ---------- used alternative + bundle ---------- */
  var alt = $('[data-altused]');
  function renderAlt() {
    var u = RM.product(1021); if (!alt || !u) return;
    alt.innerHTML = '<img src="' + u.images[0] + '" alt="" width="120" height="120" loading="lazy"><div class="altused__body"><p class="altused__eyebrow">' + icon('recycle', 'i--sm') + ' Taip pat turime naudotą originalą</p><p class="altused__title">' + esc(u.title) + '</p>' + RM.gradeHTML(u.grade) + '<p class="muted" style="font-size:12.5px">' + esc(u.note) + ' Išimta iš: ' + esc(u.donor) + '.</p>' +
      '<div class="altused__row">' + RM.priceHTML(u) + '<button class="btn btn--sm" type="button" data-add="' + u.id + '">' + icon('shopping-cart-simple') + 'Į krepšelį</button><button class="link-arrow" type="button" data-qv="' + u.id + '">Peržiūrėti</button></div></div>';
  }
  var bundle = $('[data-bundle]'), bsel = {};
  RM.collections.bundle.forEach(function (id) { bsel[id] = true; });
  function renderBundle() {
    if (!bundle) return;
    var ids = RM.collections.bundle, chosen = ids.filter(function (id) { return bsel[id]; });
    var sum = chosen.reduce(function (s, id) { return s + RM.product(id).price; }, 0);
    var disc = chosen.length >= 2 ? 0.05 : 0;
    bundle.innerHTML = '<div class="bundle__head"><p class="h3">Kartu pigiau</p><span class="muted" style="font-size:.875rem">Keičiant diską verta pakeisti kaladėles ir skystį</span></div>' +
      '<div class="bundle__items">' + ids.map(function (id) {
        var p = RM.product(id);
        return '<label class="bitem"><input type="checkbox" data-bsel="' + id + '"' + (bsel[id] ? ' checked' : '') + '><img src="' + p.images[0] + '" alt="" width="56" height="56" loading="lazy"><span><span class="bitem__title">' + esc(p.title) + '</span><span class="bitem__price">' + RM.money(RM.shown(p.price)) + '</span></span></label>';
      }).join('') + '</div>' +
      '<div class="bundle__foot"><div class="bundle__total"><strong>' + RM.money(RM.shown(sum * (1 - disc))) + '</strong>' + (disc ? '<span>Sutaupote ' + RM.money(RM.shown(sum * disc)) + ' (−5 %)</span>' : '<span style="color:var(--c-text-3)">Nuolaida taikoma pasirinkus bent 2 prekes</span>') + '</div>' +
      '<button class="btn" type="button" data-badd' + (chosen.length ? '' : ' disabled') + '>' + icon('shopping-cart-simple') + 'Į krepšelį (' + chosen.length + ')</button></div>';
  }
  if (bundle) bundle.addEventListener('change', function (e) { var c = e.target.closest('[data-bsel]'); if (c) { var bid = c.getAttribute('data-bsel'); bsel[+bid] = c.checked; renderBundle(); var nc = $('[data-bsel="' + bid + '"]', bundle); if (nc) nc.focus(); } });
  if (bundle) bundle.addEventListener('click', function (e) {
    if (!e.target.closest('[data-badd]')) return;
    var ids = RM.collections.bundle.filter(function (id) { return bsel[id]; }), disc = ids.length >= 2 ? 0.95 : 1;
    ids.forEach(function (id) { var p = RM.product(id); RM.addToCart(id, 1, ids.length >= 2 ? 'Rinkinys −5 %' : '', +(p.price * disc).toFixed(2), { silent: true }); });
    RM.openDrawer('cart-drawer');
  });

  /* ---------- related ---------- */
  var rel = $('[data-related]');
  function renderRelated() {
    if (!rel) return;
    var keep = rel.scrollLeft;
    rel.innerHTML = RM.collections.related.map(function (id) { return RM.productCard(RM.product(id)); }).join('');
    rel.scrollLeft = keep;
    var car = rel.closest('.carousel'); if (car && car._update) car._update();
  }

  /* ---------- sticky buy ---------- */
  var sticky = $('[data-sticky-buy]'), mainAdd = $('.buy__add');
  if (sticky && mainAdd && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var past = !en[0].isIntersecting;
      sticky.classList.toggle('is-on', past); sticky.setAttribute('aria-hidden', String(!past));
      $('button', sticky).tabIndex = past ? 0 : -1;
    }, { threshold: 0 }).observe(mainAdd);
  }

  /* ---------- wishlist state on load ---------- */
  var wb = $('.buy__wish');
  if (wb && RM.state.wish.indexOf(P.id) > -1) { wb.setAttribute('aria-pressed', 'true'); $('use', wb).setAttribute('href', '#i-heart-fill'); }

  RM.on(function (what) {
    if (what === 'price') { renderPrice(); renderAlt(); renderBundle(); renderRelated(); }
    if (what === 'garage') { renderFit(); renderFitRows(); renderRelated(); }
  });
  renderPrice(); renderShip(); renderFit(); renderFitRows(); renderAlt(); renderBundle(); renderRelated();
  setInterval(renderShip, 60000);
})();
