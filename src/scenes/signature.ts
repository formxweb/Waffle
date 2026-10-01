import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { kova } from '../art/kova';
import { signatureChoice } from '../content';

const STEPS = ['cup', 'waffle', 'sauce', 'fruit', 'topping'] as const;
// how far each layer travels when the kova comes apart (SVG units)
const SPREAD: Record<(typeof STEPS)[number], number> = { cup: 150, waffle: 40, sauce: -55, fruit: -140, topping: -215 };

export function mountSignature() {
  const art = document.querySelector<HTMLElement>('[data-kova="signature"]');
  if (!art) return;
  art.innerHTML = kova({ choice: signatureChoice, id: 'ks', viewBox: '0 -40 520 820', label: 'Kova Waffle' });
}

/** Pinned: the kova comes apart, each layer is introduced, then it closes again. */
export function signatureScene() {
  const section = document.querySelector<HTMLElement>('.signature')!;
  const pin = section.querySelector<HTMLElement>('.sig-pin')!;
  const art = section.querySelector<HTMLElement>('.sig-art')!;
  const items = [...section.querySelectorAll<HTMLElement>('.sig-layers li')];
  const bar = section.querySelector<HTMLElement>('.sig-progress')!;
  const layers = (name: string) => [...art.querySelectorAll<SVGGElement>(`[data-layer="${name}"]`)];

  section.classList.add('is-pinned');
  const svg = art.querySelector('svg')!;
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
  // assembled, the kova fills the stage; apart, it needs the room
  tl.fromTo(svg, { scale: 1.3, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 0.18 }, 0);
  tl.to(svg, { scale: 1.3, yPercent: 4, duration: 0.14 }, 0.86);
  for (const s of STEPS) tl.to(layers(s), { y: SPREAD[s], duration: 0.18 }, 0);
  tl.to({}, { duration: 0.68 });
  for (const s of STEPS) tl.to(layers(s), { y: 0, duration: 0.14 }, 0.86);

  let current = -1;
  const setStep = (p: number) => {
    const idx = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
    const focus = p > 0.16 && p < 0.88;
    art.classList.toggle('is-focus', focus);
    if (idx !== current) {
      current = idx;
      items.forEach((li, i) => li.classList.toggle('is-active', i === idx));
      for (const s of STEPS) for (const g of layers(s)) g.classList.toggle('is-active', s === STEPS[idx]);
    }
    bar.style.setProperty('--p', p.toFixed(3));
  };
  setStep(0);

  const st = ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${innerHeight * 3}`,
    pin: true,
    scrub: 0.6,
    animation: tl,
    onUpdate: (self) => setStep(self.progress),
  });

  return () => {
    st.kill();
    tl.kill();
    section.classList.remove('is-pinned');
    art.classList.remove('is-focus');
    gsap.set([svg, ...STEPS.flatMap(layers)], { clearProps: 'transform' });
    for (const li of items) li.classList.remove('is-active');
  };
}
