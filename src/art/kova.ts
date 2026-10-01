import { sauces, fruits, toppings, type Choice, type Swatch } from '../content';

/**
 * The kova (cup) waffle, drawn as SVG from a choice of sauces, fruits and toppings.
 * Layers are separate groups (data-layer) so scenes can pull them apart.
 * Deterministic: the same choice always draws the same cup.
 */

type Pt = [number, number];

const CUP = { cx: 260, top: 318, rxTop: 156, ryTop: 36, bottom: 584, rxBot: 112, ryBot: 22 };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

/** Closed Catmull-Rom spline through points as a cubic Bezier path. */
function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

function smoothOpen(pts: Pt[]): string {
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/** Cup half-width and ellipse depth at height y. */
function cupAt(y: number) {
  const k = (y - CUP.top) / (CUP.bottom - CUP.top);
  return { rx: CUP.rxTop + (CUP.rxBot - CUP.rxTop) * k, ry: CUP.ryTop + (CUP.ryBot - CUP.ryTop) * k };
}

/** Point on the front half of the cup's ellipse at height y, s in [-1, 1] left to right. */
function frontPoint(y: number, s: number): Pt {
  const { rx, ry } = cupAt(y);
  return [CUP.cx + rx * s, y + ry * Math.sqrt(Math.max(0, 1 - s * s))];
}

function band(y1: number, y2: number): string {
  const a = cupAt(y1), b = cupAt(y2);
  return (
    `M${f(CUP.cx - a.rx)},${y1} A${f(a.rx)},${f(a.ry)} 0 0 0 ${f(CUP.cx + a.rx)},${y1}` +
    ` L${f(CUP.cx + b.rx)},${y2} A${f(b.rx)},${f(b.ry)} 0 0 1 ${f(CUP.cx - b.rx)},${y2} Z`
  );
}

// ---- waffle pieces -------------------------------------------------------------

function piece(id: string, x: number, y: number, s: number, r: number, tone: number): string {
  const n = 4;
  const cell = s / n;
  const inset = cell * 0.17;
  const h = s / 2;
  let pockets = '';
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const px = -h + i * cell + inset;
      const py = -h + j * cell + inset;
      const w = cell - inset * 2;
      pockets +=
        `<rect x="${f(px)}" y="${f(py)}" width="${f(w)}" height="${f(w)}" rx="${f(w * 0.22)}" fill="url(#${id}-pocket)"/>` +
        `<path d="M${f(px + 1.5)},${f(py + w - 2)} V${f(py + 2.5)} Q${f(px + 1.5)},${f(py + 1.5)} ${f(px + 2.5)},${f(py + 1.5)} H${f(px + w - 2)}" stroke="#5a2a08" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
  }
  const lift = tone > 0 ? `<rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="12" fill="#fff3d6" opacity="${f(tone)}"/>` : '';
  return (
    `<g transform="translate(${x} ${y}) rotate(${r})">` +
    `<rect x="${-h + 4}" y="${-h + 9}" width="${s}" height="${s}" rx="13" fill="#6e360f"/>` +
    `<rect x="${-h}" y="${-h}" width="${s}" height="${s}" rx="12" fill="url(#${id}-gold)"/>` +
    pockets +
    lift +
    `<rect x="${-h + 0.75}" y="${-h + 0.75}" width="${s - 1.5}" height="${s - 1.5}" rx="11.5" fill="none" stroke="#ffe2a8" stroke-opacity=".35" stroke-width="1.5"/>` +
    `</g>`
  );
}

const BACK: [number, number, number, number][] = [
  [186, 262, 118, -18],
  [334, 256, 122, 15],
  [262, 230, 112, 4],
];
const FRONT: [number, number, number, number][] = [
  [146, 306, 104, -31],
  [378, 300, 108, 27],
  [262, 296, 120, -6],
];

function fork(id: string): string {
  return (
    `<g transform="translate(376 200) rotate(17)">` +
    `<path d="M-12,-2 V-36 Q-12,-40 -9,-40 Q-6,-40 -6,-36 V-12 H6 V-36 Q6,-40 9,-40 Q12,-40 12,-36 V-2 Q12,6 4,8 H-4 Q-12,6 -12,-2Z" fill="url(#${id}-wood)"/>` +
    `<rect x="-8" y="4" width="16" height="118" rx="7" fill="url(#${id}-wood)"/>` +
    `<path d="M-3,14 V112" stroke="#fff6e4" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>` +
    `</g>`
  );
}

// ---- sauce ---------------------------------------------------------------------

function sauceBlob(rand: () => number): { d: Pt[] } {
  const cx = 262, cy = 254, rx = 128, ry = 48;
  const drips = [0.35, 1.05, 1.6, 2.2, 2.75].map((a) => ({ a, w: 0.09 + rand() * 0.07, l: 26 + rand() * 46 }));
  const pts: Pt[] = [];
  const N = 72;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    let r = 1 + 0.07 * Math.sin(th * 5 + 1.3) + 0.05 * Math.sin(th * 9 + 0.4);
    let x = cx + Math.cos(th) * rx * r;
    let y = cy + Math.sin(th) * ry * r;
    for (const dr of drips) {
      let dd = th - dr.a;
      dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      y += dr.l * Math.exp(-(dd * dd) / (2 * dr.w * dr.w));
    }
    pts.push([x, y]);
  }
  return { d: pts };
}

function rimDrips(rand: () => number): string {
  const y = CUP.top;
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const drips = [-0.62, -0.28, 0.08, 0.36, 0.66].map((s) => ({ s, w: 0.035 + rand() * 0.03, l: 22 + rand() * 54 }));
  const S = 48;
  for (let i = 0; i <= S; i++) {
    const s = -0.8 + (1.6 * i) / S;
    const [x, yy] = frontPoint(y, s);
    let ext = 9;
    for (const dr of drips) ext += dr.l * Math.exp(-((s - dr.s) ** 2) / (2 * dr.w * dr.w));
    // taper the overflow toward its ends
    const taper = Math.min(1, (0.8 - Math.abs(s)) * 6);
    top.push([x, yy - 7 * taper]);
    bot.push([x, yy + ext * taper]);
  }
  return smoothClosed([...top, ...bot.reverse()]);
}

/** A hand-thrown drizzle: uneven zigzags with the odd loop, never a pattern. */
function drizzle(rand: () => number): string {
  const pts: Pt[] = [];
  let x = 160;
  let up = true;
  while (x < 368) {
    const y = up ? 226 + rand() * 16 : 258 + rand() * 22;
    pts.push([x, y]);
    // a small loop now and then
    if (rand() > 0.72) pts.push([x + 10, y + (up ? -10 : 10)], [x + 2, y + (up ? -2 : 2)]);
    x += 14 + rand() * 18;
    up = !up;
  }
  return smoothOpen(pts);
}

// ---- fruit ---------------------------------------------------------------------

const SLOTS: [number, number, number][] = [
  [204, 228, -20],
  [320, 220, 16],
  [262, 204, 2],
  [150, 270, -34],
  [374, 262, 30],
  [228, 272, 12],
  [300, 278, -16],
  [262, 244, 6],
];

function strawberry(x: number, y: number, r: number, id: string): string {
  return (
    `<g transform="translate(${x} ${y}) rotate(${r})">` +
    `<path d="M0,-18C14,-23 25,-10 21,4C17,16 6,23 0,27C-6,23 -17,16 -21,4C-25,-10 -14,-23 0,-18Z" fill="url(#${id}-berry)"/>` +
    `<path d="M0,-12C9,-15 16,-7 13,3C11,11 4,16 0,19C-4,16 -11,11 -13,3C-16,-7 -9,-15 0,-12Z" fill="#f7b3a5" opacity=".85"/>` +
    `<path d="M0,-10C3,-2 3,8 0,15C-3,8 -3,-2 0,-10Z" fill="#fff0e8" opacity=".9"/>` +
    `<path d="M-6,-19L-12,-27L-2,-21L0,-30L3,-21L12,-27L6,-18Z" fill="#3f7a2a"/>` +
    `<path d="M-14,-6C-12,-12 -8,-15 -4,-16" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `</g>`
  );
}

