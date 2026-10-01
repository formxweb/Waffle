#version 300 es
precision highp float;

// A macro shot of one round waffle on a dark slate, rendered as a heightfield:
// grid pockets, a puffy rim, a chocolate drizzle that pours on at load, sugar dust,
// steam. World units are waffle cells; y is up.

uniform vec2 uRes;
uniform float uTime;
uniform float uPour;    // 0..1, drizzle draw-on
uniform vec2 uLight;    // pointer, -1..1, smoothed
uniform float uScroll;  // 0..1 through the hero
uniform float uPortrait;
uniform float uSteps;   // march budget

out vec4 fragColor;

#define HMAX 0.22
#define THICK 0.9
#define RADIUS 5.6
#define EDGE 0.55
#define SAUCE 0.05
#define LINES 5

const vec2 WC = vec2(5.0, 5.0);   // waffle centre on the slate
const vec2 SPOT = vec2(4.2, 4.0); // centre of the key light's pool
const float GRID_ROT = 0.66;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
             mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

// isotropic grain so steep pocket walls do not smear a 2D texture
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x),
                 mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x),
                 mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = rot(0.7) * p * 2.03 + 3.1; a *= 0.5; }
  return s;
}

float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// ---- chocolate drizzle --------------------------------------------------
// Lines run across the waffle in a rotated frame (u along, v across).
// Returns distance-ish |v - centre| normalised by width, and whether poured.
const mat2 DRIZ = mat2(0.906, -0.423, 0.423, 0.906); // ~25deg

float lineCentre(int i, float u) {
  float fi = float(i);
  return -3.2 + fi * 1.55 + 0.42 * sin(u * 0.62 + fi * 1.9) + 0.18 * sin(u * 1.7 + fi * 4.1);
}

float lineWidth(int i, float u) {
  float fi = float(i);
  return 0.15 + 0.09 * hash12(vec2(fi, 3.0)) + 0.035 * sin(u * 1.3 + fi * 2.0);
}

// sauce profile in [0,1] and the line's flow coordinate along it
float drizzle(vec2 c, out float along) {
  vec2 d = DRIZ * c;
  float best = 0.0;
  along = 0.0;
  for (int i = 0; i < LINES; i++) {
    float fi = float(i);
    // pours from left to right, staggered
    float start = -9.0;
    float span = 18.0;
    // lines wander at most ~0.6 from their rail; skip the far ones cheaply
    if (abs(d.y - (-3.2 + fi * 1.55)) > 0.95) continue;
    float t = clamp(uPour * 1.35 - fi * 0.08, 0.0, 1.0);
    float head = start + span * (1.0 - pow(1.0 - t, 2.2));
    float u = d.x;
    float w = lineWidth(i, u);
    float dv = abs(d.y - lineCentre(i, u));
    // slope correction keeps width constant on curves
    float slope = 0.42 * 0.62 * cos(u * 0.62 + fi * 1.9) + 0.18 * 1.7 * cos(u * 1.7 + fi * 4.1);
    dv /= sqrt(1.0 + slope * slope);
    // rounded head: a bulb where the pour currently is
    float bulb = smoothstep(0.6, 0.0, abs(u - head)) * 0.35 * (1.0 - smoothstep(0.92, 1.0, t));
    w *= 1.0 + bulb;
    float cut = smoothstep(head + 0.02, head - 0.12, u);
    float prof = clamp(1.0 - (dv * dv) / (w * w), 0.0, 1.0) * cut;
    if (prof > best) { best = prof; along = u; }
  }
  return best;
}

