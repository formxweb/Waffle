import './styles/fonts.css';
import './styles/base.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/sections.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { WaffleRenderer } from './gl/hero';
import { nav } from './ui/nav';
import { builder } from './ui/builder';
import { mountSignature, signatureScene } from './scenes/signature';
import { splitManifesto, manifestoScene } from './scenes/manifesto';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const fontsReady = () =>
  Promise.race([
    Promise.all([
      document.fonts.load('340 100px Fraunces', 'Kare kare'),
      document.fonts.load('italic 300 100px Fraunces', 'mutluluk.'),
      document.fonts.load('500 16px "Instrument Sans"', 'ESD Waffle İstanbul'),
    ]),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

function reveals() {
  const targets = document.querySelectorAll<HTMLElement>(
    '.sig-head > *, .atelier-head > *, .atelier-stage, .atelier-form, .menu-head > *, .menu-item, .menu-note, .visit-inner > *, .foot-mark',
  );
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  for (const t of targets) {
    t.setAttribute('data-reveal', '');
    // siblings arrive in a short cascade
    const idx = [...(t.parentElement?.children ?? [])].indexOf(t);
    t.style.transitionDelay = `${Math.min(idx, 5) * 70}ms`;
    io.observe(t);
  }
}

function intro(renderer: WaffleRenderer | null) {
  root.classList.remove('intro-pending');
  const lines = document.querySelectorAll('.hero-title .line > *');
  const rest = document.querySelectorAll('.hero-eyebrow, .hero-lead, .hero-cta, .hero-foot');
  if (reduced.matches) {
    if (renderer) renderer.state.pour = 1;
    renderer?.kick();
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(lines, { yPercent: 110, duration: 1.5, stagger: 0.12 }, 0.15)
    .from(rest, { autoAlpha: 0, y: 18, duration: 1.2, stagger: 0.1 }, 0.55);
  if (renderer) {
    tl.to(renderer.state, { pour: 1, duration: 3.4, ease: 'power1.inOut' }, 0.4);
  }
}

async function boot() {
  await fontsReady();

  let renderer: WaffleRenderer | null = null;
  const canvas = document.querySelector<HTMLCanvasElement>('.hero-gl')!;
  try {
    renderer = new WaffleRenderer(canvas, { still: reduced.matches });
    root.classList.add('has-gl');
    renderer.kick();
    requestAnimationFrame(() => requestAnimationFrame(() => canvas.classList.add('is-ready')));
  } catch {
    root.classList.add('no-gl');
  }

  let lenis: Lenis | null = null;
  if (!reduced.matches) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis!.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  nav(lenis);
  splitManifesto();
  mountSignature();
  builder();

  const mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { reduce } = ctx.conditions as { reduce: boolean };
    root.classList.toggle('is-reduced', reduce);
    if (reduce) return;

    // hero: camera pushes in, copy drifts up and away
    const heroST = ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        if (renderer) renderer.state.scroll = self.progress;
      },
    });
    const heroCopy = gsap.to('.hero-inner', {
      yPercent: -18,
      autoAlpha: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true },
    });

    const killManifesto = manifestoScene();
    const killSignature = signatureScene();

    return () => {
      heroST.kill();
      heroCopy.scrollTrigger?.kill();
      heroCopy.kill();
      killManifesto();
      killSignature();
    };
  });

  reveals();
  intro(renderer);

  // deep link (#menu, ?kova=…#tasarla) after pins have added their spacing
  if (location.hash) {
    const target = document.querySelector<HTMLElement>(location.hash);
    if (target) requestAnimationFrame(() => (lenis ? lenis.scrollTo(target, { immediate: true }) : target.scrollIntoView()));
  }
  document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = String(new Date().getFullYear())));
  ScrollTrigger.refresh();
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
boot();