function banana(x: number, y: number, r: number): string {
  let seeds = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    seeds += `<circle cx="${f(Math.cos(a) * 4.6)}" cy="${f(Math.sin(a) * 4.6)}" r="1.3" fill="#9b7b45"/>`;
  }
  return (
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(1 .84)">` +
    `<circle r="18" fill="#f6e8b4" stroke="#d9bd73" stroke-width="3"/>` +
    `<circle r="10" fill="#efd88e" opacity=".55"/>` +
    seeds +
    `<path d="M-11,-9C-7,-13 -2,-14 3,-14" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round"/>` +
    `</g>`
  );
}

function kiwi(x: number, y: number, r: number, id: string): string {
  let seeds = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    seeds += `<ellipse cx="${f(Math.cos(a) * 8.6)}" cy="${f(Math.sin(a) * 8.6)}" rx="1.9" ry=".9" transform="rotate(${f((a * 180) / Math.PI)} ${f(Math.cos(a) * 8.6)} ${f(Math.sin(a) * 8.6)})" fill="#1c1a10"/>`;
  }
  return (
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(1 .86)">` +
    `<circle r="20" fill="#6b5a2e"/>` +
    `<circle r="18.2" fill="url(#${id}-kiwi)"/>` +
    `<ellipse rx="5.5" ry="4" fill="#f4f6dc"/>` +
    seeds +
    `</g>`
  );
}