// ---- scene heightfield ------------------------------------------------------
// mat: 0 waffle, 1 chocolate, 2 slate. lod fades detail with pixel footprint.
float height(vec2 p, float lod, out float mat, out float ridgeOut, out float rimOut) {
  vec2 c = p - WC;
  float r = length(c);
  float inside = RADIUS - r;

  vec2 g = rot(GRID_ROT) * c;
  vec2 cell = floor(g);
  vec2 q = fract(g) - 0.5;
  float d = sdRoundBox(q, vec2(0.33), 0.12);
  float ridge = smoothstep(-0.1, 0.07, d);
  // far away, pockets average out instead of aliasing
  ridge = mix(ridge, 0.58, smoothstep(0.08, 0.32, lod));
  float h = ridge * HMAX;
  // pocket floors are slightly domed, ridge tops slightly rounded
  h += (1.0 - ridge) * 0.03 * (1.0 - dot(q, q) * 3.2);
  h -= ridge * smoothstep(0.02, 0.14, d) * 0.012;
  h += (vnoise(g * 0.9) - 0.5) * 0.014;

  // puffy rim where the iron leaves no pockets
  float rim = smoothstep(EDGE + 0.55, EDGE + 0.12, inside);
  h = mix(h, HMAX * 1.08, rim);
  // rounded edge down to the slate
  float t = clamp(inside / EDGE, 0.0, 1.0);
  float prof = sqrt(1.0 - (1.0 - t) * (1.0 - t));
  float slate = -THICK;
  h = mix(slate, h, prof);
  ridgeOut = ridge;
  rimOut = rim;
  mat = inside > 0.0 ? 0.0 : 2.0;

  // chocolate
  float along;
  float s = drizzle(c, along);
  if (s > 0.0 && inside > -0.25) {
    // the sauce bridges pockets with a sag and sits on the ridges
    float base = smax(h, HMAX - 0.1 + rim * 0.08, 0.11);
    // over the edge the sauce follows the waffle down
    base = mix(h, base, smoothstep(0.0, 0.35, inside));
    float sh = base + pow(s, 0.3) * SAUCE;
    if (sh > h) { h = sh; mat = 1.0; }
  }

  // sauce that ran into pockets near a line
  float ph = HMAX * 0.62;
  if (inside > 0.9 && ridge < 0.5 && h < ph && hash12(cell + 17.0) > 0.62) {
    vec2 cc = (cell + 0.5) * rot(GRID_ROT); // inverse rotation: row-vector form
    float al;
    if (drizzle(cc, al) > 0.001) { h = ph; mat = 1.0; }
  }
  return h;
}

float heightOnly(vec2 p, float lod) {
  float m, rg, rm;
  return height(p, lod, m, rg, rm);
}

vec3 normalAt(vec2 p, float lod, float e) {
  float hx = heightOnly(p + vec2(e, 0), lod) - heightOnly(p - vec2(e, 0), lod);
  float hz = heightOnly(p + vec2(0, e), lod) - heightOnly(p - vec2(0, e), lod);
  return normalize(vec3(-hx, 2.0 * e, -hz));
}

// soft shadow through the heightfield
float shadow(vec3 p, vec3 L, float lod) {
  float res = 1.0;
  float t = 0.02;
  for (int i = 0; i < 22; i++) {
    vec3 q = p + L * t;
    if (q.y > HMAX + SAUCE + 0.05) break;
    float h = heightOnly(q.xz, lod);
    float d = q.y - h;
    res = min(res, 9.0 * d / t);
    if (res < 0.0) break;
    t += clamp(d * 0.6, 0.025, 0.25);
  }
  return clamp(res, 0.0, 1.0);
}

