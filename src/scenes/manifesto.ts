import { ScrollTrigger } from 'gsap/ScrollTrigger';

const ACCENT = new Set(['çikolatadan.', 'senin', 'için.']);

/** Splits the manifesto into words once; they light up as it scrolls through. */
export function splitManifesto() {
  const el = document.querySelector<HTMLElement>('[data-words]');
  if (!el || el.dataset.split) return;
  el.dataset.split = '1';
  const words = el.textContent!.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent!.trim());
  el.innerHTML = words
    .map((w) => `<span class="w${ACCENT.has(w) ? ' is-accent' : ''}" aria-hidden="true">${w}</span>`)
    .join(' ');
}

export function manifestoScene() {
  const el = document.querySelector<HTMLElement>('[data-words]')!;
  const words = [...el.querySelectorAll<HTMLElement>('.w')];
  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top 82%',
    end: 'bottom 45%',
    scrub: true,
    onUpdate: (self) => {
      const head = self.progress * (words.length + 4);
      words.forEach((w, i) => {
        w.style.opacity = String(Math.min(1, Math.max(0.16, (head - i) / 4)));
      });
    },
  });
  return () => {
    st.kill();
    for (const w of words) w.style.opacity = '';
  };
}
