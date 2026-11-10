// Mounts the India globe behind the hero once the browser is idle enough.
import { mountGlobe } from '/assets/globe.js';

const el = document.querySelector('.globe-mount');
function start() {
  if (!el || window.mwGlobe) return;
  try {
    const g = mountGlobe(el);
    g.setZoom(window.matchMedia('(max-width: 980px)').matches ? 1.25 : 1.5);
    window.mwGlobe = g;
    // draw only while the hero is on screen (saves battery and keeps scrolling smooth)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { en[0].isIntersecting ? g.resume() : g.pause(); }).observe(document.querySelector('.hero'));
    }
    document.dispatchEvent(new CustomEvent('mw:globe'));
  } catch (e) {
    // no WebGL: the hero keeps its sky gradient
    document.documentElement.classList.add('no-globe');
  }
}
if (document.readyState === 'complete') start();
else window.addEventListener('load', start, { once: true });