// warm studio: a big softbox up and behind, falling off to black
vec3 env(vec3 r, vec3 L) {
  float box = smoothstep(0.82, 0.97, dot(r, L));
  float sky = smoothstep(-0.1, 0.8, r.y);
  return vec3(1.0, 0.82, 0.62) * box * 5.0 + vec3(0.09, 0.06, 0.045) * sky;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;

  // camera: high and steep on portrait, lower and longer on landscape
  float sc = uScroll;
  float drift = sin(uTime * 0.05) * 0.25;
  vec3 ro = mix(vec3(-1.4 + drift, 6.0, -3.2), vec3(3.2 + drift * 0.6, 11.5, -4.6), uPortrait);
  vec3 ta = mix(vec3(2.4, 0.0, 4.6), vec3(4.6, 0.0, 6.2), uPortrait);
  ro += vec3(0.25, -0.9, 1.6) * sc;
  ta += vec3(0.2, 0.0, 0.9) * sc;
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(vec3(0, 1, 0), ww));
  vec3 vv = cross(ww, uu);
  float zoom = mix(1.9, 1.3, uPortrait);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + zoom * ww);
  float pixAngle = 1.0 / (uRes.y * zoom);

  vec3 L = normalize(vec3(-0.55 + 0.35 * uLight.x, 0.62 + 0.12 * uLight.y, 0.9));
  vec3 keyCol = vec3(1.0, 0.86, 0.68) * 3.1;
  vec3 bg = vec3(0.012, 0.0075, 0.005);

  // march: start where the ray enters the top slab
  float top = HMAX + SAUCE + 0.02;
  float bottom = -THICK - 0.01;
  vec3 col = bg;
  float tHit = -1.0;
  if (rd.y < 0.0) {
    float t = (ro.y - top) / -rd.y;
    float tEnd = (ro.y - bottom) / -rd.y;
    float prevT = t, prevD = 1.0;
    for (int i = 0; i < 140; i++) {
      if (float(i) >= uSteps || t > tEnd) break;
      vec3 p = ro + rd * t;
      float lod = t * pixAngle;
      float h = heightOnly(p.xz, lod);
      float d = p.y - h;
      if (d < 0.0) {
        // refine between the last two samples
        float a = prevT, b = t;
        for (int k = 0; k < 6; k++) {
          float m = 0.5 * (a + b);
          vec3 pm = ro + rd * m;
          if (pm.y - heightOnly(pm.xz, m * pixAngle) < 0.0) b = m; else a = m;
        }
        tHit = 0.5 * (a + b);
        break;
      }
      prevT = t; prevD = d;
      t += max(d * 0.55, 0.012 + t * 0.0015);
    }
    if (tHit < 0.0) tHit = tEnd;
  }

  if (tHit > 0.0) {
    vec3 p = ro + rd * tHit;
    float lod = tHit * pixAngle;
    float mat, ridge, rim;
    float h = height(p.xz, lod, mat, ridge, rim);
    vec3 n = normalAt(p.xz, lod, 0.012 + lod * 0.6);
    vec3 V = -rd;
    vec2 c = p.xz - WC;
    float detail = 1.0 - smoothstep(0.02, 0.12, lod);

    float sh = shadow(p + n * 0.01, L, lod);
    // the key is a spot: a warm pool on the waffle, falling off into the dark
    vec2 sp = p.xz - SPOT;
    float pool = mix(0.18, 1.0, exp(-dot(sp, sp) / 14.0));
    vec3 key = keyCol * pool;
    vec3 tp = vec3(c.x, p.y, c.y);
    // occlusion: pocket floors and corners see less sky
    float ao = mix(0.45, 1.0, smoothstep(-0.02, HMAX, h));
    vec3 lin;

    if (mat < 0.5) {
      // dough: golden pockets, browner ridge tops and rim, blotchy browning
      vec2 g = rot(GRID_ROT) * c;
      float brown = fbm(c * 0.55) * 0.7 + fbm(c * 2.3) * 0.3;
      float cellTone = vnoise(g * 0.7) - 0.5;
      vec3 pocket = vec3(0.70, 0.40, 0.15);
      vec3 crest = vec3(0.42, 0.19, 0.06);
      vec3 alb = mix(pocket, crest, clamp(ridge * 0.85 + rim * 0.4 + (brown - 0.5) * 0.9 + cellTone * 0.25, 0.0, 1.0));
      alb *= 0.88 + 0.24 * vnoise3(tp * 24.0) * detail;
      // micro bumps from the crumb
      vec3 bn = vec3(vnoise3(tp * 34.0), vnoise3(tp * 34.0 + 7.3), vnoise3(tp * 34.0 + 13.1)) - 0.5;
      vec3 nb = normalize(n + bn * 0.2 * detail);
      // powdered sugar on upward faces, in drifts
      float drift2 = smoothstep(0.55, 0.85, fbm(c * 0.8 + 4.0));
      float speck = smoothstep(0.86, 0.93, vnoise3(tp * 90.0)) * detail;
      float sugar = clamp(drift2 * (0.28 + speck * 0.5) * smoothstep(0.8, 0.97, nb.y), 0.0, 0.7);
      alb = mix(alb, vec3(0.93, 0.9, 0.86), sugar);
      // the waffle edge darkens where it baked longest
      float edgeT = smoothstep(EDGE + 0.4, 0.0, RADIUS - length(c));
      alb = mix(alb, vec3(0.32, 0.14, 0.04), edgeT * 0.6);

      float dif = max(dot(nb, L), 0.0);
      float wrap = max((dot(nb, L) + 0.35) / 1.35, 0.0);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(nb, H), 0.0), 28.0) * 0.22 * (1.0 - sugar);
      lin = alb * key * mix(wrap * 0.25, dif, 0.8) * sh;
      lin += alb * vec3(0.32, 0.22, 0.16) * (0.5 + 0.5 * nb.y) * ao * 0.55;
      lin += alb * alb * vec3(1.0, 0.55, 0.25) * 0.12 * (1.0 - ridge) * ao; // warm bounce in pockets
      lin += key * spec * sh;
    } else if (mat < 1.5) {
      // chocolate: almost black, glossy
      vec3 alb = vec3(0.045, 0.018, 0.008);
      vec3 H = normalize(L + V);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
      float spec = pow(max(dot(n, H), 0.0), 220.0) * 6.0;
      vec3 R = reflect(rd, n);
      lin = alb * key * max(dot(n, L), 0.0) * sh;
      lin += alb * vec3(0.3, 0.2, 0.15) * ao;
      lin += (key * spec * sh + env(R, L) * 0.55 * pool) * fres * 1.6;
      lin += vec3(0.16, 0.06, 0.02) * pow(1.0 - max(dot(n, V), 0.0), 3.0) * 0.4; // warm rim
    } else {
      // slate: very dark, faintly textured, with the waffle's shadow
      float tex = fbm(p.xz * 1.7) * 0.5 + 0.5;
      vec3 alb = vec3(0.022, 0.017, 0.014) * (0.7 + 0.5 * tex);
      vec3 H = normalize(L + V);
      float spec = pow(max(dot(n, H), 0.0), 40.0) * 0.18;
      float contact = smoothstep(0.0, 1.4, length(c) - RADIUS);
      lin = alb * key * max(dot(n, L), 0.0) * sh * contact;
      lin += key * spec * sh * 0.4 * contact;
      lin += alb * 0.6;
    }

    // atmospheric falloff keeps the eye near the front
    float fog = 1.0 - exp(-max(tHit - 10.5, 0.0) * 0.14);
    col = mix(lin, bg, fog);
  }

  // steam lifting off the hot waffle
  vec2 su = uv * vec2(2.2, 1.4);
  float rise = uTime * 0.09;
  float steam = fbm(vec2(su.x * 1.3 + sin(su.y * 2.0 + uTime * 0.2) * 0.3, su.y - rise));
  steam = smoothstep(0.52, 0.86, steam) * smoothstep(-0.55, 0.1, uv.y) * smoothstep(0.55, 0.0, uv.y);
  col += vec3(0.30, 0.24, 0.20) * steam * 0.09;

  // vignette and a dark band behind the headline
  float vig = smoothstep(1.35, 0.25, length(uv * vec2(0.85, 1.0)));
  col *= mix(0.35, 1.0, vig);

  col = aces(col * 1.05);
  col = pow(col, vec3(1.0 / 2.2));
  // film grain
  float grain = hash12(frag + fract(uTime * 13.0) * 431.0) - 0.5;
  col += grain * 0.022;
  fragColor = vec4(col, 1.0);
}
