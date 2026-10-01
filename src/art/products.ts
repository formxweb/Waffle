import type { ArtId } from '../content.ts';
import { signatureChoice } from '../content.ts';
import { kova, defs as kovaDefs, rng, smoothClosed, strawberry, banana, blueberry, type Pt } from './kova.ts';

/**
 * One drawing per product type, in the same hand as the kova: flat shapes, soft gradients,
 * a single warm light from the top left. Each returns a self-contained SVG string, so they can be
 * rendered at build time. viewBox is 400×300 (4:3) everywhere, the product sits on y≈265.
 */

const f = (n: number) => Math.round(n * 10) / 10;

function extraDefs(id: string): string {
  return `<defs>
    <pattern id="${id}-grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect x="3" y="3" width="10" height="10" rx="2.4" fill="url(#${id}-pocket)"/>
    </pattern>
    <pattern id="${id}-grid2" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect x="4" y="4" width="16" height="16" rx="3.6" fill="url(#${id}-pocket)"/>
      <path d="M5.5,18 V6.5 Q5.5,5.5 6.5,5.5 H18" stroke="#5a2a08" stroke-opacity=".4" stroke-width="1.6" fill="none"/>
    </pattern>
    <radialGradient id="${id}-sph" cx=".36" cy=".3" r=".75">
      <stop offset="0" stop-color="#fde6ae"/><stop offset=".5" stop-color="#e4a24e"/><stop offset="1" stop-color="#a95f22"/>
    </radialGradient>
    <pattern id="${id}-bub" width="22" height="19.05" patternUnits="userSpaceOnUse">
      <rect width="22" height="19.05" fill="#9a541b"/>
      <circle cx="0" cy="0" r="5.6" fill="url(#${id}-sph)"/><circle cx="22" cy="0" r="5.6" fill="url(#${id}-sph)"/>
      <circle cx="11" cy="9.52" r="5.6" fill="url(#${id}-sph)"/>
      <circle cx="0" cy="19.05" r="5.6" fill="url(#${id}-sph)"/><circle cx="22" cy="19.05" r="5.6" fill="url(#${id}-sph)"/>
    </pattern>
    <linearGradient id="${id}-choc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6a3317"/><stop offset="1" stop-color="#2c1309"/>
    </linearGradient>
    <linearGradient id="${id}-kraft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#a77d4b"/><stop offset=".35" stop-color="#e2c393"/><stop offset=".7" stop-color="#c9a271"/><stop offset="1" stop-color="#94693a"/>
    </linearGradient>
    <linearGradient id="${id}-board" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c79a62"/><stop offset="1" stop-color="#9c7240"/>
    </linearGradient>
    <radialGradient id="${id}-cer" cx=".4" cy=".3" r=".8">
      <stop offset="0" stop-color="#fffaf2"/><stop offset="1" stop-color="#d9ccb8"/>
    </radialGradient>
    <radialGradient id="${id}-shadow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

const shadow = (id: string, cx: number, cy: number, rx: number, ry: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-shadow)"/>`;

const gloss = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="3" stroke-linecap="round"/>`;

function sprinkles(rand: () => number, cx: number, cy: number, rx: number, ry: number, n: number): string {
  const colors = ['#e86a8a', '#f2c14e', '#6cc3d5', '#9b7fe0', '#7ed39b', '#fff4e4'];
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
    s += `<rect x="-1.2" y="-3.4" width="2.4" height="6.8" rx="1.2" fill="${colors[Math.floor(rand() * colors.length)]}" transform="translate(${f(cx + Math.cos(a) * r * rx)} ${f(cy + Math.sin(a) * r * ry)}) rotate(${Math.round(rand() * 180)})"/>`;
  }
  return s;
}

function sugar(rand: () => number, cx: number, cy: number, rx: number, ry: number, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
    s += `<circle cx="${f(cx + Math.cos(a) * r * rx)}" cy="${f(cy + Math.sin(a) * r * ry)}" r="${f(0.6 + rand() * 1.1)}" fill="#fffaf2" opacity="${f(0.5 + rand() * 0.45)}"/>`;
  }
  return s;
}

/** A wavy lower edge of poured chocolate between x0 and x1 at height y, drips hanging down. */
function chocolateCap(x0: number, x1: number, top: number, y: number, rand: () => number): string {
  const pts: Pt[] = [[x0, top], [x1, top]];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const x = x1 - ((x1 - x0) * i) / n;
    const drip = i > 0 && i < n && rand() > 0.45 ? 10 + rand() * 22 : rand() * 6;
    pts.push([x, y + drip]);
  }
  return smoothClosed(pts);
}

// ---- products ----------------------------------------------------------------------

function bubble(id: string): string {
  const rand = rng(31);
  // the open bubble waffle, wrapped in a kraft cone
  const shell = 'M118,96 C114,130 126,160 146,188 L254,188 C274,160 286,130 282,96 Z';
  let rimBumps = '';
  for (let i = 0; i <= 13; i++) {
    const a = Math.PI + (i / 13) * Math.PI;
    rimBumps += `<circle cx="${f(200 + Math.cos(a) * 82)}" cy="${f(96 + Math.sin(a) * 22)}" r="6.2" fill="url(#${id}-sph)"/>`;
  }
  const mound = smoothClosed([
    [128, 98], [146, 72], [170, 58], [200, 52], [232, 58], [256, 70], [272, 96], [250, 112], [200, 118], [150, 112],
  ]);
  const drips = `<path d="M150,108 q4,22 8,0 M196,116 q5,30 10,0 M238,108 q4,18 8,0" fill="none" stroke="#3a1a0c" stroke-width="9" stroke-linecap="round"/>`;
  return (
    shadow(id, 200, 276, 92, 10) +
    `<path d="${shell}" fill="url(#${id}-bub)"/>` +
    `<path d="${shell}" fill="#7a3f12" opacity=".18"/>` +
    `<ellipse cx="200" cy="96" rx="82" ry="22" fill="#6a3615"/>` +
    rimBumps +
    `<path d="${mound}" fill="url(#${id}-choc)"/>` +
    drips +
    gloss('M164,68 Q186,56 214,58') +
    `<path d="M150,82 l14,-14 l12,16 l14,-18 l12,18 l14,-16 l12,16 l14,-12" fill="none" stroke="#f3e6cf" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    strawberry(172, 58, -18, id) +
    strawberry(226, 54, 14, id) +
    banana(200, 76, 8) +
    blueberry(246, 80, id) +
    sprinkles(rand, 200, 84, 60, 14, 14) +
    `<path d="M136,176 L264,176 L212,286 Q200,294 188,286 Z" fill="url(#${id}-kraft)"/>` +
    `<path d="M136,176 L264,176 L259,187 L141,187 Z" fill="#7d5730" opacity=".55"/>` +
    `<text x="200" y="226" text-anchor="middle" font-family="Instrument Sans, sans-serif" font-size="15" font-weight="600" letter-spacing="4" fill="#5a3a1a" opacity=".75">İYB</text>`
  );
}

