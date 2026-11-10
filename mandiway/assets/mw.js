/* MandiWay site interactions */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 980px)');
  var hasGsap = typeof window.gsap !== 'undefined';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- intro film (first visit per session) ---------- */
  var intro = $('.intro');
  var seen = false;
  try { seen = sessionStorage.getItem('mw-intro') === '1'; sessionStorage.setItem('mw-intro', '1'); } catch (e) {}
  function endIntro() { if (intro) intro.classList.add('is-done'); }
  if (intro) {
    if (seen || reduce) { intro.style.display = 'none'; }
    else {
      var film = $('.intro-film');
      film.playbackRate = 1.3;
      var p = film.play();
      if (p && p.catch) p.catch(function () {});
      film.addEventListener('ended', endIntro);
      $('.intro-skip').addEventListener('click', endIntro);
    }
  }
  var introDelay = (seen || reduce) ? 0.15 : 3.7;

  /* ---------- nav ---------- */
  var nav = $('.nav'), toggle = $('.nav-toggle'), links = $('#navlinks'), lastY = 0;
  function onScrollNav() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > 20);
    var open = links.classList.contains('is-open');
    nav.classList.toggle('is-hidden', !open && y > 600 && y > lastY + 4);
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

  /* ---------- sticky call to action on phones ---------- */
  var mcta = $('.m-cta');
  function mctaState() {
    var end = $('.close').getBoundingClientRect().top < window.innerHeight;
    mcta.classList.toggle('is-on', narrow.matches && window.scrollY > window.innerHeight * 1.2 && !end && !links.classList.contains('is-open'));
  }
  window.addEventListener('scroll', mctaState, { passive: true });

  /* ---------- rates tape (sample rates, labelled) ---------- */
  var R = [['gold', 'Gold 24K', '10 g', 133177, 0.95], ['silver', 'Silver', '1 kg', 162539, 0.14], ['copper', 'Copper', '1 kg', 894, -1.77], ['aluminium', 'Aluminium', '1 kg', 254, -0.93], ['tmt', 'TMT Fe 550D', 'tonne', 57561, 1.24], ['cement', 'OPC 53 cement', '50 kg', 391, 0.41], ['sand', 'M-sand', 'tonne', 938, -0.02], ['dal', 'Toor dal', 'quintal', 12085, 1.73], ['rice', 'Sona masoori', 'quintal', 5418, -0.98], ['wheat', 'Wheat', 'quintal', 2826, -1.57], ['sugar', 'Sugar', 'quintal', 4263, 0.85], ['oil', 'Groundnut oil', '15 L', 2695, -0.46], ['onion', 'Onion', 'quintal', 2865, 3.84], ['tomato', 'Tomato', 'quintal', 2022, -10.58], ['potato', 'Potato', 'quintal', 1918, 2.14], ['chilli', 'Green chilli', 'quintal', 4574, 5.65], ['cotton', 'Cotton', 'candy', 55107, -1.55], ['coconut', 'Coconut', '1000 nos', 24918, 0.61]];
  var tape = $('#tape');
  function tapeHTML(ariaHidden) {
    return R.map(function (r) {
      var up = r[4] >= 0;
      return '<span class="tape-item"' + (ariaHidden ? ' aria-hidden="true"' : '') + '><img src="/img/cat/' + r[0] + '.webp" width="30" height="30" alt="">' + r[1] + ' <small>' + r[2] + '</small> <b>₹' + r[3].toLocaleString('en-IN') + '</b><span class="' + (up ? 'up' : 'dn') + '">' + (up ? '▲ ' : '▼ ') + Math.abs(r[4]).toFixed(2) + '%</span></span>';
    }).join('');
  }
  tape.innerHTML = tapeHTML(false) + tapeHTML(true);

  /* ---------- deal story ---------- */
  var steps = $$('.step'), screens = $$('.deal-phone .sc'), chips = $$('.deal-stage .chip');
  function setStep(i) {
    steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    screens.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    chips.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
  }
  var io = null;
  function watchSteps() {
    if (!('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) setStep(steps.indexOf(e.target)); }); },
      { rootMargin: narrow.matches ? '-74% 0px -20% 0px' : '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
  watchSteps();
  if (narrow.addEventListener) narrow.addEventListener('change', watchSteps);
  var prog = $('.deal-progress');
  function dealProgress() {
    var r = $('.steps').getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (window.innerHeight * (narrow.matches ? .78 : .5) - r.top) / r.height));
    prog.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  }
  window.addEventListener('scroll', dealProgress, { passive: true });
  dealProgress();

  /* ---------- auction clock ---------- */
  var left = 14 * 60 + 32, bid = 2240000, bids = 17;
  var cities = ['Salem', 'Madurai', 'Karur', 'Coimbatore', 'Tiruppur', 'Erode', 'Bhiwandi', 'Ludhiana'];
  var feed = $('.auc-feed');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function drawClock() {
    $('[data-cd=h]').textContent = pad(Math.floor(left / 3600));
    $('[data-cd=m]').textContent = pad(Math.floor(left % 3600 / 60));
    $('[data-cd=s]').textContent = pad(left % 60);
  }
  if (!reduce) {
    setInterval(function () {
      left = left > 0 ? left - 1 : 15 * 60;
      drawClock();
      if (left % 7 === 0) {
        bid += 15000; bids += 1;
        $('.bid').textContent = '₹' + bid.toLocaleString('en-IN');
        $('.bid-n b').textContent = bids;
        var li = document.createElement('li');
        li.textContent = 'Buyer in ' + cities[bids % cities.length] + ' bid ₹' + bid.toLocaleString('en-IN');
        feed.insertBefore(li, feed.firstChild);
        if (feed.children.length > 3) feed.removeChild(feed.lastChild);
        if (hasGsap) gsap.fromTo([li, '.bid'], { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power3.out' });
      }
    }, 1000);
  }

  /* ---------- trust card bars ---------- */
  $$('.tc-bars i').forEach(function (i) { i.style.setProperty('--w', i.dataset.w + '%'); });

  if (!hasGsap || reduce) return;

  /* ================= motion ================= */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (window.Lenis && window.matchMedia('(pointer:fine)').matches) {
    var lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); history.replaceState(null, '', id);
      });
    });
  }

  // hero entrance
  gsap.set('.display .line > span', { yPercent: 115 });
  gsap.set(['.hero-copy .pill', '.lede', '.hero-copy .cta-row', '.hero-rail > div'], { opacity: 0, y: 22 });
  gsap.set('.deal-card', { opacity: 0, x: 40, scale: .94 });
  gsap.set('.hero-globe', { opacity: 0, scale: .82 });
  var tl = gsap.timeline({ delay: introDelay, defaults: { ease: 'expo.out' } });
  tl.to('.hero-globe', { opacity: 1, scale: 1, duration: 2.2 }, 0)
    .to('.hero-copy .pill', { opacity: 1, y: 0, duration: .8 }, .2)
    .to('.display .line > span', { yPercent: 0, duration: 1.2, stagger: .12 }, .25)
    .to(['.lede', '.hero-copy .cta-row'], { opacity: 1, y: 0, duration: 1, stagger: .1 }, .7)
    .to('.deal-card', { opacity: 1, x: 0, scale: 1, duration: 1, stagger: .35 }, 1.1)
    .to('.hero-rail > div', { opacity: 1, y: 0, duration: .8, stagger: .08 }, 1.2)
    .add(function () {
      $$('.deal-card').forEach(function (c, i) { gsap.to(c, { y: i % 2 ? 8 : -8, duration: 3 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }); });
    });

  // hero pins, then the globe pulls back to the whole world
  var zoomFrom = narrow.matches ? 1.25 : 1.5, zoomTo = narrow.matches ? 0.78 : 0.95;
  var z = { v: zoomFrom };
  var heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=90%', pin: true, scrub: .6, anticipatePin: 1 }
  });
  heroTl.to(['.hero-in', '.hero-rail'], { opacity: 0, y: -60, ease: 'none', duration: .5 }, 0)
    .to(z, { v: zoomTo, ease: 'none', duration: 1, onUpdate: function () { if (window.mwGlobe) window.mwGlobe.setZoom(z.v); } }, 0)
    .to('.hero-globe', narrow.matches ? { top: '14vh', ease: 'none', duration: 1 } : { right: '50%', xPercent: 50, ease: 'none', duration: 1 }, 0)
    .to('.hero-world', { opacity: 1, ease: 'none', duration: .35 }, .6);

  // reveals
  gsap.set('.reveal', { opacity: 0, y: 30 });
  ScrollTrigger.batch('.reveal', { start: 'top 88%', once: true, onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .85, stagger: .07, ease: 'power3.out', overwrite: true }); } });

  // why cards come in from alternate sides
  $$('.why-card').forEach(function (c, i) {
    gsap.fromTo(c, { x: i % 2 ? 36 : -36, rotate: i % 2 ? 1.5 : -1.5 }, { x: 0, rotate: 0, ease: 'power2.out', scrollTrigger: { trigger: c, start: 'top 98%', end: 'top 62%', scrub: .5 } });
  });

  // deal phone settles in
  gsap.fromTo('.deal-phone', { scale: .9, rotate: -3 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.deal', start: 'top 70%', end: 'top 10%', scrub: true } });

  // trust card: count up, ring fills
  ScrollTrigger.create({
    trigger: '.trust-card', start: 'top 75%', once: true, onEnter: function () {
      $$('[data-to]').forEach(function (b) {
        var o = { v: 0 }, to = +b.dataset.to;
        gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: function () { b.textContent = Math.round(o.v); } });
      });
      gsap.fromTo('.ring-fg', { '--rv': 0 }, { '--rv': 94, duration: 1.6, ease: 'power3.out' });
      gsap.from('.tc-bars i', { '--w': '0%', duration: 1.4, stagger: .12, ease: 'power3.out' });
      gsap.from('.tc-checks span', { scale: .6, opacity: 0, duration: .5, stagger: .1, ease: 'back.out(2)' });
    }
  });
  gsap.fromTo('.trust-card', { rotate: 4, y: 60 }, { rotate: -1, y: 0, ease: 'none', scrollTrigger: { trigger: '.trust', start: 'top 90%', end: 'center 60%', scrub: .6 } });

  // goods wall slides as you scroll
  $$('.goods-row').forEach(function (row) {
    var dir = +row.dataset.dir;
    gsap.fromTo(row, { x: dir < 0 ? 0 : -row.scrollWidth * 0.35 }, { x: dir < 0 ? -row.scrollWidth * 0.35 : 0, ease: 'none', scrollTrigger: { trigger: '.goods', start: 'top bottom', end: 'bottom top', scrub: .5 } });
  });

  // sparklines draw
  $$('.spark path').forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 200;
    p.style.setProperty('--len', len);
    gsap.fromTo(p, { '--off': len }, { '--off': 0, duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: p, start: 'top 90%', once: true } });
  });
  gsap.fromTo('.rates-phone .phone', { rotate: 9, y: 80 }, { rotate: 3, y: 0, ease: 'none', scrollTrigger: { trigger: '.rates', start: 'top 90%', end: 'center 60%', scrub: .6 } });

  // auction card tilts up
  gsap.fromTo('.auc-card', { rotate: -5, y: 70, scale: .94 }, { rotate: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.auction', start: 'top 90%', end: 'center 60%', scrub: .6 } });

  // app phones rise
  $$('.app-phone').forEach(function (p) {
    gsap.fromTo(p, { y: 140 }, { y: 0, ease: 'none', scrollTrigger: { trigger: p.closest('.app-card'), start: 'top 95%', end: 'center 50%', scrub: .6 } });
  });

  // plans stack
  $$('.plan').forEach(function (c) { gsap.fromTo(c, { scale: .9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top 100%', end: 'top 65%', scrub: .5 } }); });

  // pointer tilt on desktop
  if (window.matchMedia('(pointer:fine)').matches) {
    $$('.why-card, .plan, .trust-card, .auc-card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        gsap.to(c, { rotationY: ((e.clientX - r.left) / r.width - .5) * 6, rotationX: -((e.clientY - r.top) / r.height - .5) * 6, transformPerspective: 900, duration: .4, ease: 'power2.out' });
      });
      c.addEventListener('pointerleave', function () { gsap.to(c, { rotationY: 0, rotationX: 0, duration: .6, ease: 'power3.out' }); });
    });
  }

  // footer word rises
  gsap.fromTo('.foot-giant', { yPercent: 40 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
