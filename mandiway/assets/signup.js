/* Sign-up form for ownbill.in and mandiway.ownbill.in.
 * Any element with data-signup opens the <dialog id="signup">; its value
 * (e.g. "starter", "seller") preselects the choice. The form posts to the
 * public.web_signup function with the publishable key only. The list itself
 * is private and read from the admin panel. */
(function () {
  'use strict';
  var API = 'https://lkurxhcdvrvlahdjtivp.supabase.co/rest/v1/rpc/web_signup';
  var KEY = 'sb_publishable_nceVqyl2Q9fwgqk51AA85w_KDgQWANu';

  var dlg = document.getElementById('signup');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var product = dlg.getAttribute('data-product');
  var form = dlg.querySelector('form');
  var done = dlg.querySelector('.su-done');
  var go = form.querySelector('.su-go');
  var msg = form.querySelector('.su-msg');
  var opener = null, sending = false, source = '';

  var ERR = {
    bad_name: ['name', 'Write your name.'],
    bad_phone: ['phone', 'Write a 10-digit mobile number.'],
    bad_business: ['business', 'Write your business name.'],
    bad_city: ['city', 'Write your town or city.'],
    bad_email: ['email', 'Check the email, or leave it empty.'],
    bad_intent: ['intent', 'Pick one.'],
    bad_consent: ['consent', 'Tick this so we can call you.'],
    too_many: [null, 'Too many tries from this network. Try again in an hour.']
  };

  function field(name) { return form.querySelector('[data-f="' + name + '"]'); }
  function setErr(name, text) {
    var f = field(name); if (!f) return;
    var e = f.querySelector('.su-err');
    f.classList.toggle('is-bad', !!text);
    if (e) e.textContent = text || '';
    var inp = f.querySelector('input');
    if (inp) inp.setAttribute('aria-invalid', text ? 'true' : 'false');
  }
  function clearErrs() {
    form.querySelectorAll('.is-bad').forEach(function (f) { setErr(f.getAttribute('data-f'), ''); });
    msg.textContent = '';
  }

  function digits(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 12 && d.slice(0, 2) === '91') d = d.slice(2);
    if (d.length === 11 && d[0] === '0') d = d.slice(1);
    return d;
  }

  function open(intent, from) {
    opener = document.activeElement;
    source = from || '';
    form.hidden = false; done.hidden = true;
    clearErrs();
    if (intent) {
      var r = form.querySelector('input[name="intent"][value="' + intent + '"]');
      if (r) r.checked = true;
    }
    document.documentElement.classList.add('su-open');
    dlg.showModal();
    var first = form.querySelector('input[name="name"]');
    if (first && window.matchMedia('(pointer:fine)').matches) first.focus();
  }
  function close() { dlg.close(); }
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('su-open');
    if (location.hash === '#join') history.replaceState(null, '', location.pathname + location.search);
    if (opener && opener.focus) opener.focus();
  });
  // Click on the dimmed backdrop closes (the dialog box itself is .su-box).
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  dlg.querySelectorAll('[data-su-close]').forEach(function (b) { b.addEventListener('click', close); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-signup]');
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute('data-signup'), t.getAttribute('data-src') || '');
  });

  // Phone: keep only digits, show as 98450 12345.
  var phone = form.querySelector('input[name="phone"]');
  phone.addEventListener('input', function () {
    var d = digits(phone.value).slice(0, 10);
    var v = d.length > 5 ? d.slice(0, 5) + ' ' + d.slice(5) : d;
    if (phone.value !== v) phone.value = v;
    if (field('phone').classList.contains('is-bad') && /^[6-9]\d{9}$/.test(d)) setErr('phone', '');
  });
  form.addEventListener('input', function (e) {
    var f = e.target.closest('[data-f]');
    if (f && f.classList.contains('is-bad') && f.getAttribute('data-f') !== 'phone') setErr(f.getAttribute('data-f'), '');
  });
  form.addEventListener('change', function (e) {
    var f = e.target.closest('[data-f]');
    if (f) setErr(f.getAttribute('data-f'), '');
  });

  function val(n) { var i = form.elements[n]; return i ? String(i.value || '').trim() : ''; }

  function check() {
    var bad = [];
    var intent = form.querySelector('input[name="intent"]:checked');
    if (!intent) bad.push(['intent', 'Pick one.']);
    if (val('name').length < 2) bad.push(['name', 'Write your name.']);
    if (!/^[6-9]\d{9}$/.test(digits(val('phone')))) bad.push(['phone', 'Write a 10-digit mobile number.']);
    if (val('business').length < 2) bad.push(['business', 'Write your business name.']);
    if (val('city').length < 2) bad.push(['city', 'Write your town or city.']);
    var em = val('email');
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) bad.push(['email', 'Check the email, or leave it empty.']);
    if (!form.elements.consent.checked) bad.push(['consent', 'Tick this so we can call you.']);
    bad.forEach(function (b) { setErr(b[0], b[1]); });
    if (bad.length) {
      var f = field(bad[0][0]);
      var i = f && f.querySelector('input');
      if (i) i.focus({ preventScroll: true });
      if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return !bad.length;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    clearErrs();
    if (!check()) return;
    var extra = {};
    var many = form.querySelectorAll('input[name="goods"]:checked');
    if (many.length) extra.goods = Array.prototype.map.call(many, function (c) { return c.value; });
    if (form.elements.uses_ownbill && form.elements.uses_ownbill.checked) extra.uses_ownbill = true;
    var kind = form.querySelector('input[name="kind"]:checked');
    var body = {
      product: product,
      intent: form.querySelector('input[name="intent"]:checked').value,
      name: val('name'), phone: digits(val('phone')), business: val('business'), city: val('city'),
      kind: kind ? kind.value : '', email: val('email'), extra: extra,
      consent: true, website: val('website'), source: source, lang: document.documentElement.lang || ''
    };
    sending = true; go.disabled = true; go.classList.add('is-busy');
    msg.textContent = '';
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(API, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: body }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (res.ok && res.j && res.j.ok) return success(res.j, body);
      var code = String((res.j && res.j.message) || '').split(':')[0];
      var m = ERR[code];
      if (m && m[0]) { setErr(m[0], m[1]); var f = field(m[0]); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      else msg.textContent = m ? m[1] : 'That didn’t go through. Try again in a minute.';
    }).catch(function () {
      msg.textContent = 'Couldn’t send. Check your internet and try again.';
    }).then(function () {
      clearTimeout(timer); sending = false; go.disabled = false; go.classList.remove('is-busy');
    });
  });

  function success(j, body) {
    var first = body.name.split(' ')[0];
    done.querySelector('[data-su="who"]').textContent = first;
    done.querySelector('[data-su="ref"]').textContent = j.ref || '';
    done.querySelector('[data-su="phone"]').textContent = '+91 ' + body.phone.slice(0, 5) + ' ' + body.phone.slice(5);
    var again = done.querySelector('[data-su="again"]');
    if (again) again.hidden = !j.again;
    form.hidden = true; done.hidden = false;
    form.reset();
    var h = done.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  }

  // Open straight away from a link like /#join or ?join=1
  if (location.hash === '#join' || /[?&]join=1\b/.test(location.search)) {
    var pre = (location.search.match(/[?&]as=([a-z]+)/) || [])[1];
    setTimeout(function () { open(pre || '', 'link'); }, 400);
  }
  window.addEventListener('hashchange', function () { if (location.hash === '#join' && !dlg.open) open('', 'link'); });
})();