function blueberry(x: number, y: number, id: string): string {
  return (
    `<g transform="translate(${x} ${y})">` +
    `<circle r="10" fill="url(#${id}-blue)"/>` +
    `<path d="M-2.5,-6.5L0,-4L2.5,-6.5L1.6,-3.2L4,-2.6L0,-1.8L-4,-2.6L-1.6,-3.2Z" fill="#191a35"/>` +
    `<ellipse cx="-4" cy="3" rx="2.2" ry="1.4" fill="#c9cdf3" opacity=".45"/>` +
    `</g>` +
    `<g transform="translate(${x + 15} ${y + 6})"><circle r="8.5" fill="url(#${id}-blue)"/><ellipse cx="-3" cy="2" rx="1.8" ry="1.1" fill="#c9cdf3" opacity=".45"/></g>`
  );
}

function fruitAt(kind: string, slot: [number, number, number], id: string): string {
  const [x, y, r] = slot;
  if (kind === 'cilek') return strawberry(x, y, r, id);
  if (kind === 'muz') return banana(x, y, r);
  if (kind === 'kivi') return kiwi(x, y, r, id);
  return blueberry(x - 6, y, id);
}

// ---- toppings ------------------------------------------------------------------

function blob(rand: () => number, rad: number): string {
  const n = 5 + Math.floor(rand() * 2);
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.5;
    const r = rad * (0.65 + rand() * 0.45);
    pts.push(`${f(Math.cos(a) * r)},${f(Math.sin(a) * r)}`);
  }
  return pts.join(' ');
}

function scatter(rand: () => number, count: number): Pt[] {
  const out: Pt[] = [];
  while (out.length < count) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    out.push([262 + Math.cos(a) * r * 148, 250 + Math.sin(a) * r * 62]);
  }
  return out;
}

const SPRINKLES = ['#e86a8a', '#f2c14e', '#6cc3d5', '#9b7fe0', '#7ed39b', '#fff4e4'];

function topping(kind: string, t: Swatch, rand: () => number, count: number): string {
  let s = '';
  for (const [x, y] of scatter(rand, count)) {
    const rot = Math.round(rand() * 360);
    if (kind === 'renkli') {
      s += `<rect x="-1.4" y="-4" width="2.8" height="8" rx="1.4" fill="${SPRINKLES[Math.floor(rand() * SPRINKLES.length)]}" transform="translate(${f(x)} ${f(y)}) rotate(${rot})"/>`;
    } else if (kind === 'pudra') {
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.8 + rand() * 1.4)}" fill="#fffaf2" opacity="${f(0.55 + rand() * 0.4)}"/>`;
    } else if (kind === 'biskuvi') {
      const w = 5 + rand() * 5;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><rect x="${f(-w / 2)}" y="${f(-w / 2)}" width="${f(w)}" height="${f(w * 0.8)}" rx="1.2" fill="${t.color}"/><rect x="${f(-w / 2)}" y="${f(-w / 2)}" width="${f(w)}" height="${f(w * 0.3)}" rx="1" fill="${t.shade}" opacity=".7"/></g>`;
    } else {
      const rad = 3.2 + rand() * 2.6;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><polygon points="${blob(rand, rad)}" fill="${t.color}" stroke="${t.shade}" stroke-width="1"/><polygon points="${blob(rand, rad * 0.45)}" fill="#fff" opacity=".22"/></g>`;
    }
  }
  return s;
}

// ---- assembly ------------------------------------------------------------------

