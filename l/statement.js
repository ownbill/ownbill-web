/* OwnBill customer statement page.
 * The pure helpers at the top are also loaded by ../test_render.js (Node).
 * Only the publishable key is here: the server function public_statement
 * returns one customer's statement for a valid, switched-on link token and
 * nothing else. No tracking, no cookies, no storage. */
(function (root) {
  'use strict';

  var CONFIG = {
    supabaseUrl: 'https://lkurxhcdvrvlahdjtivp.supabase.co',
    publishableKey: 'sb_publishable_nceVqyl2Q9fwgqk51AA85w_KDgQWANu'
  };

  // Mirrors the app's country packs (lib/domain/money.dart).
  var PACKS = {
    IN: { symbol: '₹', indian: true, minor: 2 },
    US: { symbol: '$', minor: 2 },
    GB: { symbol: '£', minor: 2 },
    AE: { symbol: 'AED ', minor: 2 },
    AU: { symbol: 'A$', minor: 2 },
    CA: { symbol: 'C$', minor: 2 },
    ID: { symbol: 'Rp', minor: 0, sep: '.', dec: ',' }
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MINUS = '−';

  function packOf(country) { return PACKS[country] || PACKS.IN; }

  function group(s, indian, sep) {
    if (s.length <= 3) return s;
    var last = s.slice(-3), rest = s.slice(0, -3), size = indian ? 2 : 3, parts = [];
    while (rest.length > size) { parts.unshift(rest.slice(-size)); rest = rest.slice(0, -size); }
    if (rest) parts.unshift(rest);
    return parts.join(sep) + sep + last;
  }

  /** Money in minor units (paise) → "₹1,23,456" or "₹3,980.50". Paise show only when not zero. */
  function fmtMoney(minor, country) {
    var p = packOf(country);
    var v = Math.abs(Math.round(Number(minor) || 0));
    var div = p.minor === 0 ? 1 : 100;
    var whole = Math.floor(v / div), frac = v % div;
    var s = group(String(whole), !!p.indian, p.sep || ',');
    if (p.minor > 0 && frac !== 0) s += (p.dec || '.') + (frac < 10 ? '0' : '') + frac;
    return (minor < 0 ? MINUS : '') + p.symbol + s;
  }

  /** ms → "28 Oct 2026" (the phone's own time zone). */
  function fmtDate(ms) {
    var d = new Date(Number(ms));
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /** ms → "11:20 am". */
  function fmtTime(ms) {
    var d = new Date(Number(ms));
    var h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    var m = d.getMinutes();
    return h + ':' + (m < 10 ? '0' : '') + m + ' ' + (d.getHours() < 12 ? 'am' : 'pm');
  }

  /** The big line at the top. balance: + means the customer owes the shop. */
  function balanceWording(balance, country) {
    if (balance > 0) return { kind: 'owe', label: 'You owe', amount: fmtMoney(balance, country), text: 'You owe ' + fmtMoney(balance, country) };
    if (balance < 0) return { kind: 'advance', label: 'Your advance', amount: fmtMoney(-balance, country), text: 'You have ' + fmtMoney(-balance, country) + ' advance' };
    return { kind: 'settled', label: 'All settled', amount: '', text: 'All settled' };
  }

  function initials(name) {
    var w = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    return ((w[0][0] || '') + (w.length > 1 ? w[1][0] : (w[0][1] || ''))).toUpperCase();
  }

  /** UPI deep link, or '' when there is nothing to pay or no UPI ID. */
  function upiLink(upi, payee, balance, note) {
    if (!upi || !(balance > 0)) return '';
    var am = (Math.floor(balance / 100)) + '.' + ('0' + (balance % 100)).slice(-2);
    var q = 'pa=' + encodeURIComponent(upi) + '&pn=' + encodeURIComponent(payee || '') + '&am=' + am + '&cu=INR';
    if (note) q += '&tn=' + encodeURIComponent(note);
    return 'upi://pay?' + q;
  }

  function modeName(m) {
    return ({ cash: 'cash', upi: 'UPI', card: 'card', bank: 'bank transfer', cheque: 'cheque' })[m] || (m ? String(m).toUpperCase() : 'cash');
  }

  /** Bills and payments as display rows, newest first. */
  function statementRows(data) {
    var c = data.business && data.business.country, rows = [];
    (data.bills || []).forEach(function (b) {
      var cn = b.kind === 'cn', due = (b.total || 0) - (b.paid || 0), sub = fmtDate(b.date);
      if (!cn) sub += due > 0 ? (b.paid > 0 ? ' · ' + fmtMoney(due, c) + ' due' : '') : ' · Paid';
      rows.push({
        at: Number(b.date), type: 'bill',
        title: (cn ? 'Credit note ' : 'Bill ') + b.number, sub: sub,
        amount: (cn ? MINUS + ' ' : '') + fmtMoney(b.total, c), tone: cn ? 'good' : ''
      });
    });
    (data.payments || []).forEach(function (p) {
      var inn = p.direction !== 'out';
      rows.push({
        at: Number(p.date), type: 'pay',
        title: inn ? 'You paid by ' + modeName(p.mode) : 'Paid to you by ' + modeName(p.mode),
        sub: fmtDate(p.date),
        amount: (inn ? MINUS : '+') + ' ' + fmtMoney(p.amount, c), tone: inn ? 'good' : ''
      });
    });
    rows.sort(function (a, b) { return b.at - a.at; });
    return rows;
  }

  function tokenFrom(search) {
    var m = /[?&]t=([A-Za-z0-9_-]{22,64})(?:&|$)/.exec(search || '');
    return m ? m[1] : '';
  }

  var api = { CONFIG: CONFIG, fmtMoney: fmtMoney, fmtDate: fmtDate, fmtTime: fmtTime, balanceWording: balanceWording, initials: initials, upiLink: upiLink, statementRows: statementRows, tokenFrom: tokenFrom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  // ------------------------------------------------------------ page
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function show(state) {
    ['loading', 'gone', 'offline', 'page'].forEach(function (s) { $(s).hidden = s !== state; });
  }

  function render(d) {
    var biz = d.business || {}, party = d.party || {}, c = biz.country, bal = Number(d.balance) || 0;
    document.title = biz.name + ' · Statement';
    $('av').textContent = initials(biz.name);
    $('biz').textContent = biz.name;
    $('for').textContent = 'Statement for ' + party.name;
    $('pfor').textContent = [biz.address, biz.gstin ? 'GSTIN ' + biz.gstin : '', biz.phone].filter(Boolean).join(' · ');

    var w = balanceWording(bal, c);
    $('bal').className = 'bal ' + w.kind;
    $('blabel').textContent = w.label;
    $('bamount').textContent = w.amount;
    $('bamount').hidden = !w.amount;
    $('asof').textContent = 'As of ' + fmtDate(d.at) + ', ' + fmtTime(d.at);

    var link = (c || 'IN') === 'IN' ? upiLink(biz.upi, biz.name, bal, 'Statement ' + party.name) : '';
    $('pay').hidden = !link;
    $('paynote').hidden = !link;
    if (link) {
      $('pay').href = link;
      $('paytext').textContent = 'Pay ' + fmtMoney(bal, c) + ' by UPI';
      $('paynote').textContent = 'Opens your UPI app. The payment shows here once ' + biz.name + ' marks it received.';
    }

    var list = $('rows');
    list.textContent = '';
    var rows = statementRows(d);
    rows.forEach(function (r) {
      var row = el('div', 'row');
      var left = el('span', 'grow');
      left.appendChild(el('span', 't', r.title));
      left.appendChild(el('span', 's', r.sub));
      row.appendChild(left);
      row.appendChild(el('span', 'amt' + (r.tone ? ' ' + r.tone : ''), r.amount));
      list.appendChild(row);
    });
    if (party.opening) {
      var o = el('div', 'row');
      var ol = el('span', 'grow');
      ol.appendChild(el('span', 't', 'Opening balance'));
      o.appendChild(ol);
      o.appendChild(el('span', 'amt' + (party.opening < 0 ? ' good' : ''), (party.opening < 0 ? MINUS : '+') + ' ' + fmtMoney(Math.abs(party.opening), c)));
      list.appendChild(o);
    }
    if (!list.children.length) list.appendChild(el('div', 'empty', 'No bills yet'));

    var foot = $('ask');
    foot.textContent = '';
    if (biz.phone) {
      foot.appendChild(document.createTextNode('Questions about a bill? '));
      var a = el('a', '', 'Call ' + biz.name);
      a.href = 'tel:' + String(biz.phone).replace(/[^\d+]/g, '');
      foot.appendChild(a);
    } else {
      foot.textContent = 'Questions about a bill? Ask ' + biz.name + '.';
    }
    show('page');
  }

  function load() {
    var t = tokenFrom(location.search);
    if (!t) return show('gone');
    show('loading');
    fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/public_statement', {
      method: 'POST',
      headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: t }),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    }).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json();
    }).then(function (d) {
      if (!d || !d.ok) return show('gone');
      render(d);
    }).catch(function () {
      $('offmsg').textContent = navigator.onLine === false
        ? 'You are offline. Check your internet and try again.'
        : 'Could not load the statement. Check your internet and try again.';
      show('offline');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('retry').addEventListener('click', load);
    $('dl').addEventListener('click', function () { window.print(); });
    load();
  });
})(this);
