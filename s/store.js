/* OwnBill shop catalogue page. Only the publishable key is here: the server
 * function public_store returns one shop's chosen items for a valid,
 * switched-on link token and nothing else. The order goes to the shop on
 * WhatsApp; nothing is stored, no cookies, no tracking. */
(function () {
  'use strict';
  var CONFIG = { supabaseUrl: 'https://lkurxhcdvrvlahdjtivp.supabase.co', publishableKey: 'sb_publishable_nceVqyl2Q9fwgqk51AA85w_KDgQWANu' };
  var data = null, cart = {}, cat = '', q = '';

  function $(id) { return document.getElementById(id); }
  function show(id) { ['loading', 'gone', 'offline', 'page'].forEach(function (k) { $(k).hidden = k !== id; }); }
  function token() { var m = /[?&]t=([A-Za-z0-9_-]{22,64})(?:&|$)/.exec(location.search); return m ? m[1] : ''; }
  function group(s) { if (s.length <= 3) return s; var last = s.slice(-3), rest = s.slice(0, -3); return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last; }
  function money(p) {
    if (p === null || p === undefined) return '';
    var r = Math.round(p) / 100, whole = Math.floor(Math.abs(r)), paise = Math.round((Math.abs(r) - whole) * 100);
    return '₹' + group(String(whole)) + (paise ? '.' + String(paise).padStart(2, '0') : '');
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }

  function waNumber(phone) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length === 10) d = '91' + d;
    if (d.length === 11 && d.charAt(0) === '0') d = '91' + d.slice(1);
    return d.length >= 11 ? d : '';
  }

  function renderBar() {
    var lines = [], total = 0, count = 0;
    data.items.forEach(function (it) {
      var n = cart[it.id] || 0;
      if (!n) return;
      count += n;
      if (data.prices && it.rate) total += n * it.rate;
      lines.push(n + ' × ' + it.name + (it.unit && it.unit !== 'pc' ? ' (' + it.unit + ')' : '') + (data.prices && it.rate ? ' — ' + money(n * it.rate) : ''));
    });
    var num = waNumber(data.business.phone);
    $('bar').hidden = !num;
    $('sum').textContent = count ? count + ' item' + (count > 1 ? 's' : '') + (data.prices ? ' · about ' + money(total) : '') : 'Tap + on items to make your order';
    var text = 'Hello ' + data.business.name + ', I would like to order:\n' + lines.join('\n') + (data.prices && total ? '\n\nTotal about ' + money(total) : '') + '\n\nMy name: ';
    var a = $('send');
    a.setAttribute('aria-disabled', count ? 'false' : 'true');
    a.href = count && num ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(text) : '#';
  }

  function qtyBox(it) {
    var box = el('div', 'q'), n = cart[it.id] || 0;
    if (!n) {
      var add = el('button', 'add', 'Add');
      add.type = 'button';
      add.setAttribute('aria-label', 'Add ' + it.name);
      add.addEventListener('click', function () { cart[it.id] = 1; renderItems(); });
      box.appendChild(add);
      return box;
    }
    var minus = el('button', '', '−'), plus = el('button', '', '+');
    minus.type = plus.type = 'button';
    minus.setAttribute('aria-label', 'One less ' + it.name);
    plus.setAttribute('aria-label', 'One more ' + it.name);
    minus.addEventListener('click', function () { cart[it.id] = Math.max(0, n - 1); if (!cart[it.id]) delete cart[it.id]; renderItems(); });
    plus.addEventListener('click', function () { cart[it.id] = n + 1; renderItems(); });
    box.appendChild(minus); box.appendChild(el('b', '', String(n))); box.appendChild(plus);
    return box;
  }

  function renderItems() {
    var root = $('items');
    root.textContent = '';
    var ql = q.toLowerCase(), groups = {}, order = [];
    data.items.forEach(function (it) {
      if (cat && (it.category || 'Other') !== cat) return;
      if (ql && (it.name + ' ' + (it.local_name || '')).toLowerCase().indexOf(ql) < 0) return;
      var c = it.category || 'Other';
      if (!groups[c]) { groups[c] = []; order.push(c); }
      groups[c].push(it);
    });
    if (!order.length) { root.appendChild(el('p', 'empty', 'No items match.')); renderBar(); return; }
    order.forEach(function (c) {
      if (order.length > 1 || c !== 'Other') root.appendChild(el('h2', '', c));
      var list = el('div', 'list');
      groups[c].forEach(function (it) {
        var row = el('div', 'it'), g = el('div', 'grow');
        g.appendChild(el('span', 'n', it.name));
        var sub = [it.local_name, it.about].filter(Boolean).join(' · ');
        if (sub) g.appendChild(el('span', 'd', sub));
        if (it.out) g.appendChild(el('span', 'out', 'Out of stock'));
        row.appendChild(g);
        if (data.prices && it.rate) {
          var pr = el('div');
          pr.appendChild(el('span', 'p', money(it.rate) + (it.unit && it.unit !== 'pc' ? '/' + it.unit : '')));
          if (it.mrp && it.mrp > it.rate) pr.appendChild(el('span', 'mrp', 'MRP ' + money(it.mrp)));
          row.appendChild(pr);
        }
        if (!it.out) row.appendChild(qtyBox(it));
        list.appendChild(row);
      });
      root.appendChild(list);
    });
    renderBar();
  }

  function renderCats() {
    var cats = [];
    data.items.forEach(function (it) { var c = it.category || 'Other'; if (cats.indexOf(c) < 0) cats.push(c); });
    var box = $('cats');
    box.textContent = '';
    if (cats.length < 2) return;
    [''].concat(cats).forEach(function (c) {
      var b = el('button', '', c || 'All');
      b.type = 'button';
      b.setAttribute('aria-pressed', c === cat ? 'true' : 'false');
      b.addEventListener('click', function () { cat = c; renderCats(); renderItems(); });
      box.appendChild(b);
    });
  }

  function render(d) {
    data = d;
    document.title = d.business.name;
    $('biz').textContent = d.business.name;
    $('sub').textContent = [d.business.local_name, d.business.address].filter(Boolean).join(' · ');
    if (d.note) { $('note').textContent = d.note; $('note').hidden = false; }
    renderCats();
    renderItems();
    show('page');
  }

  function load() {
    var t = token();
    if (!t) return show('gone');
    show('loading');
    fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/public_store', {
      method: 'POST', headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: t }), cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer'
    }).then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (d) { if (!d || !d.ok) return show('gone'); render(d); })
      .catch(function () { show('offline'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('retry').addEventListener('click', load);
    $('q').addEventListener('input', function (e) { q = e.target.value || ''; renderItems(); });
    load();
  });
})();