export interface KovaOptions {
  choice: Choice;
  id: string;
  viewBox?: string;
  label?: string;
}

const byId = (list: Swatch[], id: string) => list.find((s) => s.id === id)!;

export function describe(choice: Choice): string {
  const name = (list: Swatch[], ids: string[]) => ids.map((i) => byId(list, i).label.toLocaleLowerCase('tr'));
  const parts = [
    ...name(sauces, choice.sauces),
    ...name(fruits, choice.fruits),
    ...name(toppings, choice.toppings),
  ];
  return parts.length ? `Bardakta waffle: ${parts.join(', ')}` : 'Sade bardakta waffle';
}

export function kova({ choice, id, viewBox = '0 0 520 620', label }: KovaOptions): string {
  return `<svg class="kova" viewBox="${viewBox}" role="img" aria-label="${label ?? describe(choice)}" xmlns="http://www.w3.org/2000/svg">
  ${defs(id)}
  ${cupBack(id)}
  <g data-layer="waffle">${layerWaffle(id)}</g>
  ${cupFront(id)}
  <g data-layer="sauce">${layerSauce(choice, id)}</g>
  <g data-layer="fruit">${layerFruit(choice, id)}</g>
  <g data-layer="topping">${layerTopping(choice)}</g>
</svg>`;
}

function defs(id: string): string {
  return `<defs>
    <radialGradient id="${id}-gold" cx=".35" cy=".3" r=".9">
      <stop offset="0" stop-color="#f3c47a"/><stop offset=".55" stop-color="#d9913e"/><stop offset="1" stop-color="#a65a1c"/>
    </radialGradient>
    <linearGradient id="${id}-pocket" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9c5418"/><stop offset=".6" stop-color="#c47d35"/><stop offset="1" stop-color="#e2a55a"/>
    </linearGradient>
    <linearGradient id="${id}-paper" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b9a283"/><stop offset=".08" stop-color="#d8c6a8"/><stop offset=".34" stop-color="#fbf4e8"/>
      <stop offset=".6" stop-color="#eee1cb"/><stop offset=".9" stop-color="#c8b292"/><stop offset="1" stop-color="#a8906f"/>
    </linearGradient>
    <linearGradient id="${id}-shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".3" stop-color="#000" stop-opacity="0"/>
      <stop offset=".7" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".5"/>
    </linearGradient>
    <radialGradient id="${id}-inside" cx=".5" cy=".2" r=".8">
      <stop offset="0" stop-color="#8a6a48"/><stop offset="1" stop-color="#4a3322"/>
    </radialGradient>
    <linearGradient id="${id}-berry" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="#ea4652"/><stop offset="1" stop-color="#9c1526"/>
    </linearGradient>
    <radialGradient id="${id}-kiwi" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#d6e98f"/><stop offset=".55" stop-color="#9cc44a"/><stop offset="1" stop-color="#6e9a26"/>
    </radialGradient>
    <radialGradient id="${id}-blue" cx=".35" cy=".3" r=".75">
      <stop offset="0" stop-color="#6b70b8"/><stop offset="1" stop-color="#22234a"/>
    </radialGradient>
    <linearGradient id="${id}-wood" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c79e67"/><stop offset=".4" stop-color="#ead2a6"/><stop offset="1" stop-color="#b98f59"/>
    </linearGradient>
    <radialGradient id="${id}-floor" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <path id="${id}-arc" d="M${f(CUP.cx - cupAt(444).rx + 18)},444 A${f(cupAt(444).rx - 18)},${f(cupAt(444).ry)} 0 0 0 ${f(CUP.cx + cupAt(444).rx - 18)},444"/>
  </defs>`;
}

function cupBack(id: string): string {
  return `<g data-layer="cup">
    <ellipse cx="${CUP.cx}" cy="${CUP.bottom + 14}" rx="170" ry="26" fill="url(#${id}-floor)"/>
    <ellipse cx="${CUP.cx}" cy="${CUP.top}" rx="${CUP.rxTop}" ry="${CUP.ryTop}" fill="url(#${id}-inside)"/>
  </g>`;
}

function layerWaffle(id: string): string {
  return BACK.map(([x, y, s, r], i) => piece(id, x, y, s, r, i === 2 ? 0.06 : 0)).join('') + fork(id) + FRONT.map(([x, y, s, r], i) => piece(id, x, y, s, r, i === 2 ? 0.1 : 0.04)).join('');
}

