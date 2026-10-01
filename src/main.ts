import './styles/fonts.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/sections.css';

import Lenis from 'lenis';

import { WaffleRenderer } from './gl/hero';
import { nav } from './ui/nav';
import { builder } from './ui/builder';
import { orderLinks } from './ui/order';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const fontsReady = () =>
  Promise.race([
    Promise.all([
      document.fonts.load('340 100px Fraunces', 'Kare kare'),
      document.fonts.load('italic 300 100px Fraunces', 'mutluluk.'),
      document.fonts.load('500 16px "Instrument Sans"', 'İYB Bubble Waffle Yenimahalle'),
    ]),
    new Promise((r) => setTimeout(r, 2000)),
  ]);

/** Sections and cards settle in once, as they enter; siblings cascade by a few frames. */
function reveals() {
  const targets = document.querySelectorAll<HTMLElement>(
    '.intro-grid > *, .section-head > *, .product, .extras-card, .atelier-stage, .atelier-head, .atelier-form, .contact-intro > *, .contact-row, .handle',
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px' },
  );
  for (const t of targets) {
    t.setAttribute('data-reveal', '');
    const idx = [...(t.parentElement?.children ?? [])].indexOf(t);
    t.style.setProperty('--d', `${Math.min(idx % 3, 2) * 80}ms`);
    io.observe(t);
  }
}

/** The quick-action bar on phones: shown past the hero, tucked away over the footer. */
function dock() {
  const el = document.querySelector<HTMLElement>('.dock');
  const hero = document.querySelector<HTMLElement>('.hero');
  const foot = document.querySelector<HTMLElement>('.foot');
  if (!el || !hero || !foot) return;
  let pastHero = false, atFoot = false;
  const set = () => el.classList.toggle('is-on', pastHero && !atFoot);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; set(); }, { threshold: 0.25 }).observe(hero);
  new IntersectionObserver(([e]) => { atFoot = e.isIntersecting; set(); }).observe(foot);
}

async function boot() {
  await fontsReady();

  let renderer: WaffleRenderer | null = null;
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-gl')!;
  try {
    renderer = new WaffleRenderer(canvas, { still: reduced });
    root.classList.add('has-gl');
    requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.add('is-ready')));
  } catch {
    root.classList.add('no-gl');
  }

  let lenis: Lenis | null = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, smoothWheel: true });
    const raf = (t: number) => {
      lenis!.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } else {
    root.classList.add('is-reduced');
  }

  nav(lenis);
  builder();
  orderLinks();
  reveals();
  dock();

  // hero: the camera eases in and the copy lifts away as the page scrolls
  const hero = document.querySelector<HTMLElement>('.hero')!;
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const p = Math.min(1, Math.max(0, scrollY / hero.offsetHeight));
      if (renderer) renderer.state.scroll = p;
      if (!reduced) hero.style.setProperty('--hp', p.toFixed(3));
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  root.classList.add('is-loaded');
  renderer?.pourIn(350, 3200);

  // deep links (#menu, ?bardak=…#tasarla)
  if (location.hash) {
    const target = document.querySelector<HTMLElement>(location.hash);
    if (target) requestAnimationFrame(() => (lenis ? lenis.scrollTo(target, { immediate: true }) : target.scrollIntoView()));
  }
  document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = String(new Date().getFullYear())));
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
boot();
