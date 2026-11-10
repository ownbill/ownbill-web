/* OwnBill home interactions */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  var nav = $('.nav');
  var toggle = $('.nav-toggle');
  var links = $('#navlinks');
  var lastY = 0;
  function onScrollNav() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 20);
    var open = links.classList.contains('is-open');
    nav.classList.toggle('is-hidden', !open && y > 500 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
  function setMenu(open) {
    links.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

  /* ---------- GST calculator ---------- */
  var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function two(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : ''); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : ''); }
  function words(num) {
    var n = Math.floor(num), p = Math.round((num - n) * 100), out = [];
    if (n === 0) out.push('Zero');
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var thou = Math.floor(n / 1000); n %= 1000;
    if (crore) out.push(three(crore) + ' Crore');
    if (lakh) out.push(two(lakh) + ' Lakh');
    if (thou) out.push(two(thou) + ' Thousand');
    if (n) out.push(three(n));
    return 'Rupees ' + out.join(' ') + (p ? ' and ' + two(p) + ' Paise' : '') + ' Only';
  }
  var inr = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var r2 = function (x) { return Math.round((x + Number.EPSILON) * 100) / 100; };
  var form = $('#calcForm');
  var amt = $('#cAmt');
  function calc() {
    var raw = amt.value.replace(/[,\s₹]/g, '');
    var fld = amt.closest('.fld');
    var ok = /^\d{1,10}(\.\d{0,2})?$/.test(raw);
    fld.classList.toggle('bad', !ok && raw !== '');
    amt.setAttribute('aria-invalid', String(!ok && raw !== ''));
    if (!ok) return;
    var a = parseFloat(raw) || 0;
    var rate = parseFloat(form.querySelector('[name=rate]:checked').value);
    var inter = form.querySelector('[name=place]:checked').value === 'inter';
    var incl = form.querySelector('[name=mode]:checked').value === 'incl';
    var taxable = incl ? r2(a * 100 / (100 + rate)) : r2(a);
    var gst = incl ? r2(a - taxable) : r2(taxable * rate / 100);
    var half = r2(gst / 2), other = r2(gst - half);
    var total = r2(taxable + gst);
    $('#oTax').textContent = inr.format(taxable);
    $('#rowC').hidden = inter; $('#rowS').hidden = inter; $('#rowI').hidden = !inter;
    $('#lC').textContent = 'CGST ' + rate / 2 + '%';
    $('#lS').textContent = 'SGST ' + rate / 2 + '%';
    $('#lI').textContent = 'IGST ' + rate + '%';
    $('#oC').textContent = inr.format(half);
    $('#oS').textContent = inr.format(other);
    $('#oI').textContent = inr.format(gst);
    var tot = $('#oTot');
    tot.textContent = inr.format(total);
    $('#oWords').textContent = words(total);
    if (!reduce) { tot.classList.remove('flash'); void tot.offsetWidth; tot.classList.add('flash'); }
  }
  amt.addEventListener('input', calc);
  form.addEventListener('change', calc);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  calc();

  /* ---------- languages ---------- */
  var L = [
    ['Bill', 'TAX INVOICE', 'Total', 'Paid'],
    ['बिल', 'कर बीजक', 'कुल', 'भुगतान हो गया'],
    ['ಬಿಲ್', 'ತೆರಿಗೆ ಸರಕುಪಟ್ಟಿ', 'ಒಟ್ಟು', 'ಪಾವತಿಯಾಗಿದೆ'],
    ['பில்', 'வரி விலைப்பட்டியல்', 'மொத்தம்', 'செலுத்தப்பட்டது'],
    ['బిల్', 'పన్ను ఇన్‌వాయిస్', 'మొత్తం', 'చెల్లించారు'],
    ['ബിൽ', 'നികുതി ഇൻവോയ്സ്', 'ആകെ', 'പണമടച്ചു'],
    ['बिल', 'कर बीजक', 'एकूण', 'भरले'],
    ['બિલ', 'ટેક્સ ઇન્વૉઇસ', 'કુલ', 'ચૂકવેલ'],
    ['বিল', 'কর চালান', 'মোট', 'পরিশোধিত'],
    ['Factura', 'FACTURA', 'Total', 'Pagado'],
    ['Nota', 'FAKTUR PAJAK', 'Total', 'Lunas'],
    ['Conta', 'FATURA', 'Total', 'Pago']
  ];
  var langBtns = $$('.lang-pick button');
  function setLang(i, focus) {
    langBtns.forEach(function (b, j) { b.setAttribute('aria-checked', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    if (focus) langBtns[i].focus();
    var d = L[i];
    var w = $('#lWord');
    var apply = function () { w.textContent = d[0]; $('#lHead').textContent = d[1]; $('#lTotal').textContent = d[2]; $('#lPaid').textContent = d[3]; };
    if (hasGsap && !reduce) {
      gsap.timeline()
        .to([w, '.lang-receipt'], { y: -16, opacity: 0, duration: .18, ease: 'power2.in' })
        .add(apply)
        .fromTo(w, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out' })
        .fromTo('.lang-receipt', { y: 24, opacity: 0, rotate: -6 }, { y: 0, opacity: 1, rotate: -3, duration: .55, ease: 'expo.out' }, '<');
    } else apply();
  }
  langBtns.forEach(function (b, i) {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', function () { setLang(i); });
    b.addEventListener('keydown', function (e) {
      var k = e.key, n = langBtns.length;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); setLang((i + 1) % n, true); }
      if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); setLang((i - 1 + n) % n, true); }
    });
  });

  /* ---------- feature tabs ---------- */
  var tabs = $$('[role=tab]');
  function selectTab(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
    t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    var p = document.getElementById(t.getAttribute('aria-controls'));
    if (hasGsap && !reduce) {
      gsap.fromTo($$('.panel-copy > *, .ticks-list li', p), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .04, ease: 'power2.out' });
      gsap.fromTo($('.fan', p), { y: 50, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'expo.out', clearProps: 'all' });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % n;
      if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = n - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ---------- pricing toggle ---------- */
  var pbtns = $$('.bill-toggle button');
  var knob = $('.knob');
  function placeKnob() {
    var on = pbtns.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0];
    knob.style.setProperty('--kw', on.offsetWidth + 'px');
    knob.style.setProperty('--kx', (on.offsetLeft - 5) + 'px');
  }
  function setPeriod(btn, focus) {
    pbtns.forEach(function (b) { b.setAttribute('aria-checked', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
    if (focus) btn.focus();
    placeKnob();
    var p = btn.dataset.period;
    $$('.price').forEach(function (pr) {
      var b = pr.querySelector('b'), per = pr.querySelector('.per');
      var target = parseInt(b.dataset[p].replace(/,/g, ''), 10);
      per.textContent = per.dataset[p];
      if (hasGsap && !reduce) {
        var o = { v: parseInt(b.textContent.replace(/,/g, ''), 10) || 0 };
        gsap.to(o, { v: target, duration: .6, ease: 'power3.out', onUpdate: function () { b.textContent = Math.round(o.v).toLocaleString('en-IN'); } });
      } else b.textContent = b.dataset[p];
    });
  }
  pbtns.forEach(function (b, i) {
    b.tabIndex = i === 0 ? 0 : -1;
    b.addEventListener('click', function () { setPeriod(b); });
    b.addEventListener('keydown', function (e) {
      if (/Arrow(Left|Right|Up|Down)/.test(e.key)) { e.preventDefault(); setPeriod(pbtns[1 - i], true); }
    });
  });
  placeKnob();
  window.addEventListener('resize', placeKnob);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeKnob);

  /* ---------- story (sticky phone, active step) ---------- */
  var steps = $$('.step');
  var screens = $$('.story-phone .sc');
  var chips = $$('.story-stage .chip');
  function setStep(i) {
    steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    screens.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    chips.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setStep(steps.indexOf(en.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
  var prog = $('.story-progress');
  function storyProgress() {
    var ol = $('.steps');
    var r = ol.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (window.innerHeight * .5 - r.top) / r.height));
    prog.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  }
  window.addEventListener('scroll', storyProgress, { passive: true });
  storyProgress();

  /* ---------- MandiWay network ---------- */
  var cv = $('.mw-net');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), pts = [], W = 0, H = 0, dpr = 1, raf = 0, visible = false, t0 = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth; H = cv.offsetHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, W * H / 16000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, o: Math.random() < .14 });
    }
    function draw(ts) {
      ctx.clearRect(0, 0, W, H);
      var link = 140;
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < link) { ctx.strokeStyle = 'rgba(160,190,255,' + (0.16 * (1 - d / link)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      var pulse = reduce ? 0 : (Math.sin((ts || 0) / 600) + 1) / 2;
      pts.forEach(function (p) {
        ctx.beginPath();
        ctx.fillStyle = p.o ? 'rgba(255,120,30,.95)' : 'rgba(200,215,255,.55)';
        ctx.arc(p.x, p.y, p.o ? 2.6 + pulse * 1.4 : 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (p.o) { ctx.beginPath(); ctx.strokeStyle = 'rgba(255,120,30,' + (0.35 * (1 - pulse)) + ')'; ctx.arc(p.x, p.y, 6 + pulse * 10, 0, Math.PI * 2); ctx.stroke(); }
      });
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }
    size();
    draw(0);
    window.addEventListener('resize', function () { size(); if (!visible || reduce) draw(0); });
    if ('IntersectionObserver' in window && !reduce) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(draw);
      }).observe(cv);
    }
  }

  /* ---------- motion (GSAP) ---------- */
  if (!hasGsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll on desktop pointers
  if (window.Lenis && window.matchMedia('(pointer:fine)').matches) {
    var lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -70 });
        history.replaceState(null, '', id);
      });
    });
  }

  // hero: the bill prints, gets sent, gets paid
  var rLines = $$('.hero-receipt > div:not(.stamp)');
  gsap.set('.display .line > span', { yPercent: 110 });
  gsap.set(['.hero-copy .pill', '.lede', '.hero-copy .cta-row', '.stats li'], { opacity: 0, y: 20 });
  gsap.set('.hero-phone', { opacity: 0, y: 80, rotate: 10 });
  gsap.set('.printer', { opacity: 0, y: -20 });
  gsap.set('.hero-receipt', { clipPath: 'inset(0 0 100% 0)' });
  gsap.set(rLines, { opacity: 0 });
  gsap.set('.stamp', { opacity: 0, scale: 2.4, rotate: -30 });
  gsap.set(['.wa-bubble', '.paid-bubble'], { opacity: 0, y: 24, scale: .9 });

  var amtEl = $('.r-amt');
  var counter = { v: 0 };
  var tl = gsap.timeline({ delay: 1.05, defaults: { ease: 'expo.out' } });
  tl.to('.display .line > span', { yPercent: 0, duration: 1.1, stagger: .09 })
    .to('.hero-copy .pill', { opacity: 1, y: 0, duration: .8 }, '<')
    .to(['.lede', '.hero-copy .cta-row'], { opacity: 1, y: 0, duration: .9, stagger: .08 }, '-=.75')
    .to('.stats li', { opacity: 1, y: 0, duration: .7, stagger: .06 }, '-=.6')
    .to('.hero-phone', { opacity: 1, y: 0, rotate: 4, duration: 1.3 }, .1)
    .to('.printer', { opacity: 1, y: 0, duration: .6 }, .5)
    .to('.hero-receipt', { clipPath: 'inset(0 0 0% 0)', duration: 2.2, ease: 'steps(28)' }, .9)
    .to(rLines, { opacity: 1, duration: .05, stagger: .16 }, .95)
    .to(counter, { v: 435, duration: 1.1, ease: 'power2.out', onUpdate: function () { amtEl.textContent = counter.v.toFixed(2); } }, 2.2)
    .to('.wa-bubble', { opacity: 1, y: 0, scale: 1, duration: .8 }, 3.2)
    .to('.stamp', { opacity: 1, scale: 1, rotate: -12, duration: .45, ease: 'back.out(2.2)' }, 4.1)
    .fromTo('.hero-receipt', { x: 0 }, { x: 3, duration: .06, repeat: 3, yoyo: true, ease: 'none' }, 4.35)
    .to('.paid-bubble', { opacity: 1, y: 0, scale: 1, duration: .8 }, 4.5)
    .add(function () {
      gsap.to('.hero-phone', { y: -10, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.hero-receipt', { y: 6, rotate: -.6, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.paid-bubble', { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

  // hero depth on mouse move
  var stage = $('.hero-stage');
  if (window.matchMedia('(pointer:fine)').matches) {
    var qx = gsap.quickTo('.hero-stage', 'rotationY', { duration: .8, ease: 'power3' });
    var qy = gsap.quickTo('.hero-stage', 'rotationX', { duration: .8, ease: 'power3' });
    gsap.set('.hero-stage', { transformPerspective: 1200 });
    $('.hero').addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      qx(((e.clientX - (r.left + r.width / 2)) / r.width) * 8);
      qy(-((e.clientY - (r.top + r.height / 2)) / r.height) * 6);
    });
  }
  // hero recedes as you scroll away
  gsap.to('.hero-in', { yPercent: -8, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // reveals
  gsap.set('.reveal', { opacity: 0, y: 28 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out', overwrite: true }); }
  });

  // pain cards tilt toward the pointer
  if (window.matchMedia('(pointer:fine)').matches) {
    $$('.pain-card, .plan').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        gsap.to(c, { rotationY: ((e.clientX - r.left) / r.width - .5) * 6, rotationX: -((e.clientY - r.top) / r.height - .5) * 6, transformPerspective: 900, duration: .4, ease: 'power2.out' });
      });
      c.addEventListener('pointerleave', function () { gsap.to(c, { rotationY: 0, rotationX: 0, duration: .6, ease: 'power3.out' }); });
    });
  }

  // feature fans spread in
  gsap.from('#p-gst .fan', { y: 90, opacity: 0, duration: 1.1, ease: 'expo.out', clearProps: 'all', scrollTrigger: { trigger: '.features .tabs', start: 'top 80%', once: true } });

  // gallery: horizontal travel on wide screens
  var mm = gsap.matchMedia();
  mm.add('(min-width: 981px)', function () {
    var gal = $('.gallery');
    var track = $('.gal-track');
    gal.classList.add('is-pinned');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 40); };
    var tw = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '.gallery', start: 'top top', end: function () { return '+=' + dist(); }, pin: '.gallery', scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    $$('.gal-track figure').forEach(function (f, i) {
      gsap.fromTo(f.querySelector('.phone'), { y: i % 2 ? 40 : -20 }, { y: i % 2 ? -30 : 30, ease: 'none', scrollTrigger: { trigger: f, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
    });
    return function () { gal.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'x' }); };
  });

  // MandiWay cards drop in sequence
  gsap.from('.mw-card', { opacity: 0, x: 40, duration: .9, stagger: .25, ease: 'expo.out', scrollTrigger: { trigger: '.mw-flow', start: 'top 80%', once: true } });

  // footer word rises
  gsap.fromTo('.foot-giant', { yPercent: 40 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