function cupFront(id: string): string {
  const body =
    `M${CUP.cx - CUP.rxTop},${CUP.top} L${CUP.cx - CUP.rxBot},${CUP.bottom}` +
    ` A${CUP.rxBot},${CUP.ryBot} 0 0 0 ${CUP.cx + CUP.rxBot},${CUP.bottom}` +
    ` L${CUP.cx + CUP.rxTop},${CUP.top} A${CUP.rxTop},${CUP.ryTop} 0 0 1 ${CUP.cx - CUP.rxTop},${CUP.top} Z`;
  const lip = `M${CUP.cx - CUP.rxTop},${CUP.top} A${CUP.rxTop},${CUP.ryTop} 0 0 0 ${CUP.cx + CUP.rxTop},${CUP.top}`;
  return `<g data-layer="cup">
    <path d="${body}" fill="url(#${id}-paper)"/>
    <path d="${band(400, 486)}" fill="#24130a"/>
    <path d="${band(400, 404)}" fill="#e0a458" opacity=".9"/>
    <path d="${band(482, 486)}" fill="#e0a458" opacity=".9"/>
    <text font-family="Instrument Sans Variable, sans-serif" font-size="25" font-weight="600" letter-spacing="9" fill="#f0c98e">
      <textPath href="#${id}-arc" startOffset="50%" text-anchor="middle">İYB WAFFLE</textPath>
    </text>
    <path d="${body}" fill="url(#${id}-shade)"/>
    <path d="${lip}" fill="none" stroke="#fffaf0" stroke-width="7" stroke-linecap="round"/>
    <path d="${lip}" fill="none" stroke="#c8b08c" stroke-width="2" transform="translate(0 4)" stroke-linecap="round" opacity=".7"/>
  </g>`;
}

function layerSauce(choice: Choice, id: string): string {
  if (!choice.sauces.length) return '';
  const rand = rng(7);
  const main = byId(sauces, choice.sauces[0]);
  const blobPts = sauceBlob(rand).d;
  const shine = blobPts.slice(38, 50).map(([x, y]): Pt => [262 + (x - 262) * 0.78, 250 + (y - 254) * 0.62]);
  let s =
    `<radialGradient id="${id}-sauce" cx=".42" cy=".3" r=".75"><stop offset="0" stop-color="${main.color}"/><stop offset=".7" stop-color="${main.color}"/><stop offset="1" stop-color="${main.shade}"/></radialGradient>` +
    `<linearGradient id="${id}-drip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${main.color}"/><stop offset="1" stop-color="${main.shade}"/></linearGradient>` +
    `<path d="${smoothClosed(blobPts)}" fill="${main.shade}" transform="translate(2 6)"/>` +
    `<path d="${smoothClosed(blobPts)}" fill="url(#${id}-sauce)"/>` +
    `<path d="${rimDrips(rand)}" fill="url(#${id}-drip)"/>` +
    `<path d="${smoothOpen(shine)}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="300" cy="236" rx="14" ry="4" fill="#fff" opacity=".28" transform="rotate(-8 300 236)"/>`;
  if (choice.sauces[1]) {
    const second = byId(sauces, choice.sauces[1]);
    const d = drizzle(rng(11));
    s +=
      `<path d="${d}" fill="none" stroke="${second.shade}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(1 3)" opacity=".6"/>` +
      `<path d="${d}" fill="none" stroke="${second.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round" transform="translate(-1.5 -1.5)"/>`;
  }
  return `<g data-id="${id}">${s}</g>`;
}

function layerFruit(choice: Choice, id: string): string {
  if (!choice.fruits.length) return '';
  const count = choice.fruits.length === 1 ? 5 : choice.fruits.length === 2 ? 6 : 8;
  // order slots back to front so nearer fruit overlaps
  const slots = SLOTS.slice(0, count).sort((a, b) => a[1] - b[1]);
  return slots.map((slot, i) => fruitAt(choice.fruits[i % choice.fruits.length], slot, id)).join('');
}

function layerTopping(choice: Choice): string {
  const rand = rng(23);
  const per = choice.toppings.length > 1 ? 18 : 28;
  return choice.toppings
    .map((t) => topping(t, byId(toppings, t), rand, t === 'pudra' ? 120 : t === 'renkli' ? 40 : per))
    .join('');
}
