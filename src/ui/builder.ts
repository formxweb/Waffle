import { sauces, fruits, toppings, limits, signatureChoice, type Choice, type Swatch } from '../content';
import { kova } from '../art/kova';

type Group = keyof Choice;

const GROUPS: { key: Group; title: string; list: Swatch[] }[] = [
  { key: 'sauces', title: 'Sos', list: sauces },
  { key: 'fruits', title: 'Meyve', list: fruits },
  { key: 'toppings', title: 'Son dokunuş', list: toppings },
];

const NAMES: Record<string, string> = {
  sutlu: 'Klasik',
  bitter: 'Gece Yarısı',
  beyaz: 'Kar Tanesi',
  karamel: 'Altın Saat',
  fistik: 'Fıstık Rüyası',
};

const label = (list: Swatch[], id: string) => list.find((s) => s.id === id)!.label;
const lower = (s: string) => s.toLocaleLowerCase('tr');

export function kovaName(c: Choice): string {
  if (!c.sauces.length) return 'Sade Kova';
  let name = NAMES[c.sauces[0]];
  if (c.sauces[0] === 'bitter' && c.fruits.includes('cilek')) name = 'Kara Orman';
  return `${name} Kova`;
}

export function kovaSummary(c: Choice): string {
  const parts: string[] = [];
  if (c.sauces.length) parts.push(c.sauces.map((s) => label(sauces, s)).join(' + '));
  if (c.fruits.length) parts.push(c.fruits.map((s) => lower(label(fruits, s))).join(', '));
  if (c.toppings.length) parts.push(c.toppings.map((s) => lower(label(toppings, s))).join(', '));
  return parts.join(' · ') || 'Sadece sıcak waffle';
}

// ?kova=sutlu.beyaz-cilek.muz-findik
function encode(c: Choice) {
  return [c.sauces, c.fruits, c.toppings].map((g) => g.join('.') || '0').join('-');
}

function decode(v: string | null): Choice | null {
  if (!v) return null;
  const [a = '', b = '', t = ''] = v.split('-');
  const pick = (s: string, list: Swatch[], max: number) =>
    s
      .split('.')
      .filter((id) => list.some((x) => x.id === id))
      .slice(0, max);
  return { sauces: pick(a, sauces, limits.sauces), fruits: pick(b, fruits, limits.fruits), toppings: pick(t, toppings, limits.toppings) };
}

export function builder() {
  const form = document.querySelector<HTMLFormElement>('[data-builder]');
  const stage = document.querySelector<HTMLElement>('[data-kova="builder"]');
  if (!form || !stage) return;
  const nameEl = document.querySelector<HTMLElement>('[data-builder-name]')!;
  const sumEl = document.querySelector<HTMLElement>('[data-builder-summary]')!;

  const params = new URLSearchParams(location.search);
  let choice: Choice = decode(params.get('kova')) ?? structuredClone(signatureChoice);

  form.innerHTML =
    GROUPS.map(
      (g, gi) => `
    <fieldset data-group="${g.key}">
      <legend><span class="num">0${gi + 1}</span><span class="t">${g.title}</span><span class="hint">en fazla ${limits[g.key]}</span></legend>
      <div class="chips">
        ${g.list
          .map(
            (s) => `
          <span class="chip">
            <input type="checkbox" id="k-${g.key}-${s.id}" name="${g.key}" value="${s.id}">
            <label for="k-${g.key}-${s.id}"><span class="sw" style="--c:${s.color}"></span>${s.label}</label>
          </span>`,
          )
          .join('')}
      </div>
    </fieldset>`,
    ).join('') +
    `<div class="atelier-actions">
      <button class="btn btn-primary" type="button" data-act="share">Kovamı paylaş <span aria-hidden="true">↗</span></button>
      <button class="btn btn-line" type="button" data-act="random">Şaşırt beni</button>
      <button class="link" type="button" data-act="reset">Baştan al</button>
    </div>
    <p class="toast" role="status" aria-live="polite"></p>
    <p class="atelier-note">Seçenekler örnektir; günün seçkisi şubeye göre değişebilir.</p>`;

  const toast = form.querySelector<HTMLElement>('.toast')!;
  let toastTimer = 0;
  const say = (msg: string) => {
    toast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.textContent = ''), 4200);
  };

  const sync = (changed: Group | 'all' | null) => {
    for (const g of GROUPS) {
      const sel = choice[g.key];
      for (const input of form.querySelectorAll<HTMLInputElement>(`input[name="${g.key}"]`)) {
        input.checked = sel.includes(input.value);
        input.disabled = !input.checked && sel.length >= limits[g.key];
      }
    }
    const name = kovaName(choice);
    stage.innerHTML = kova({ choice, id: 'kb', viewBox: '20 140 480 490', label: `${name}: ${kovaSummary(choice)}` });
    const layer = changed === 'sauces' ? 'sauce' : changed === 'fruits' ? 'fruit' : changed === 'toppings' ? 'topping' : null;
    const targets = changed === 'all' ? ['sauce', 'fruit', 'topping'] : layer ? [layer] : [];
    for (const t of targets) stage.querySelector(`[data-layer="${t}"]`)?.classList.add('is-entering');
    nameEl.textContent = name;
    sumEl.textContent = kovaSummary(choice);
  };

  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const key = input.name as Group;
    const set = new Set(choice[key]);
    if (input.checked) set.add(input.value);
    else set.delete(input.value);
    // keep the order of the swatch list so names stay stable
    const list = GROUPS.find((g) => g.key === key)!.list;
    choice = { ...choice, [key]: list.map((s) => s.id).filter((id) => set.has(id)) };
    sync(key);
  });

  const shareUrl = () => {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('kova', encode(choice));
    u.hash = 'tasarla';
    return u.toString();
  };

  form.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'reset') {
      choice = structuredClone(signatureChoice);
      sync('all');
    } else if (act === 'random') {
      const pick = (list: Swatch[], max: number, min: number) => {
        const n = min + Math.floor(Math.random() * (max - min + 1));
        return [...list].sort(() => Math.random() - 0.5).slice(0, n).map((s) => s.id)
          .sort((a, b) => list.findIndex((s) => s.id === a) - list.findIndex((s) => s.id === b));
      };
      choice = { sauces: pick(sauces, limits.sauces, 1), fruits: pick(fruits, limits.fruits, 1), toppings: pick(toppings, limits.toppings, 0) };
      sync('all');
    } else if (act === 'share') {
      const title = `${kovaName(choice)} · ESD Waffle`;
      const text = `Benim kovam: ${kovaSummary(choice)}.`;
      const url = shareUrl();
      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          return;
        }
        await navigator.clipboard.writeText(`${text} ${url}`);
        say('Bağlantı kopyalandı. Kasada göster ya da gönder.');
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') say(`Kovan: ${kovaSummary(choice)}`);
      }
    }
  });

  sync(null);
}