function bardak(id: string): string {
  // reuse the kova at card scale; strip its own <svg> wrapper so it nests in ours
  const inner = kova({ choice: signatureChoice, id: `${id}k`, viewBox: '0 0 520 620' })
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');
  return `<g transform="translate(118 14) scale(.44)">${inner}</g>`;
}

function cicek(id: string): string {
  const rand = rng(41);
  const petals: Pt[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const r = 104 + 15 * Math.cos(a * 8);
    petals.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const flower = smoothClosed(petals);
  const sy = 0.66;
  const pool = smoothClosed(
    Array.from({ length: 24 }, (_, i): Pt => {
      const a = (i / 24) * Math.PI * 2;
      const r = 44 + 6 * Math.sin(a * 5) + rand() * 4;
      return [Math.cos(a) * r, Math.sin(a) * r];
    }),
  );
  // fruit sits in screen space so it is not squashed by the plate's tilt
  const ring = [0.3, 1.2, 2.1, 3.0, 3.9, 4.8, 5.7].map((a, i) => {
    const x = 200 + Math.cos(a) * 70, y = 150 + Math.sin(a) * 70 * sy;
    return i % 2 ? banana(f(x), f(y), Math.round(a * 30)) : strawberry(f(x), f(y - 6), Math.round(a * 20) - 40, id);
  });
  return (
    shadow(id, 200, 236, 150, 26) +
    `<g transform="translate(200 162) scale(1 ${sy})"><path d="${flower}" fill="#6e360f"/></g>` +
    `<g transform="translate(200 150) scale(1 ${sy})">` +
    `<path d="${flower}" fill="url(#${id}-gold)"/>` +
    `<path d="${flower}" fill="url(#${id}-grid)" transform="scale(.94)"/>` +
    `<path d="${pool}" fill="url(#${id}-choc)"/>` +
    `</g>` +
    gloss('M176,138 Q196,128 222,132') +
    ring.join('') +
    `<path d="M120,170 C150,120 170,180 200,128 C226,180 252,118 282,168" fill="none" stroke="#f3e6cf" stroke-width="4" stroke-linecap="round"/>` +
    sugar(rand, 200, 150, 120, 70, 70)
  );
}

function fondu(id: string): string {
  const rand = rng(53);
  const board = 'M76,196 Q78,186 90,186 L310,186 Q322,186 326,196 L354,254 Q358,264 346,264 L54,264 Q42,264 46,254 Z';
  const pieces: [number, number, number][] = [
    [108, 214, -14],
    [150, 226, 6],
    [196, 218, -6],
    [134, 182, 18],
  ];
  const sq = (x: number, y: number, r: number) =>
    `<g transform="translate(${x} ${y}) rotate(${r})">` +
    `<rect x="-26" y="-20" width="52" height="40" rx="7" fill="#6e360f" transform="translate(2 5)"/>` +
    `<rect x="-26" y="-20" width="52" height="40" rx="7" fill="url(#${id}-gold)"/>` +
    `<rect x="-26" y="-20" width="52" height="40" rx="7" fill="url(#${id}-grid)"/>` +
    `</g>`;
  // the one already dipped, leaning on the bowl
  const dipped =
    `<g transform="translate(236 176) rotate(-28)">` +
    `<rect x="-14" y="-46" width="28" height="78" rx="7" fill="url(#${id}-gold)"/>` +
    `<rect x="-14" y="-46" width="28" height="78" rx="7" fill="url(#${id}-grid)"/>` +
    `<path d="${chocolateCap(-15, 15, -47, -10, rand)}" fill="url(#${id}-choc)"/>` +
    `</g>`;
  return (
    shadow(id, 200, 268, 170, 12) +
    `<path d="${board}" fill="#6f4c25" transform="translate(0 9)"/>` +
    `<path d="${board}" fill="url(#${id}-board)"/>` +
    `<path d="M96,200 L306,200 M84,226 L318,226 M70,248 L332,248" stroke="#8a6234" stroke-opacity=".35" stroke-width="1.5"/>` +
    pieces.map(([x, y, r]) => sq(x, y, r)).join('') +
    // ramekin
    `<path d="M240,190 Q244,240 290,244 Q336,240 340,190 Z" fill="url(#${id}-cer)"/>` +
    `<ellipse cx="290" cy="190" rx="50" ry="15" fill="#efe5d6"/>` +
    `<ellipse cx="290" cy="192" rx="42" ry="11" fill="url(#${id}-choc)"/>` +
    gloss('M262,190 Q280,184 302,186') +
    dipped
  );
}

function belcika(id: string): string {
  const rand = rng(67);
  const m = 'matrix(1 0 -0.42 0.6 214 142)';
  // chocolate that settled in a few pockets (cell indices on the 24px grid)
  const pools: [number, number][] = [[-4, -1], [-2, 1], [0, -3], [2, 0], [-1, 0], [3, -2]];
  return (
    shadow(id, 200, 248, 170, 18) +
    `<ellipse cx="200" cy="200" rx="176" ry="46" fill="url(#${id}-cer)"/>` +
    `<ellipse cx="200" cy="198" rx="150" ry="36" fill="none" stroke="#cdbfa8" stroke-width="1.5"/>` +
    `<g transform="translate(0 16)"><rect x="-132" y="-84" width="264" height="168" rx="16" transform="${m}" fill="#6e360f"/></g>` +
    `<rect x="-132" y="-84" width="264" height="168" rx="16" transform="${m}" fill="url(#${id}-gold)"/>` +
    `<g transform="${m}"><rect x="-132" y="-84" width="264" height="168" rx="16" fill="url(#${id}-grid2)"/>` +
    pools.map(([i, j]) => `<rect x="${i * 24 + 4}" y="${j * 24 + 4}" width="16" height="16" rx="3.6" fill="url(#${id}-choc)"/>`).join('') +
    `</g>` +
    gloss('M150,120 Q170,112 196,114') +
    strawberry(150, 120, -20, id) +
    strawberry(254, 150, 18, id) +
    blueberry(206, 112, id) +
    blueberry(120, 160, id) +
    sugar(rand, 210, 140, 120, 40, 90)
  );
}

function cubuk(id: string): string {
  const stick = (x: number, y: number, r: number, seed: number) => {
    const rr = rng(seed);
    return (
      `<g transform="translate(${x} ${y}) rotate(${r})">` +
      `<rect x="-5" y="34" width="10" height="96" rx="5" fill="url(#${id}-wood)"/>` +
      `<rect x="-33" y="-96" width="66" height="138" rx="18" fill="#6e360f" transform="translate(3 6)"/>` +
      `<rect x="-33" y="-96" width="66" height="138" rx="18" fill="url(#${id}-gold)"/>` +
      `<rect x="-33" y="-96" width="66" height="138" rx="18" fill="url(#${id}-grid)"/>` +
      `<path d="${chocolateCap(-35, 35, -98, -30, rr)}" fill="url(#${id}-choc)"/>` +
      gloss('M-20,-84 Q-12,-90 0,-90') +
      sprinkles(rr, 0, -66, 26, 26, 16) +
      `</g>`
    );
  };
  return shadow(id, 200, 274, 120, 10) + stick(166, 150, -13, 3) + stick(238, 144, 12, 9);
}

function sandwich(id: string): string {
  const rand = rng(97);
  const cx = 200, rx = 124, ry = 36;
  const disc = (cy: number, side: number) =>
    `<path d="M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy + side} A${rx},${ry} 0 0 1 ${cx - rx},${cy + side} Z" fill="#8a4a18" transform="translate(0 0)"/>` +
    `<path d="M${cx - rx},${cy} A${rx},${ry} 0 0 0 ${cx + rx},${cy} L${cx + rx},${cy + side} A${rx},${ry} 0 0 1 ${cx - rx},${cy + side} Z" fill="url(#${id}-gold)" opacity=".55"/>`;
  const filling = (cy: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI - (i / 24) * Math.PI;
      pts.push([cx + Math.cos(a) * (rx + 6), cy + Math.sin(a) * (ry + 4) + (i % 3 === 0 ? 6 + rand() * 8 : rand() * 3)]);
    }
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      pts.push([cx + Math.cos(a) * (rx + 2), cy - 10 + Math.sin(a) * (ry - 2)]);
    }
    return smoothClosed(pts);
  };
  return (
    shadow(id, 200, 262, 150, 12) +
    disc(206, 22) +
    `<path d="${filling(200)}" fill="#f4ead6"/>` +
    `<path d="${filling(190)}" fill="url(#${id}-choc)"/>` +
    strawberry(132, 196, -70, id) +
    banana(258, 200, 20) +
    strawberry(214, 206, 80, id) +
    disc(156, 18) +
    `<clipPath id="${id}-top"><ellipse cx="${cx}" cy="156" rx="${rx}" ry="${ry}"/></clipPath>` +
    `<ellipse cx="${cx}" cy="156" rx="${rx}" ry="${ry}" fill="url(#${id}-gold)"/>` +
    `<g clip-path="url(#${id}-top)"><g transform="translate(${cx} 156) scale(1 .34)"><rect x="-140" y="-120" width="280" height="240" fill="url(#${id}-grid2)"/></g></g>` +
    `<ellipse cx="${cx}" cy="156" rx="${rx}" ry="${ry}" fill="none" stroke="#ffe2a8" stroke-opacity=".35" stroke-width="1.5"/>` +
    sugar(rand, cx, 154, 100, 26, 80)
  );
}

const ART: Record<ArtId, (id: string) => string> = { bubble, bardak, cicek, fondu, belcika, cubuk, sandwich };

export function productArt(art: ArtId, label: string): string {
  const id = `pa-${art}`;
  return `<svg class="product-art" viewBox="0 0 400 300" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${kovaDefs(id)}${extraDefs(id)}${ART[art](id)}</svg>`;
}
