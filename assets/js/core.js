/* RunMoto demo: bendras sluoksnis (būsena, kainos, garažas, paieška, krepšelis, judesys) */
(function () {
  'use strict';
  var RM = window.RM;
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  RM.$ = $; RM.$$ = $$;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  RM.reduced = reduced;

  /* ---------- storage ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('rm:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('rm:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  RM.store = store;

  var S = RM.state = {
    cart: store.get('cart', []),
    wish: store.get('wish', []),
    garage: store.get('garage', { list: [], active: -1 }),
    mode: store.get('mode', 'b2c'),
    currency: store.get('currency', 'EUR'),
    recent: store.get('recent', [])
  };

  function emit(what) { doc.dispatchEvent(new CustomEvent('rm:change', { detail: { what: what } })); }
  RM.emit = emit;
  RM.on = function (fn) { doc.addEventListener('rm:change', function (e) { fn(e.detail.what); }); };

  /* ---------- helpers ---------- */
  var byId = {};
  RM.products.forEach(function (p) { byId[p.id] = p; });
  RM.product = function (id) { return byId[id]; };
  var vehById = {};
  RM.vehicles.forEach(function (v) { vehById[v.id] = v; });
  RM.vehicle = function (id) { return vehById[id]; };
  var catBySlug = {};
  RM.categories.forEach(function (c) { catBySlug[c.slug] = c; });
  RM.category = function (s) { return catBySlug[s]; };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  RM.esc = esc;
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  RM.norm = norm;
  /* lietuviškos daugiskaitos formos: plural(n, 'taškas', 'taškai', 'taškų') */
  function plural(n, one, few, many) {
    var a = Math.abs(n) % 10, b = Math.abs(n) % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 9 && (b < 11 || b > 19)) return few;
    return many;
  }
  RM.plural = plural;
  var isHome = doc.body.classList.contains('page-home');
  RM.home = function (hash) { return isHome ? hash : 'index.html' + hash; };
  function icon(name, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>'; }
  RM.icon = icon;

  /* ---------- money ---------- */
  var fmtCache = {};
  function money(eur, opts) {
    opts = opts || {};
    var cur = opts.currency || S.currency;
    var rate = RM.meta.currencies[cur].rate;
    var key = cur;
    if (!fmtCache[key]) {
      try { fmtCache[key] = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
      catch (e) { fmtCache[key] = { format: function (n) { return n.toFixed(2).replace('.', ',') + ' ' + RM.meta.currencies[cur].symbol; } }; }
    }
    return fmtCache[key].format(eur * rate).replace('US$', '$');
  }
  RM.money = money;
  RM.isB2B = function () { return S.mode === 'b2b'; };
  /* kaina, kurią mato lankytojas: B2C su PVM; B2B be PVM su grupės nuolaida */
  function shown(eur) { return S.mode === 'b2b' ? eur / (1 + RM.meta.vat) * (1 - RM.meta.b2b.discount) : eur; }
  RM.shown = shown;
  RM.vatNote = function () { return S.mode === 'b2b' ? 'be PVM' : 'su PVM'; };

  function priceHTML(p, opts) {
    opts = opts || {};
    var unit = opts.price != null ? opts.price : p.price;
    var old = opts.old != null ? opts.old : p.old;
    var html = '<div class="price">';
    if (S.mode === 'b2b') {
      html += '<span class="price__now num">' + money(shown(unit)) + '</span>';
      html += '<span class="price__old num" style="text-decoration:none">' + money(unit) + ' su PVM</span>';
      html += '<span class="price__b2b">Verslo kaina be PVM, grupė „' + esc(RM.meta.b2b.group) + '“</span>';
    } else {
      html += '<span class="price__now num' + (old ? ' is-sale' : '') + '">' + money(unit) + '</span>';
      if (old) html += '<span class="price__old num">' + money(old) + '</span>';
    }
    return html + '</div>';
  }
  RM.priceHTML = priceHTML;
  function discount(p) { return p.old ? Math.round((1 - p.price / p.old) * 100) : 0; }
  RM.discount = discount;

  /* ---------- garage + fitment ---------- */
  function activeVehicle() {
    var g = S.garage; var it = g.list[g.active];
    if (!it) return null;
    var v = vehById[it.id];
    return v ? { v: v, year: it.year } : null;
  }
  RM.activeVehicle = activeVehicle;
  RM.vehicleName = function (av, withYear) { return av ? av.v.make + ' ' + av.v.model + (withYear !== false ? ' (' + av.year + ')' : '') : ''; };
  RM.shortName = function (av) { return av ? av.v.model : ''; };

  function fitStatus(p, av) {
    if (p.universal) return 'universal';
    if (!av) return null;
    if (p.engines && av.v.engine && p.engines.indexOf(av.v.engine) > -1) return 'yes';
    if (p.models) {
      for (var i = 0; i < p.models.length; i++) {
        var m = p.models[i];
        if (m[0] === av.v.id && av.year >= m[1] && av.year <= m[2]) return 'yes';
      }
    }
    return 'no';
  }
  RM.fitStatus = fitStatus;
  RM.fitsVehicle = function (p, vehicleId, year) { return fitStatus(p, { v: vehById[vehicleId], year: year }); };

  /* sąrašas technikos, kuriai tinka prekė */
  RM.fitList = function (p) {
    var out = [];
    if (p.models) p.models.forEach(function (m) { var v = vehById[m[0]]; if (v) out.push({ v: v, from: m[1], to: m[2] }); });
    if (p.engines) RM.vehicles.forEach(function (v) {
      if (v.engine && p.engines.indexOf(v.engine) > -1 && !out.some(function (o) { return o.v.id === v.id; })) out.push({ v: v, from: v.years[0], to: v.years[1], engine: v.engine });
    });
    return out;
  };
  function fitsSummary(p) {
    if (p.universal) return p.universal;
    if (p.donor) return 'Iš: ' + p.donor;
    if (p.engines && p.engines.length <= 2) return p.engines.map(function (e) { return RM.engines[e]; }).join(', ');
    var list = RM.fitList(p);
    if (!list.length) return '';
    var names = list.slice(0, 2).map(function (o) { return o.v.make + ' ' + o.v.model; });
    return 'Tinka: ' + names.join(', ') + (list.length > 2 ? ' ir dar ' + (list.length - 2) : '');
  }
  RM.fitsSummary = fitsSummary;

  function saveGarage() { store.set('garage', S.garage); emit('garage'); }
  RM.addVehicle = function (id, year) {
    var g = S.garage;
    var idx = -1;
    g.list.forEach(function (it, i) { if (it.id === id && it.year === year) idx = i; });
    if (idx < 0) { g.list.unshift({ id: id, year: year }); idx = 0; if (g.list.length > 5) g.list.length = 5; }
    g.active = idx;
    saveGarage();
    toast('Garaže: ' + RM.vehicleName(activeVehicle()) + '. Rodome tinkamas dalis.');
  };
  RM.setActiveVehicle = function (i) { S.garage.active = i; saveGarage(); };
  RM.removeVehicle = function (i) {
    var g = S.garage; g.list.splice(i, 1);
    if (g.active === i) g.active = g.list.length ? 0 : -1; else if (g.active > i) g.active--;
    saveGarage();
  };
  RM.clearActive = function () { S.garage.active = -1; saveGarage(); };

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg, ico) {
    toastEl = toastEl || $('[data-toast]');
    if (!toastEl) return;
    $('[data-toast-text]', toastEl).textContent = msg;
    var use = $('use', toastEl); if (use) use.setAttribute('href', '#i-' + (ico || 'check-circle-fill'));
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3600);
  }
  RM.toast = toast;

  /* ---------- product card ---------- */
  function stars(r) {
    var h = '<span class="stars" role="img" aria-label="Įvertinimas ' + String(r).replace('.', ',') + ' iš 5">';
    for (var i = 1; i <= 5; i++) h += icon('star-fill', i <= Math.round(r) ? '' : 'off');
    return h + '</span>';
  }
  RM.stars = stars;
  function gradeHTML(g) {
    var gr = RM.grades[g]; if (!gr) return '';
    var d = '';
    for (var i = 1; i <= 3; i++) d += '<i class="' + (i <= gr.dots ? 'on' : '') + '"></i>';
    return '<span class="grade" title="' + esc(gr.text) + '"><span class="grade__dots" aria-hidden="true">' + d + '</span>Būklė ' + gr.label + ': ' + esc(gr.name) + '</span>';
  }
  RM.gradeHTML = gradeHTML;
  function stockHTML(p) {
    if (p.condition === 'used') return '<span class="pcard__stock stock--low">Vienetinė prekė</span>';
    if (p.stock > 5) return '<span class="pcard__stock stock--in">Sandėlyje</span>';
    if (p.stock > 0) return '<span class="pcard__stock stock--low">Liko ' + p.stock + ' vnt.</span>';
    return '<span class="pcard__stock stock--order">Pas tiekėją, 3-5 d. d.</span>';
  }
  RM.stockHTML = stockHTML;
  function badgesHTML(p) {
    var b = [];
    if (p.old) b.push('<span class="badge badge--sale">−' + discount(p) + ' %</span>');
    if (p.condition === 'used') b.push('<span class="badge badge--used">' + icon('recycle') + 'Naudota ' + esc(p.grade) + '</span>');
    else if (p.tags && p.tags.indexOf('new') > -1) b.push('<span class="badge badge--soft">Naujiena</span>');
    if (p.tuning) b.push('<span class="badge badge--hot">Tiuningas</span>');
    return b.join('');
  }
  RM.badgesHTML = badgesHTML;

  function productCard(p, opts) {
    opts = opts || {};
    var av = activeVehicle();
    var fit = fitStatus(p, av);
    var inWish = S.wish.indexOf(p.id) > -1;
    var href = p.pdp ? p.pdp : '#';
    var img2 = p.images[1] ? '<img src="' + p.images[1] + '" alt="" loading="lazy" width="600" height="600">' : '';
    var fitbar = '';
    if (fit === 'yes') fitbar = '<span class="pcard__fitbar pcard__fitbar--yes">' + icon('check-circle-fill') + 'Tinka jūsų ' + esc(RM.shortName(av)) + '</span>';
    else if (fit === 'no') fitbar = '<span class="pcard__fitbar pcard__fitbar--no">' + icon('warning-circle') + 'Netinka jūsų ' + esc(RM.shortName(av)) + '</span>';
    var titleLink = p.pdp
      ? '<a href="' + href + '">' + esc(p.title) + '</a>'
      : '<a href="#" data-qv="' + p.id + '">' + esc(p.title) + '</a>';
    var meta = p.condition === 'used' ? gradeHTML(p.grade) : (p.rating ? '<span class="pcard__rating">' + stars(p.rating) + '<span>' + String(p.rating).replace('.', ',') + ' (' + p.reviews + ')</span></span>' : '');
    var addLabel = p.sizes ? 'Pasirinkti dydį' : 'Į krepšelį';
    return '<article class="pcard' + (opts.compact ? ' pcard--compact' : '') + '" data-pid="' + p.id + '">' +
      '<div class="pcard__media">' +
        '<img src="' + p.images[0] + '" alt="' + esc(p.title) + '" loading="lazy" width="600" height="600">' + img2 +
        '<div class="pcard__badges">' + badgesHTML(p) + '</div>' + fitbar +
      '</div>' +
      '<button class="icon-btn icon-btn--round pcard__wish" type="button" aria-pressed="' + inWish + '" data-wish="' + p.id + '">' + icon(inWish ? 'heart-fill' : 'heart') + '<span class="sr-only">Įsiminti: ' + esc(p.title) + '</span></button>' +
      '<button class="icon-btn icon-btn--round pcard__qv" type="button" data-qv="' + p.id + '">' + icon('eye') + '<span class="sr-only">Greita peržiūra</span></button>' +
      '<div class="pcard__body">' +
        '<div class="pcard__meta"><span class="pcard__brand">' + esc(p.brand) + '</span><span class="pcard__sku">' + esc(p.sku) + '</span></div>' +
        '<h3 class="pcard__title">' + titleLink + '</h3>' +
        '<p class="pcard__fits">' + esc(fitsSummary(p)) + '</p>' + meta +
        '<div class="pcard__foot"><div>' + priceHTML(p) + stockHTML(p) + '</div>' +
          '<button class="pcard__add" type="button" data-add="' + p.id + '"' + (p.sizes ? ' data-needs-size' : '') + '>' + icon(p.sizes ? 'ruler' : 'shopping-cart-simple') + '<span class="sr-only">' + addLabel + ': ' + esc(p.title) + '</span></button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }
  RM.productCard = productCard;

  /* ---------- cart + wishlist ---------- */
  function lineKey(id, variant) { return id + '|' + (variant || ''); }
  function saveCart() { store.set('cart', S.cart); emit('cart'); }
  RM.addToCart = function (id, qty, variant, unitPrice, opts) {
    var p = byId[id]; if (!p) return;
    qty = qty || 1;
    var key = lineKey(id, variant);
    var line = S.cart.filter(function (l) { return lineKey(l.id, l.variant) === key; })[0];
    if (p.condition === 'used' && line) { toast('Naudota dalis yra vienetinė: ji jau krepšelyje.', 'info'); return false; }
    if (line) line.qty += qty; else S.cart.push({ id: id, qty: p.condition === 'used' ? 1 : qty, variant: variant || '', price: unitPrice || p.price });
    saveCart();
    if (!(opts && opts.silent)) toast('Įdėta į krepšelį: ' + p.title);
    bump('[data-cart-count]');
    return true;
  };
  RM.cartTotals = function () {
    var sub = 0, count = 0;
    S.cart.forEach(function (l) { sub += l.price * l.qty; count += l.qty; });
    return { sub: sub, count: count, freeLeft: Math.max(0, RM.meta.freeShippingFrom - sub) };
  };
  RM.toggleWish = function (id) {
    var i = S.wish.indexOf(id);
    if (i > -1) S.wish.splice(i, 1); else S.wish.push(id);
    store.set('wish', S.wish); emit('wish');
    toast(i > -1 ? 'Pašalinta iš norų sąrašo' : 'Pridėta į norų sąrašą', i > -1 ? 'heart' : 'heart-fill');
    if (i < 0) bump('[data-wish-count]');
    return i < 0;
  };
  function bump(sel) { $$(sel).forEach(function (b) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }); }

  function renderCounts() {
    var t = RM.cartTotals();
    $$('[data-cart-count]').forEach(function (b) { b.textContent = t.count; b.hidden = !t.count; });
    $$('[data-cart-sum]').forEach(function (b) { b.textContent = money(shown(t.sub)); });
    $$('[data-wish-count]').forEach(function (b) { b.textContent = S.wish.length; b.hidden = !S.wish.length; });
  }

  function renderCart() {
    var body = $('[data-cart-body]'), foot = $('[data-cart-foot]');
    if (!body) return;
    var t = RM.cartTotals();
    if (!S.cart.length) {
      body.innerHTML = '<div class="empty-state">' + icon('shopping-cart-simple') + '<p>Jūsų krepšelis tuščias.</p><button class="btn btn--sm" type="button" data-open-garage>Rasti dalis savo technikai</button></div>';
      foot.hidden = true; return;
    }
    var pct = Math.min(100, t.sub / RM.meta.freeShippingFrom * 100);
    var html = '<div class="ship-meter' + (t.freeLeft ? '' : ' is-done') + '"><p>' + (t.freeLeft ? 'Iki nemokamo pristatymo į paštomatą trūksta <strong>' + money(t.freeLeft) + '</strong>' + (S.mode === 'b2b' ? ' (su PVM)' : '') : 'Pristatymas į paštomatą nemokamas!') + '</p><div class="ship-meter__bar"><span style="width:' + pct + '%"></span></div></div>';
    S.cart.forEach(function (l, i) {
      var p = byId[l.id]; if (!p) return;
      html += '<div class="line"><img src="' + p.images[0] + '" alt="" width="76" height="76" loading="lazy"><div><p class="line__title">' + esc(p.title) + '</p><p class="line__meta">' + esc(p.brand) + (l.variant ? ' · ' + esc(l.variant) : '') + ' · <span class="mono">' + esc(p.sku) + '</span></p>' +
        (p.condition === 'used' ? '<p class="line__meta">Vienetinė naudota dalis</p>' : '<div class="qty"><button type="button" data-qty="' + i + '" data-d="-1">' + icon('minus') + '<span class="sr-only">Mažinti</span></button><output aria-live="polite">' + l.qty + '</output><button type="button" data-qty="' + i + '" data-d="1">' + icon('plus') + '<span class="sr-only">Didinti</span></button></div>') +
        '</div><div class="line__right"><span class="line__price">' + money(shown(l.price * l.qty)) + '</span><button class="line__remove" type="button" data-remove="' + i + '">Pašalinti</button></div></div>';
    });
    body.innerHTML = html;
    var points = Math.floor(t.sub * RM.meta.pointsPerEuro);
    var vatLine = S.mode === 'b2b' ? '<div><span>PVM 21 %</span><span class="num">' + money(shown(t.sub) * RM.meta.vat) + '</span></div>' : '';
    foot.innerHTML = '<div class="totals"><div><span>Tarpinė suma (' + RM.vatNote() + ')</span><span class="num">' + money(shown(t.sub)) + '</span></div>' + vatLine +
      '<div><span>Pristatymas</span><span>' + (t.freeLeft ? 'nuo ' + money(2.49) + (S.mode === 'b2b' ? ' su PVM' : '') : 'nemokamas') + '</span></div>' +
      '<div class="muted"><span>Už užsakymą gausite ' + points + ' lojalumo ' + plural(points, 'tašką', 'taškus', 'taškų') + '</span></div></div>' +
      '<button class="btn btn--accent btn--block" type="button" data-demo="Apmokėjimas: Paysera, Montonio, kortelės, Apple Pay ir lizingas (demo)">Pereiti prie apmokėjimo' + icon('arrow-right') + '</button>' +
      '<button class="btn btn--ghost btn--block btn--sm" type="button" data-close>Tęsti apsipirkimą</button>';
    foot.hidden = false;
  }

  function renderWish() {
    var body = $('[data-wish-body]'); if (!body) return;
    if (!S.wish.length) { body.innerHTML = '<div class="empty-state">' + icon('heart') + '<p>Norų sąrašas tuščias. Spauskite širdelę ant prekės ir ji liks čia.</p></div>'; return; }
    body.innerHTML = '<div class="pgrid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">' + S.wish.map(function (id) { return byId[id] ? productCard(byId[id], { compact: true }) : ''; }).join('') + '</div>';
  }

  /* ---------- vehicle picker (garažas, hero, PDP) ---------- */
  function initPicker(form, onPick) {
    var type = 'scooter';
    var make = $('[data-vmake]', form), model = $('[data-vmodel]', form), year = $('[data-vyear]', form), submit = $('[data-vsubmit]', form);
    function makes() {
      var seen = {}, list = [];
      RM.vehicles.forEach(function (v) { if (v.type === type && !seen[v.make]) { seen[v.make] = 1; list.push(v.make); } });
      list.sort(function (a, b) { return a.localeCompare(b, 'lt'); });
      make.innerHTML = '<option value="">Pasirinkite</option>' + list.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');
      model.innerHTML = '<option value="">Modelis</option>'; model.disabled = true;
      year.innerHTML = '<option value="">Metai</option>'; year.disabled = true;
      if (submit) submit.disabled = true;
    }
    $$('[data-vtype]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        type = b.getAttribute('data-vtype');
        $$('[data-vtype]', form).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        makes();
      });
    });
    make.addEventListener('change', function () {
      var list = RM.vehicles.filter(function (v) { return v.type === type && v.make === make.value; });
      model.innerHTML = '<option value="">Pasirinkite</option>' + list.map(function (v) { return '<option value="' + v.id + '">' + esc(v.model) + '</option>'; }).join('');
      model.disabled = !make.value;
      year.innerHTML = '<option value="">Metai</option>'; year.disabled = true;
      if (submit) submit.disabled = true;
    });
    model.addEventListener('change', function () {
      var v = vehById[model.value];
      if (!v) { year.disabled = true; return; }
      var o = '<option value="">Pasirinkite</option>';
      for (var y = v.years[1]; y >= v.years[0]; y--) o += '<option>' + y + '</option>';
      year.innerHTML = o; year.disabled = false;
      if (submit) submit.disabled = true;
    });
    year.addEventListener('change', function () { if (submit) submit.disabled = !year.value; if (!submit && year.value) done(); });
    function done() { if (model.value && year.value) onPick(model.value, parseInt(year.value, 10)); }
    form.addEventListener('submit', function (e) { e.preventDefault(); done(); });
    makes();
    return { setType: function (t) { var b = $('[data-vtype="' + t + '"]', form); if (b) b.click(); } };
  }
  RM.initPicker = initPicker;

  function renderGarageUI() {
    var av = activeVehicle();
    $$('[data-garage-btn]').forEach(function (b) {
      b.classList.toggle('has-vehicle', !!av);
      var lab = $('[data-garage-label]', b);
      if (lab) lab.textContent = av ? (b.closest('.hdr-mgarage') ? av.v.model : RM.vehicleName(av)) : (b.closest('.hdr-mgarage') ? 'Pasirinkite' : 'Pasirinkite techniką');
    });
    $$('[data-garage-dot]').forEach(function (d) { d.hidden = !av; });
    var hint = $('[data-search-hint-text]'); if (hint) hint.textContent = av ? av.v.model : 'Visos dalys';
    var list = $('[data-garage-list]');
    if (list) {
      var g = S.garage;
      if (!g.list.length) { list.innerHTML = ''; return; }
      list.innerHTML = '<p class="field__label" style="margin-top:28px">Išsaugota technika</p><div class="garage-list">' + g.list.map(function (it, i) {
        var v = vehById[it.id]; if (!v) return '';
        return '<div class="garage-item' + (i === g.active ? ' is-active' : '') + '"><span class="garage-item__icon">' + icon(v.type === 'moto' ? 'motorcycle' : 'moped') + '</span><div><p class="garage-item__name">' + esc(v.make + ' ' + v.model) + '</p><p class="garage-item__meta">' + it.year + (v.engine ? ' · ' + esc(RM.engines[v.engine]) : '') + '</p></div><div class="garage-item__actions">' +
          (i === g.active ? '<span class="badge badge--hot">Aktyvi</span>' : '<button class="btn btn--sm btn--ghost" type="button" data-gsel="' + i + '">Rinktis</button>') +
          '<button class="icon-btn" type="button" data-gdel="' + i + '">' + icon('trash') + '<span class="sr-only">Pašalinti ' + esc(v.model) + '</span></button></div></div>';
      }).join('') + '</div>' + (g.active > -1 ? '<button class="link-arrow" type="button" data-gclear style="margin-top:14px">Rodyti visas dalis, be filtro' + icon('arrow-right') + '</button>' : '');
    }
  }

  /* ---------- drawers ---------- */
  var openDrawer = null, lastFocus = null;
  var backdrop = $('[data-backdrop]');
  function setInert(on, except) {
    Array.prototype.forEach.call(doc.body.children, function (el) {
      if (el === except || el === backdrop || el.matches('[data-toast], script')) return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function open(id) {
    var d = doc.getElementById(id); if (!d) return;
    var trigger = openDrawer ? lastFocus : doc.activeElement;
    if (openDrawer) close(true);
    closePanels();
    lastFocus = trigger;
    if (id === 'cart-drawer') renderCart();
    if (id === 'wish-drawer') renderWish();
    if (id === 'garage-drawer') renderGarageUI();
    if (id === 'menu-drawer') renderMenu();
    d.classList.add('is-open'); backdrop.classList.add('is-open');
    setInert(true, d);
    openDrawer = d;
    root.classList.add('is-locked');
    if (RM.lenis) RM.lenis.stop();
    setTimeout(function () { var t = $('[tabindex="-1"]', d) || $('button, a, select, input', d); if (t) t.focus({ preventScroll: true }); }, 60);
  }
  function close(silent) {
    if (!openDrawer) return;
    openDrawer.classList.remove('is-open'); backdrop.classList.remove('is-open');
    setInert(false);
    openDrawer = null;
    if (!(qv && qv.open)) root.classList.remove('is-locked');
    if (RM.lenis) RM.lenis.start();
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  RM.openDrawer = open; RM.closeDrawer = close;
  RM.openGarage = function () { open('garage-drawer'); };

  /* ---------- menu drawer (mobile) ---------- */
  function renderMenu() {
    var body = $('[data-menu-body]'); if (!body || body.childElementCount) return;
    body.innerHTML = '<button class="btn btn--accent btn--block" type="button" data-open-garage style="margin-bottom:18px">' + icon('garage') + 'Mano garažas</button>' +
      RM.categories.map(function (c) {
        return '<details class="mmenu__group"><summary>' + icon(c.icon) + esc(c.name) + icon('caret-down') + '</summary><ul>' + c.sub.map(function (s) { return '<li><a href="' + RM.home('#kategorijos') + '">' + esc(s) + '</a></li>'; }).join('') + '</ul></details>';
      }).join('') +
      '<div class="mmenu__links"><a href="' + RM.home('#akcijos') + '" style="color:var(--c-sale)">' + icon('percent') + 'Akcijos</a><a href="' + RM.home('#verslui') + '">' + icon('briefcase') + 'Servisams ir verslui</a><a href="tel:' + RM.meta.phone + '">' + icon('phone') + RM.meta.phoneDisplay + '</a></div>' +
      '<div style="display:flex;gap:10px;margin-top:18px"><div class="seg" role="group" aria-label="Kainų rodymas"><button type="button" data-mode="b2c" aria-pressed="' + (S.mode === 'b2c') + '">Privatiems</button><button type="button" data-mode="b2b" aria-pressed="' + (S.mode === 'b2b') + '">Verslui</button></div></div>' +
      '<div class="mmenu__prefs"><div class="field"><label class="field__label" for="m-currency">Valiuta</label><select class="select" id="m-currency" data-currency><option value="EUR">EUR €</option><option value="PLN">PLN zł</option><option value="USD">USD $</option></select></div>' +
      '<div class="field"><label class="field__label" for="m-lang">Kalba</label><select class="select" id="m-lang" data-lang><option value="lt">Lietuvių</option><option value="en">English</option></select></div></div>';
    var mc = $('#m-currency', body); if (mc) mc.value = S.currency;
  }

  /* ---------- quick view ---------- */
  var qv = $('#quick-view');
  function openQV(id) {
    var p = byId[id]; if (!p || !qv) return;
    if (openDrawer) close(true);
    var av = activeVehicle(), fit = fitStatus(p, av);
    var thumbs = p.images.length > 1 ? '<div class="qv__thumbs">' + p.images.map(function (src, i) { return '<button type="button" aria-pressed="' + (i === 0) + '" data-qvimg="' + src + '"><img src="' + src + '" alt="" width="56" height="56"><span class="sr-only">Nuotrauka ' + (i + 1) + '</span></button>'; }).join('') + '</div>' : '';
    var fitHTML = fit === 'yes' ? '<p class="fit fit--yes">' + icon('check-circle-fill') + 'Tinka jūsų ' + esc(RM.vehicleName(av)) + '</p>'
      : fit === 'no' ? '<p class="fit fit--no">' + icon('warning-circle') + 'Netinka jūsų ' + esc(RM.vehicleName(av)) + '</p>'
      : fit === 'universal' ? '<p class="fit fit--yes">' + icon('check-circle') + esc(p.universal) + '</p>'
      : '<button class="link-arrow" type="button" data-open-garage>' + icon('garage') + 'Patikrinkite, ar tinka jūsų technikai</button>';
    var sizes = p.sizes ? '<div class="field"><span class="field__label">Dydis</span><div class="sp-chips" role="radiogroup" aria-label="Dydis">' + p.sizes.map(function (s) { return '<button class="chip" type="button" role="radio" aria-checked="false" data-qvsize="' + s + '">' + s + '</button>'; }).join('') + '</div></div>' : '';
    $('[data-qv-body]', qv).innerHTML = '<div class="qv"><div class="qv__media"><img src="' + p.images[0] + '" alt="' + esc(p.title) + '" data-qvmain width="600" height="600">' + thumbs + '<div class="pcard__badges">' + badgesHTML(p) + '</div></div>' +
      '<div class="qv__info"><div class="pcard__meta"><span class="pcard__brand">' + esc(p.brand) + '</span><span class="pcard__sku">' + esc(p.sku) + '</span></div><h2 class="h3" id="qv-title">' + esc(p.title) + '</h2>' +
      (p.condition === 'used' ? gradeHTML(p.grade) + (p.note ? '<p class="muted" style="font-size:.9rem">' + esc(p.note) + '</p>' : '') + (p.donor ? '<p class="muted" style="font-size:.9rem">Išimta iš: ' + esc(p.donor) + '</p>' : '') : (p.rating ? '<span class="pcard__rating">' + stars(p.rating) + '<span>' + String(p.rating).replace('.', ',') + ' (' + p.reviews + ' ' + plural(p.reviews, 'atsiliepimas', 'atsiliepimai', 'atsiliepimų') + ')</span></span>' : '')) +
      priceHTML(p) + fitHTML + sizes + stockHTML(p) +
      '<div style="display:flex;gap:10px;margin-top:6px"><button class="btn btn--accent" style="flex:1" type="button" data-qvadd="' + p.id + '">' + icon('shopping-cart-simple') + 'Į krepšelį</button>' +
      '<button class="icon-btn icon-btn--round" type="button" style="width:52px;height:52px" aria-pressed="' + (S.wish.indexOf(p.id) > -1) + '" data-wish="' + p.id + '">' + icon(S.wish.indexOf(p.id) > -1 ? 'heart-fill' : 'heart') + '<span class="sr-only">Įsiminti</span></button></div>' +
      (p.pdp ? '<a class="link-arrow" href="' + p.pdp + '">Visa prekės informacija' + icon('arrow-right') + '</a>' : '<p class="qv__note">Demo: pilnas prekės puslapis sukurtas vienai prekei (stabdžių diskas NG Brake Disc).</p>') +
      '</div></div>';
    if (!qv.open) qv.showModal();
    root.classList.add('is-locked');
    if (RM.lenis) RM.lenis.stop();
  }
  RM.openQV = openQV;
  if (qv) {
    qv.addEventListener('close', function () { if (!openDrawer) root.classList.remove('is-locked'); if (RM.lenis) RM.lenis.start(); });
    qv.addEventListener('click', function (e) {
      if (e.target === qv) { qv.close(); return; }
      var t = e.target.closest('[data-qvimg]');
      if (t) { $('[data-qvmain]', qv).src = t.getAttribute('data-qvimg'); $$('[data-qvimg]', qv).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); }); }
      var s = e.target.closest('[data-qvsize]');
      if (s) $$('[data-qvsize]', qv).forEach(function (b) { b.setAttribute('aria-checked', String(b === s)); b.classList.toggle('is-active', b === s); });
      var a = e.target.closest('[data-qvadd]');
      if (a) {
        var p = byId[+a.getAttribute('data-qvadd')];
        var sel = $('[data-qvsize].is-active', qv);
        if (p.sizes && !sel) { toast('Pasirinkite dydį', 'warning-circle'); var g = $('[role="radiogroup"]', qv); if (g && !reduced) g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 320 }); return; }
        if (RM.addToCart(p.id, 1, sel ? 'Dydis ' + sel.getAttribute('data-qvsize') : '')) qv.close();
      }
    });
  }

  /* ---------- global clicks ---------- */
  doc.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-open]'))) { e.preventDefault(); open(t.getAttribute('data-open')); return; }
    if ((t = e.target.closest('[data-open-garage]'))) { e.preventDefault(); if (qv && qv.open) qv.close(); open('garage-drawer'); return; }
    if ((t = e.target.closest('[data-close]')) || e.target === backdrop) { close(); return; }
    if ((t = e.target.closest('[data-dialog-close]'))) { var dl = t.closest('dialog'); if (dl) dl.close(); return; }
    if ((t = e.target.closest('[data-wish]'))) {
      e.preventDefault();
      var id = +t.getAttribute('data-wish'); var on = RM.toggleWish(id);
      $$('[data-wish="' + id + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(on)); var u = $('use', b); if (u) u.setAttribute('href', '#i-' + (on ? 'heart-fill' : 'heart')); });
      return;
    }
    if ((t = e.target.closest('[data-qv]'))) { e.preventDefault(); openQV(+t.getAttribute('data-qv')); return; }
    if ((t = e.target.closest('[data-add]'))) {
      e.preventDefault();
      var pid = +t.getAttribute('data-add');
      if (t.hasAttribute('data-needs-size')) { openQV(pid); return; }
      if (RM.addToCart(pid, 1)) {
        var u2 = $('use', t);
        if (u2 && !t.hasAttribute('data-icon')) t.setAttribute('data-icon', u2.getAttribute('href'));
        t.classList.add('is-done'); if (u2) u2.setAttribute('href', '#i-check');
        clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('is-done'); if (u2) u2.setAttribute('href', t.getAttribute('data-icon')); }, 1600);
      }
      return;
    }
    if ((t = e.target.closest('[data-qty]'))) {
      var l = S.cart[+t.getAttribute('data-qty')]; if (!l) return;
      var qi = t.getAttribute('data-qty'), qd = t.getAttribute('data-d');
      l.qty = Math.max(1, Math.min(99, l.qty + (+qd))); saveCart();
      refocus('[data-qty="' + qi + '"][data-d="' + qd + '"]'); return;
    }
    if ((t = e.target.closest('[data-remove]'))) { var ri = +t.getAttribute('data-remove'); S.cart.splice(ri, 1); saveCart(); refocus('[data-remove="' + Math.min(ri, S.cart.length - 1) + '"]', '#cart-title'); return; }
    if ((t = e.target.closest('[data-gsel]'))) { RM.setActiveVehicle(+t.getAttribute('data-gsel')); refocus('#garage-title'); return; }
    if ((t = e.target.closest('[data-gdel]'))) { RM.removeVehicle(+t.getAttribute('data-gdel')); refocus('[data-gdel]', '#garage-title'); return; }
    if ((t = e.target.closest('[data-gclear]'))) { RM.clearActive(); toast('Rodomos visos dalys'); return; }
    if ((t = e.target.closest('[data-mode]'))) {
      S.mode = t.getAttribute('data-mode'); store.set('mode', S.mode);
      $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
      emit('price');
      toast(S.mode === 'b2b' ? 'Rodomos verslo kainos be PVM (demo kainų grupė „Servisas“, −15 %)' : 'Rodomos mažmeninės kainos su PVM', S.mode === 'b2b' ? 'briefcase' : 'check-circle-fill');
      return;
    }
    if ((t = e.target.closest('[data-demo]'))) { e.preventDefault(); toast(t.getAttribute('data-demo') || 'Demo: šis puslapis bus sukurtas kitame etape', 'info'); return; }
  });
  function refocus(sel, fallback) {
    var scope = openDrawer || doc;
    var el = (sel && $(sel, scope)) || (fallback && $(fallback, scope));
    if (el) el.focus({ preventScroll: true });
  }
  RM.refocus = refocus;
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (openDrawer) close(); closePanels(); }
  });

  $$('[data-currency]').forEach(function (c) { c.value = S.currency; });
  doc.addEventListener('change', function (e) {
    var c = e.target.closest('[data-currency]');
    if (c) { S.currency = c.value; store.set('currency', S.currency); $$('[data-currency]').forEach(function (x) { x.value = S.currency; }); emit('price'); toast('Kainos rodomos: ' + c.value + ' (orientacinis kursas, demo)', 'currency-eur'); return; }
    var l = e.target.closest('[data-lang]');
    if (l && l.value === 'en') { toast('EN versija: vertimas bus įgyvendintas su TranslatePress arba WPML', 'globe'); l.value = 'lt'; }
  });
  $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });

  /* ---------- header: sticky behaviour ---------- */
  var header = $('[data-header]');
  function measureHeader() {
    if (!header) return;
    var r = header.getBoundingClientRect();
    root.style.setProperty('--hdr-bottom', Math.max(0, r.bottom) + 'px');
  }
  var lastY = window.scrollY, ticking = false;
  function onScroll(y) {
    if (!header) return;
    var down = y > lastY + 4, up = y < lastY - 4;
    header.classList.toggle('is-condensed', y > 200);
    var mbar = $('[data-mbar]');
    if (mbar && !doc.body.classList.contains('page-pdp')) { if (y > 300 && down) mbar.classList.add('is-hidden'); else if (up) mbar.classList.remove('is-hidden'); }
    lastY = y;
    measureHeader();
  }
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScroll(window.scrollY); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', measureHeader);

  /* ---------- topbar rotator ---------- */
  var rot = $('[data-rotator]');
  if (rot && !reduced) {
    var items = $$('span', rot), ri = 0, paused = false;
    rot.parentNode.addEventListener('mouseenter', function () { paused = true; });
    rot.parentNode.addEventListener('mouseleave', function () { paused = false; });
    rot.closest('.topbar').addEventListener('focusin', function () { paused = true; });
    rot.closest('.topbar').addEventListener('focusout', function () { paused = false; });
    setInterval(function () { if (paused || doc.hidden) return; items[ri].classList.remove('is-on'); ri = (ri + 1) % items.length; items[ri].classList.add('is-on'); }, 4800);
  }

  /* ---------- mega menu ---------- */
  var mega = $('[data-mega]'), megaBtn = $('[data-mega-toggle]');
  function renderMega() {
    if (!mega || mega.childElementCount) return;
    var rail = RM.categories.map(function (c, i) {
      return '<button type="button" role="tab" id="mt-' + c.slug + '" aria-controls="mp-' + c.slug + '" aria-selected="' + (i === 0) + '" data-mtab="' + c.slug + '"' + (c.used ? ' style="color:var(--c-used)"' : '') + '>' + icon(c.icon) + esc(c.name) + icon('caret-right') + '</button>';
    }).join('');
    var panels = RM.categories.map(function (c, i) {
      return '<div class="mega__panel' + (i === 0 ? ' is-on' : '') + '" role="tabpanel" id="mp-' + c.slug + '" aria-labelledby="mt-' + c.slug + '"><div class="mega__panel-head"><p class="h3">' + esc(c.name) + '</p><a class="link-arrow" href="' + RM.home('#kategorijos') + '">Žiūrėti visas' + icon('arrow-right') + '</a></div>' +
        '<div class="mega__cols">' + c.sub.map(function (s) { return '<a href="' + RM.home('#kategorijos') + '">' + esc(s) + icon('arrow-up-right', 'i--sm') + '</a>'; }).join('') + '</div>' +
        '<p class="sp-title" style="margin-top:28px">Pagal variklio platformą</p><div class="sp-chips">' + Object.keys(RM.engines).slice(0, 8).map(function (k) { return '<a class="chip" href="' + (isHome ? '#prekes' : 'index.html?variklis=' + k + '#prekes') + '" data-engine-pick="' + k + '">' + esc(RM.engines[k]) + '</a>'; }).join('') + '</div></div>';
    }).join('');
    mega.innerHTML = '<div class="container" style="padding-inline:0"><div class="mega__inner"><div class="mega__rail" role="tablist" aria-orientation="vertical" aria-label="Kategorijos">' + rail + '</div><div>' + panels + '</div>' +
      '<a class="mega__promo on-dark" href="' + RM.home('#naudotos') + '"><img src="assets/media/used-parts.jpg" alt="" loading="lazy" width="600" height="800"><span class="badge badge--used">' + icon('recycle') + 'Naudotos dalys</span><p class="h3">Originalios dalys iš išardytos technikos</p><span class="link-arrow">Žiūrėti naudotas dalis' + icon('arrow-right') + '</span></a></div></div>';
    mega.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-mtab]'); if (b && finePointer) selectTab(b); });
    mega.addEventListener('click', function (e) { var b = e.target.closest('[data-mtab]'); if (b) selectTab(b); if (e.target.closest('a')) closePanels(); });
    mega.addEventListener('keydown', function (e) {
      var b = e.target.closest('[data-mtab]'); if (!b) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); var tabs = $$('[data-mtab]', mega); var i = tabs.indexOf(b) + (e.key === 'ArrowDown' ? 1 : -1);
        var n = tabs[(i + tabs.length) % tabs.length]; n.focus(); selectTab(n);
      }
    });
  }
  function selectTab(b) {
    $$('[data-mtab]', mega).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    $$('.mega__panel', mega).forEach(function (p) { p.classList.toggle('is-on', p.id === 'mp-' + b.getAttribute('data-mtab')); });
  }
  var megaTimer, hoverAt = 0;
  function openMega() {
    renderMega(); closeSearch();
    mega.classList.add('is-open'); megaBtn.setAttribute('aria-expanded', 'true'); header.classList.add('has-panel'); measureHeader();
  }
  RM.openMega = function () { if (megaBtn) openMega(); };
  function closeMega() { if (!mega) return; if (mega.contains(doc.activeElement) && megaBtn) megaBtn.focus(); mega.classList.remove('is-open'); if (megaBtn) megaBtn.setAttribute('aria-expanded', 'false'); if (!searchOpen) header.classList.remove('has-panel'); }
  if (megaBtn) {
    megaBtn.addEventListener('click', function () {
      if (mega.classList.contains('is-open')) { if (Date.now() - hoverAt > 700) closeMega(); }
      else openMega();
    });
    var zone = megaBtn.closest('.hdr-sub');
    if (finePointer) {
      megaBtn.addEventListener('mouseenter', function () { clearTimeout(megaTimer); megaTimer = setTimeout(function () { if (!mega.classList.contains('is-open')) { hoverAt = Date.now(); openMega(); } }, 140); });
      megaBtn.addEventListener('mouseleave', function () { clearTimeout(megaTimer); });
      zone.addEventListener('mouseleave', function () { clearTimeout(megaTimer); megaTimer = setTimeout(closeMega, 220); });
      mega.addEventListener('mouseenter', function () { clearTimeout(megaTimer); });
    }
    $$('[data-mega-open]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openMega(); }); });
  }
  var scrim = $('[data-header-scrim]');
  if (scrim) scrim.addEventListener('click', closePanels);
  function closePanels() { closeMega(); closeSearch(); }

  /* ---------- predictive search ---------- */
  var panel = $('[data-search-panel]'), results = $('[data-search-results]'), status = $('[data-search-status]');
  var searchOpen = false, activeIdx = -1;
  var index = RM.products.map(function (p) {
    var veh = RM.fitList(p).map(function (o) { return o.v.make + ' ' + o.v.model; }).join(' ');
    var eng = (p.engines || []).map(function (e) { return RM.engines[e]; }).join(' ');
    return { p: p, hay: norm([p.title, p.brand, p.sku, (p.oem || []).join(' '), p.sub, RM.category(p.cat).name, veh, eng, p.condition === 'used' ? 'naudota naudotas naudotos' : 'nauja'].join(' ')), code: norm((p.oem || []).concat(p.sku).join(' ')).replace(/ /g, '') };
  });
  var POPULAR = ['Aerox cilindras', 'Stabdžių kaladėlės', 'NGK BR8HS', 'Variklio alyva', 'Naudotas variklis', 'MT-07'];
  function mark(text, q) {
    var words = norm(q).split(' ').filter(Boolean); if (!words.length) return esc(text);
    var src = String(text);
    // kiekvienas simbolis normalizuojamas atskirai, kad indeksai sutaptų su originalu (ą -> a)
    var n = src.split('').map(function (ch) { return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().charAt(0) || ch; }).join('');
    var ranges = [];
    words.forEach(function (w) { var i = n.indexOf(w); if (i > -1) ranges.push([i, i + w.length]); });
    if (!ranges.length) return esc(text);
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    ranges.forEach(function (r) { if (r[0] < pos) return; out += esc(src.slice(pos, r[0])) + '<mark class="sp-mark">' + esc(src.slice(r[0], r[1])) + '</mark>'; pos = r[1]; });
    return out + esc(src.slice(pos));
  }
  function search(q) {
    var words = norm(q).split(' ').filter(Boolean);
    var compact = norm(q).replace(/ /g, '');
    var av = activeVehicle();
    var hits = index.filter(function (it) {
      if (compact.length >= 4 && it.code.indexOf(compact) > -1) return true;
      return words.every(function (w) { return it.hay.indexOf(w) > -1; });
    }).map(function (it) { return it.p; });
    if (av) hits.sort(function (a, b) { var fa = fitStatus(a, av), fb = fitStatus(b, av); return (fb === 'yes') - (fa === 'yes'); });
    return hits;
  }
  RM.search = search;
  function renderSearch(q) {
    activeIdx = -1;
    var av = activeVehicle();
    if (!q || norm(q).length < 2) {
      var recents = S.recent.slice(0, 4);
      results.innerHTML = '<div><p class="sp-title">Populiarios paieškos</p><div class="sp-chips">' + POPULAR.map(function (s) { return '<button class="chip" type="button" data-sq="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>' +
        (recents.length ? '<p class="sp-title" style="margin-top:24px">Neseniai ieškota</p><div class="sp-list">' + recents.map(function (s) { return '<a href="#" data-sq="' + esc(s) + '">' + icon('clock-counter-clockwise') + esc(s) + '</a>'; }).join('') + '</div>' : '') +
        '<p class="sp-title" style="margin-top:24px">Paieška pagal OEM kodą</p><p class="muted" style="font-size:.875rem">Įveskite originalų gamintojo kodą, pvz. <button class="chip" type="button" data-sq="1WS-F582U-00" style="min-height:30px">1WS-F582U-00</button></p></div>' +
        '<div><p class="sp-title">' + (av ? 'Populiaru tarp ' + esc(av.v.make + ' ' + av.v.model) + ' savininkų' : 'Perkamiausios dalys') + '</p><div class="sp-products">' + RM.collections.bestseller.map(function (id) { return byId[id]; }).filter(function (p) { return !av || fitStatus(p, av) !== 'no'; }).slice(0, 6).map(spProd.bind(null, '')).join('') + '</div></div>';
      ariaOptions();
      status.textContent = '';
      return;
    }
    var hits = search(q);
    var cats = RM.categories.filter(function (c) { var n = norm(c.name + ' ' + c.sub.join(' ')); return norm(q).split(' ').every(function (w) { return n.indexOf(w) > -1; }); }).slice(0, 5);
    var vehs = RM.vehicles.filter(function (v) { return norm(v.make + ' ' + v.model).indexOf(norm(q)) > -1 || norm(v.model).replace(/ /g, '').indexOf(norm(q).replace(/ /g, '')) > -1; }).slice(0, 4);
    var left = '';
    if (vehs.length) left += '<p class="sp-title">Technika</p><div class="sp-list">' + vehs.map(function (v) { return '<a href="#" data-pickveh="' + v.id + '">' + icon(v.type === 'moto' ? 'motorcycle' : 'moped') + mark(v.make + ' ' + v.model, q) + '</a>'; }).join('') + '</div>';
    if (cats.length) left += '<p class="sp-title" style="margin-top:20px">Kategorijos</p><div class="sp-list">' + cats.map(function (c) { return '<a href="' + RM.home('#kategorijos') + '">' + icon(c.icon) + mark(c.name, q) + '</a>'; }).join('') + '</div>';
    if (!left) left = '<p class="sp-title">Patarimas</p><p class="muted" style="font-size:.875rem">Ieškokite pagal dalį, gamintoją, modelį (pvz. „aerox“) arba OEM kodą.</p>';
    var right = hits.length
      ? '<p class="sp-title">Prekės (' + hits.length + ')</p><div class="sp-products">' + hits.slice(0, 9).map(spProd.bind(null, q)).join('') + '</div><div class="sp-foot"><a class="link-arrow" href="#" data-demo="Paieškos rezultatų puslapis bus kitame etape">Rodyti visus rezultatus' + icon('arrow-right') + '</a></div>'
      : '<p class="sp-empty">Pagal „' + esc(q) + '“ nieko neradome. Pabandykite trumpesnį žodį arba OEM kodą.</p><div class="sp-chips">' + POPULAR.slice(0, 4).map(function (s) { return '<button class="chip" type="button" data-sq="' + esc(s) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    results.innerHTML = '<div>' + left + '</div><div>' + right + '</div>';
    ariaOptions();
    status.textContent = hits.length ? 'Rasta prekių: ' + hits.length : 'Nieko nerasta';
  }
  function ariaOptions() {
    $$('[data-search-input]').forEach(function (i) { i.removeAttribute('aria-activedescendant'); });
    $$('.sp-products, .sp-list', results).forEach(function (g) { g.setAttribute('role', 'listbox'); g.setAttribute('aria-label', 'Paieškos pasiūlymai'); });
    $$('.sp-prod, .sp-list a', results).forEach(function (el, i) { el.id = 'sp-opt-' + i; el.setAttribute('role', 'option'); el.setAttribute('aria-selected', 'false'); });
  }
  function spProd(q, p) {
    var av = activeVehicle(), fit = fitStatus(p, av);
    var fitTxt = fit === 'yes' ? '<span class="fit fit--yes">' + icon('check-circle-fill') + 'Tinka</span>' : fit === 'no' ? '<span class="fit fit--no">Netinka</span>' : '';
    return '<a class="sp-prod" href="' + (p.pdp || '#') + '"' + (p.pdp ? '' : ' data-qv="' + p.id + '"') + '><img src="' + p.images[0] + '" alt="" width="72" height="72" loading="lazy"><div><p class="sp-prod__title">' + mark(p.title, q) + '</p><p class="sp-prod__meta"><span class="sp-prod__price num">' + money(shown(p.price)) + '</span><span class="mono">' + mark(p.sku, q) + '</span>' + fitTxt + '</p></div></a>';
  }
  function openSearch() {
    if (!panel) return;
    closeMega();
    if (!searchOpen) { var inp = activeInput(); renderSearch(inp ? inp.value : ''); }
    searchOpen = true; panel.classList.add('is-open'); header.classList.add('has-panel', 'is-searching'); measureHeader();
    $$('[data-search-input]').forEach(function (i) { i.setAttribute('aria-expanded', 'true'); });
    if (window.innerWidth < 1024) { setTimeout(function () { var m = $('#search-q-m'); if (m) m.focus(); }, 50); if (RM.lenis) RM.lenis.stop(); doc.body.style.overflow = 'hidden'; }
  }
  function closeSearch() {
    if (!searchOpen) return;
    searchOpen = false; panel.classList.remove('is-open'); header.classList.remove('is-searching');
    if (!mega || !mega.classList.contains('is-open')) header.classList.remove('has-panel');
    $$('[data-search-input]').forEach(function (i) { i.setAttribute('aria-expanded', 'false'); i.removeAttribute('aria-activedescendant'); });
    doc.body.style.overflow = ''; if (RM.lenis) RM.lenis.start();
  }
  RM.openSearch = openSearch;
  function activeInput() { return window.innerWidth < 1024 ? $('#search-q-m') : $('#hdr-q'); }
  var sTimer;
  $$('[data-search-input]').forEach(function (inp) {
    inp.addEventListener('focus', openSearch);
    inp.addEventListener('input', function () { clearTimeout(sTimer); sTimer = setTimeout(function () { renderSearch(inp.value); }, 110); if (!searchOpen) openSearch(); });
    inp.addEventListener('keydown', function (e) {
      var items = $$('.sp-prod, .sp-list a', results);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (x, i) { x.classList.toggle('is-active', i === activeIdx); x.setAttribute('aria-selected', String(i === activeIdx)); });
        inp.setAttribute('aria-activedescendant', items[activeIdx].id);
        items[activeIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && activeIdx > -1 && items[activeIdx]) { e.preventDefault(); items[activeIdx].click(); }
    });
  });
  $$('[data-search-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('input', f).value.trim(); if (!v) return;
      S.recent = [v].concat(S.recent.filter(function (x) { return x !== v; })).slice(0, 6); store.set('recent', S.recent);
      renderSearch(v);
    });
  });
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  var sClose = $('[data-search-close]'); if (sClose) sClose.addEventListener('click', closeSearch);
  if (results) results.addEventListener('click', function (e) {
    var t = e.target.closest('[data-sq]');
    if (t) { e.preventDefault(); var inp = activeInput(); inp.value = t.getAttribute('data-sq'); renderSearch(inp.value); inp.focus(); return; }
    var v = e.target.closest('[data-pickveh]');
    if (v) { e.preventDefault(); closeSearch(); var veh = vehById[v.getAttribute('data-pickveh')]; open('garage-drawer'); var f = $('[data-vpick="garage"]'); if (f && veh) { $('[data-vtype="' + veh.type + '"]', f).click(); var mk = $('[data-vmake]', f); mk.value = veh.make; mk.dispatchEvent(new Event('change')); var md = $('[data-vmodel]', f); md.value = veh.id; md.dispatchEvent(new Event('change')); $('[data-vyear]', f).focus(); } return; }
    if (e.target.closest('a[href^="#"]:not([data-qv]):not([data-demo])')) closeSearch();
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea|select/i.test(doc.activeElement.tagName) && window.innerWidth >= 1024) { e.preventDefault(); var i = $('#hdr-q'); if (i) i.focus(); }
  });
  doc.addEventListener('click', function (e) {
    if (searchOpen && !e.target.closest('[data-search-panel], [data-search-form], [data-open-search], [data-toast]') && !e.target.closest('#quick-view')) closeSearch();
  });

  /* ---------- carousel ---------- */
  function initCarousel(el) {
    var track = $('.carousel__track', el); if (!track || track._init) return; track._init = true;
    var bar = $('.carousel__bar span', el), prev = $('[data-prev]', el), next = $('[data-next]', el);
    function upd() {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = track.clientWidth / track.scrollWidth;
      if (bar) { bar.style.width = (ratio * 100) + '%'; bar.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * (1 / ratio - 1) * 100 : 0) + '%)'; }
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    }
    function step(d) { var card = track.firstElementChild; var w = card ? card.getBoundingClientRect().width + 16 : 300; track.scrollBy({ left: d * w * (window.innerWidth < 768 ? 1 : 2), behavior: reduced ? 'auto' : 'smooth' }); }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    if (finePointer) {
      var down = false, sx = 0, sl = 0, moved = false;
      track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
      window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); } track.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { track.classList.remove('is-dragging'); }, 0); });
      track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
    track.setAttribute('tabindex', '0');
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
    requestAnimationFrame(upd);
    el._update = upd;
  }
  RM.initCarousel = initCarousel;

  /* ---------- motion ---------- */
  function initMotion() {
    var M = window.Motion;
    if (!M || reduced) return;
    root.classList.add('motion-ok');
    if (window.Lenis && finePointer) {
      RM.lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1 });
      (function raf(t) { RM.lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2 || a.hasAttribute('data-demo') || a.hasAttribute('data-qv')) return;
          var target = $(id); if (!target) return;
          e.preventDefault(); closePanels(); RM.lenis.scrollTo(target, { offset: -130 });
        });
      });
    }
    RM.reveal(doc);
    $$('[data-parallax]').forEach(function (el) {
      var f = parseFloat(el.getAttribute('data-parallax')) || 0.12;
      var target = el.closest('[data-parallax-root]') || el.parentElement;
      var anim = M.animate(el, { y: [(-f * 50) + '%', (f * 50) + '%'] }, { ease: 'linear', duration: 1 });
      M.scroll(anim, { target: target, offset: ['start end', 'end start'] });
    });
    $$('[data-zoom-parallax]').forEach(function (el) {
      var anim = M.animate(el, { scale: [1.16, 1] }, { ease: 'linear', duration: 1 });
      M.scroll(anim, { target: el.parentElement, offset: ['start end', 'end end'] });
    });
    $$('[data-count-to]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count-to')); var suffix = el.getAttribute('data-suffix') || '';
      M.inView(el, function () {
        M.animate(0, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: function (v) { el.textContent = Math.round(v).toLocaleString('lt-LT') + suffix; } });
      }, { amount: 0.6 });
    });
  }
  RM.reveal = function (scope) {
    var M = window.Motion;
    if (!M || !root.classList.contains('motion-ok')) return;
    $$('[data-split]:not([data-split-done])', scope).forEach(function (h) {
      h.setAttribute('data-split-done', '');
      var parts = h.innerHTML.split(/<br\s*\/?>/i);
      h.innerHTML = parts.map(function (p) { return '<span class="split-line"><span>' + p + '</span></span>'; }).join('');
      M.inView(h, function () {
        M.animate($$('.split-line > span', h), { y: ['105%', '0%'] }, { duration: 0.9, delay: M.stagger(0.08), ease: [0.16, 1, 0.3, 1] });
      }, { amount: 0.4 });
    });
    $$('[data-reveal]:not([data-reveal-done])', scope).forEach(function (el) {
      el.setAttribute('data-reveal-done', '');
      M.inView(el, function () {
        if (el.getAttribute('data-reveal') === 'clip') M.animate(el, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.1, ease: [0.65, 0, 0.35, 1] });
        else M.animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
      }, { amount: 0.2 });
    });
    $$('[data-reveal-stagger]:not([data-reveal-done])', scope).forEach(function (el) {
      el.setAttribute('data-reveal-done', '');
      M.inView(el, function () {
        M.animate(Array.prototype.slice.call(el.children), { opacity: [0, 1], y: [22, 0] }, { duration: 0.7, delay: M.stagger(0.06), ease: [0.16, 1, 0.3, 1] });
      }, { amount: 0.15 });
    });
  };

  /* ---------- reactions to state ---------- */
  RM.on(function (what) {
    renderCounts();
    if (what === 'cart' || what === 'price') { if (openDrawer && openDrawer.id === 'cart-drawer') renderCart(); }
    if (what === 'garage') renderGarageUI();
    if (what === 'wish' && openDrawer && openDrawer.id === 'wish-drawer') renderWish();
    if (searchOpen) { var i = activeInput(); renderSearch(i ? i.value : ''); }
  });

  /* ---------- boot ---------- */
  var gform = $('[data-vpick="garage"]');
  if (gform) initPicker(gform, function (id, year) { RM.addVehicle(id, year); });
  renderCounts();
  renderGarageUI();
  measureHeader();
  $$('.carousel').forEach(initCarousel);
  if (doc.readyState === 'complete') initMotion(); else window.addEventListener('load', initMotion);
})();
