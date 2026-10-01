import type Lenis from 'lenis';

/**
 * Header: transparent over the hero, solid once scrolled. On phones it tucks away while
 * reading downwards (the quick-action bar carries the order button there) and returns on
 * scroll up; on larger screens it stays, so the order button is always one click away.
 * Below 900px the links fold into a sheet.
 */
export function nav(lenis: Lenis | null) {
  const el = document.querySelector<HTMLElement>('[data-nav]')!;
  const toggle = el.querySelector<HTMLButtonElement>('.nav-toggle')!;
  const sheet = el.querySelector<HTMLElement>('#sheet')!;
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const light = [...document.querySelectorAll<HTMLElement>('.menu')];

  let lastY = scrollY;
  let open = false;
  const phone = matchMedia('(max-width: 900px)');

  const onScroll = () => {
    const y = scrollY;
    el.classList.toggle('is-solid', y > 24);
    // a light section under the header's middle line switches it to its light variant
    const mid = el.offsetHeight / 2;
    el.classList.toggle('on-light', !open && light.some((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; }));
    const pastHero = y > hero.offsetHeight * 0.7;
    const down = y > lastY + 2;
    const up = y < lastY - 2;
    if (!open && !el.contains(document.activeElement)) {
      if (pastHero && down && phone.matches) el.classList.add('is-hidden');
      else if (up || !pastHero) el.classList.remove('is-hidden');
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  el.addEventListener('focusin', () => el.classList.remove('is-hidden'));

  const focusables = () =>
    [toggle, ...sheet.querySelectorAll<HTMLElement>('a, button')].filter((n) => n.offsetParent !== null);

  const setOpen = (v: boolean, restoreFocus = true) => {
    open = v;
    toggle.setAttribute('aria-expanded', String(v));
    toggle.querySelector('.nav-toggle-label')!.textContent = v ? 'Kapat' : 'Menü';
    el.classList.toggle('is-open', v);
    sheet.hidden = !v;
    sheet.classList.toggle('is-anim', v);
    document.documentElement.style.overflow = v ? 'hidden' : '';
    if (v) lenis?.stop();
    else lenis?.start();
    if (v) sheet.querySelector<HTMLElement>('a')?.focus();
    else if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => setOpen(!open));
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Tab') {
      const list = focusables();
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && open && setOpen(false, false));

  // in-page links glide with Lenis; the sheet closes first
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href')!;
    const target = id === '#top' ? document.body : document.querySelector<HTMLElement>(id);
    if (!target) return;
    e.preventDefault();
    if (open) setOpen(false, false);
    if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView();
    history.replaceState(null, '', id === '#top' ? location.pathname + location.search : id);
    // move focus for keyboard and screen reader users without scrolling twice
    const focusTarget = id === '#top' ? document.querySelector<HTMLElement>('#hero-title') : target;
    if (focusTarget) {
      if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
      focusTarget.focus({ preventScroll: true });
    }
  });

  // current section marker
  const links = [...el.querySelectorAll<HTMLAnchorElement>('.nav-links a')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        for (const l of links) l.setAttribute('aria-current', String(l.getAttribute('href') === `#${en.target.id}`));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of ['top', 'hikaye', 'menu', 'tasarla', 'iletisim']) {
    const s = document.getElementById(id);
    if (s) io.observe(s);
  }
}
