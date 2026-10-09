// SVG figure builders for geometry, number-line and graph tasks.
// Figures are generated at build time and shipped as SVG strings; the app
// renders them through <img src="data:image/svg+xml,…">, so no markup from
// the content pack is ever injected into the page.

const INK = '#F5F0FF';
const MUTED = '#B9ACD9';
const ACCENT = '#E879F9';
const LIME = '#A3E635';
const GRID = 'rgba(185,172,217,0.25)';
const FONT = "font-family='Onest Variable, system-ui, sans-serif'";

export type Pt = [number, number];

function svg(w: number, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${FONT} font-size="15" fill="${INK}">${body}</svg>`;
}
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (p: Pt, text: string, dx = 0, dy = 0, anchor = 'middle', color = INK) =>
  `<text x="${(p[0] + dx).toFixed(1)}" y="${(p[1] + dy).toFixed(1)}" text-anchor="${anchor}" fill="${color}" font-weight="600">${esc(text)}</text>`;
const poly = (pts: Pt[], stroke = INK, fill = 'rgba(217,70,239,0.12)') =>
  `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
const line = (a: Pt, b: Pt, stroke = INK, width = 2, dash = '') =>
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const dot = (p: Pt, color = ACCENT, r = 4) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${color}"/>`;

/** Small arc marking an angle at vertex `v` between rays towards `a` and `b`. */
function angleMark(v: Pt, a: Pt, b: Pt, text = '', r = 22, color = ACCENT): string {
  const a1 = Math.atan2(a[1] - v[1], a[0] - v[0]);
  const a2 = Math.atan2(b[1] - v[1], b[0] - v[0]);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  const p1: Pt = [v[0] + r * Math.cos(a1), v[1] + r * Math.sin(a1)];
  const p2: Pt = [v[0] + r * Math.cos(a1 + d), v[1] + r * Math.sin(a1 + d)];
  const sweep = d > 0 ? 1 : 0;
  const mid = a1 + d / 2;
  const t: Pt = [v[0] + (r + 16) * Math.cos(mid), v[1] + (r + 16) * Math.sin(mid) + 5];
  return `<path d="M ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A ${r} ${r} 0 0 ${sweep} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" fill="none" stroke="${color}" stroke-width="2"/>${text ? label(t, text, 0, 0, 'middle', color) : ''}`;
}

/** Tick marks on a segment's midpoint (equal sides). */
function tick(a: Pt, b: Pt, count = 1): string {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  const tx = (b[0] - a[0]) / len;
  const ty = (b[1] - a[1]) / len;
  let out = '';
  for (let i = 0; i < count; i++) {
    const o = (i - (count - 1) / 2) * 6;
    const cx = mx + tx * o;
    const cy = my + ty * o;
    out += line([cx - nx * 6, cy - ny * 6], [cx + nx * 6, cy + ny * 6], ACCENT, 2);
  }
  return out;
}

// ---------- Triangles ----------

export interface TriangleOpts {
  names?: [string, string, string]; // A, B, C labels (A left, B top, C right)
  apex?: number; // apex angle in degrees at B (controls shape)
  angles?: Partial<Record<'A' | 'B' | 'C', string>>; // angle labels
  equalSides?: 'AB=BC' | 'none';
  exteriorAt?: 'C' | 'A' | null; // draw the extension and exterior angle mark
  exteriorText?: string;
}

/** Triangle ABC with B at the top. */
export function triangleFigure(o: TriangleOpts = {}): string {
  const [nA, nB, nC] = o.names ?? ['A', 'B', 'C'];
  const apex = o.apex ?? 70;
  const W = 320;
  const H = 220;
  const base = 200;
  const half = (apex / 2) * (Math.PI / 180);
  const height = Math.min(150, (base / 2) / Math.tan(half));
  const A: Pt = [60, 190];
  const C: Pt = [60 + base, 190];
  const B: Pt = [60 + base / 2, 190 - height];
  let body = poly([A, B, C]);
  body += label(A, nA, -14, 6) + label(B, nB, 0, -10) + label(C, nC, 14, 6);
  if (o.equalSides === 'AB=BC') body += tick(A, B) + tick(B, C);
  if (o.angles?.A) body += angleMark(A, C, B, o.angles.A);
  if (o.angles?.B) body += angleMark(B, A, C, o.angles.B);
  if (o.angles?.C) body += angleMark(C, B, A, o.angles.C);
  if (o.exteriorAt === 'C') {
    const D: Pt = [C[0] + 60, C[1]];
    body += line(C, D, MUTED, 2, '6 4') + angleMark(C, D, B, o.exteriorText ?? '', 26, LIME);
  }
  return svg(W + 40, H, body);
}

/** Right triangle with the right angle at C (bottom-left). */
export function rightTriangleFigure(acuteAtA: string, names: [string, string, string] = ['A', 'B', 'C']): string {
  const C: Pt = [60, 190];
  const A: Pt = [260, 190];
  const B: Pt = [60, 60];
  const body = poly([A, B, C]) + `<path d="M 60 170 L 80 170 L 80 190" fill="none" stroke="${ACCENT}" stroke-width="2"/>` +
    label(A, names[0], 14, 6) + label(B, names[1], -12, -4) + label(C, names[2], -14, 16) + angleMark(A, C, B, acuteAtA);
  return svg(320, 220, body);
}

// ---------- Circles ----------

export interface CircleOpts {
  points: { name: string; deg: number }[]; // on the circle, angle in degrees (0 = right, counter-clockwise)
  segments?: [string, string][]; // chords / diameters between named points or 'O'
  angleAt?: { vertex: string; from: string; to: string; text: string }[];
  center?: boolean;
}

export function circleFigure(o: CircleOpts): string {
  const W = 300;
  const H = 300;
  const O: Pt = [150, 150];
  const R = 105;
  const at = (deg: number): Pt => [O[0] + R * Math.cos((-deg * Math.PI) / 180), O[1] + R * Math.sin((-deg * Math.PI) / 180)];
  const pos: Record<string, Pt> = { O };
  for (const p of o.points) pos[p.name] = at(p.deg);
  let body = `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="rgba(217,70,239,0.08)" stroke="${INK}" stroke-width="2"/>`;
  for (const [a, b] of o.segments ?? []) if (pos[a] && pos[b]) body += line(pos[a]!, pos[b]!, INK, 2);
  for (const m of o.angleAt ?? []) if (pos[m.vertex] && pos[m.from] && pos[m.to]) body += angleMark(pos[m.vertex]!, pos[m.from]!, pos[m.to]!, m.text, 20);
  if (o.center !== false) body += dot(O, INK, 3) + label(O, 'O', 0, 18);
  for (const p of o.points) {
    const q = pos[p.name]!;
    const dir: Pt = [(q[0] - O[0]) / R, (q[1] - O[1]) / R];
    body += dot(q) + label(q, p.name, dir[0] * 16, dir[1] * 16 + 5);
  }
  return svg(W, H, body);
}

// ---------- Quadrilaterals ----------

export interface QuadOpts {
  kind: 'parallelogram' | 'rhombus' | 'trapezoid';
  names?: [string, string, string, string]; // A (bottom-left), B (top-left), C (top-right), D (bottom-right)
  angles?: Partial<Record<'A' | 'B' | 'C' | 'D', string>>;
  height?: { from: 'B' | 'C'; text?: string }; // perpendicular from a top vertex to the base
  sideLabels?: Partial<Record<'AB' | 'BC' | 'CD' | 'DA', string>>;
  skew?: number; // horizontal offset of the top side, px
  topWidth?: number; // trapezoid top width, px
}

export function quadFigure(o: QuadOpts): string {
  const [nA, nB, nC, nD] = o.names ?? ['A', 'B', 'C', 'D'];
  const base = 220;
  const h = 120;
  const skew = o.skew ?? (o.kind === 'rhombus' ? 60 : 50);
  const A: Pt = [50, 190];
  const D: Pt = [50 + base, 190];
  const top = o.kind === 'trapezoid' ? (o.topWidth ?? 120) : base;
  const B: Pt = [50 + skew, 190 - h];
  const C: Pt = [50 + skew + top, 190 - h];
  let body = poly([A, B, C, D]);
  body += label(A, nA, -14, 8) + label(B, nB, -8, -8) + label(C, nC, 10, -8) + label(D, nD, 14, 8);
  if (o.angles?.A) body += angleMark(A, D, B, o.angles.A);
  if (o.angles?.B) body += angleMark(B, C, A, o.angles.B);
  if (o.angles?.C) body += angleMark(C, B, D, o.angles.C);
  if (o.angles?.D) body += angleMark(D, A, C, o.angles.D);
  if (o.height) {
    const from = o.height.from === 'B' ? B : C;
    const foot: Pt = [from[0], 190];
    body += line(from, foot, LIME, 2, '6 4') + `<path d="M ${foot[0] - 10} 190 L ${foot[0] - 10} 180 L ${foot[0]} 180" fill="none" stroke="${LIME}" stroke-width="2"/>` + label([foot[0], (from[1] + 190) / 2], o.height.text ?? 'h', 14, 5, 'start', LIME) + label(foot, 'H', 0, 20);
  }
  const mids: Record<string, Pt> = { AB: [(A[0] + B[0]) / 2 - 14, (A[1] + B[1]) / 2], BC: [(B[0] + C[0]) / 2, B[1] - 10], CD: [(C[0] + D[0]) / 2 + 16, (C[1] + D[1]) / 2], DA: [(A[0] + D[0]) / 2, 212] };
  for (const [side, text] of Object.entries(o.sideLabels ?? {})) if (text) body += label(mids[side]!, text, 0, 5, 'middle', MUTED);
  return svg(360, 230, body);
}

// ---------- Grid paper ----------

/** Polygon on 1 cm grid; `cells` = size of the drawn grid. */
export function gridFigure(points: Pt[], cells = 12, cell = 22): string {
  const pad = 10;
  const size = cells * cell + pad * 2;
  let body = '';
  for (let i = 0; i <= cells; i++) {
    body += line([pad + i * cell, pad], [pad + i * cell, pad + cells * cell], GRID, 1) + line([pad, pad + i * cell], [pad + cells * cell, pad + i * cell], GRID, 1);
  }
  const px = (p: Pt): Pt => [pad + p[0] * cell, pad + (cells - p[1]) * cell];
  body += poly(points.map(px), ACCENT, 'rgba(217,70,239,0.25)');
  for (const p of points) body += dot(px(p), INK, 3);
  return svg(size, size, body);
}

// ---------- Number line ----------

export function numberLineFigure(from: number, to: number, x: number, mark = 'x'): string {
  const W = 360;
  const step = 300 / (to - from);
  const X = (v: number) => 30 + (v - from) * step;
  let body = line([10, 70], [350, 70], INK, 2) + `<path d="M 342 64 L 352 70 L 342 76" fill="none" stroke="${INK}" stroke-width="2"/>`;
  for (let v = from; v <= to; v++) body += line([X(v), 64], [X(v), 76], INK, 2) + label([X(v), 98], String(v));
  body += dot([X(x), 70], ACCENT, 5) + label([X(x), 50], mark, 0, 0, 'middle', ACCENT);
  return svg(W, 110, body);
}

// ---------- Function graphs ----------

export type Curve = { kind: 'line'; k: number; b: number } | { kind: 'parabola'; a: number; b: number; c: number } | { kind: 'hyperbola'; k: number };

/** One small coordinate plane with a curve, titled (А/Б/В). */
export function graphPanel(curve: Curve, title: string, size = 150): string {
  const half = size / 2;
  const unit = size / 12; // −6…6
  const X = (x: number) => half + x * unit;
  const Y = (y: number) => half - y * unit;
  let body = `<rect width="${size}" height="${size}" fill="rgba(255,255,255,0.03)"/>`;
  for (let i = -6; i <= 6; i++) body += line([X(i), 0], [X(i), size], GRID, 1) + line([0, Y(i)], [size, Y(i)], GRID, 1);
  body += line([0, half], [size, half], INK, 1.5) + line([half, 0], [half, size], INK, 1.5);
  const f = (x: number): number | null => {
    if (curve.kind === 'line') return curve.k * x + curve.b;
    if (curve.kind === 'parabola') return curve.a * x * x + curve.b * x + curve.c;
    return Math.abs(x) < 1e-6 ? null : curve.k / x;
  };
  const paths: string[] = [];
  let d = '';
  for (let x = -6; x <= 6.001; x += 0.1) {
    const y = f(x);
    if (y === null || Math.abs(y) > 7) {
      if (d) paths.push(d);
      d = '';
      continue;
    }
    d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)} `;
  }
  if (d) paths.push(d);
  for (const p of paths) body += `<path d="${p}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`;
  body += label([12, 18], title, 0, 0, 'start');
  return `<g>${body}</g>`;
}

export function graphsFigure(curves: Curve[], titles = ['А', 'Б', 'В']): string {
  const size = 150;
  const gap = 12;
  const body = curves.map((c, i) => `<g transform="translate(${i * (size + gap)},0)">${graphPanel(c, titles[i] ?? '', size)}</g>`).join('');
  return svg(curves.length * (size + gap) - gap, size, body);
}

// ---------- Additional figures for the 2026 prototypes ----------

/** Right triangle (C = 90°) with side labels; opposite/adjacent for trig tasks. */
export function rightTriangleSides(sides: { AB?: string; BC?: string; AC?: string }, angleAtB = ''): string {
  const C: Pt = [60, 190];
  const A: Pt = [280, 190];
  const B: Pt = [60, 60];
  let body = poly([A, B, C]) + `<path d="M 60 170 L 80 170 L 80 190" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  body += label(A, 'A', 14, 6) + label(B, 'B', -12, -4) + label(C, 'C', -14, 16);
  if (sides.AB) body += label([(A[0] + B[0]) / 2 + 14, (A[1] + B[1]) / 2 - 6], sides.AB, 0, 0, 'start', MUTED);
  if (sides.BC) body += label([(B[0] + C[0]) / 2 - 14, (B[1] + C[1]) / 2 + 5], sides.BC, 0, 0, 'end', MUTED);
  if (sides.AC) body += label([(A[0] + C[0]) / 2, 214], sides.AC, 0, 0, 'middle', MUTED);
  if (angleAtB) body += angleMark(B, C, A, angleAtB);
  return svg(320, 230, body);
}

/** Two tangents from an external point C touching the circle at A and B; angle ACB is marked. */
export function tangentsFigure(angleText: string): string {
  const O: Pt = [120, 150];
  const R = 80;
  const d = 230; // |OC|
  const C: Pt = [O[0] + d, O[1]];
  const t = Math.acos(R / d);
  const A: Pt = [O[0] + R * Math.cos(t), O[1] - R * Math.sin(t)];
  const B: Pt = [O[0] + R * Math.cos(t), O[1] + R * Math.sin(t)];
  let body = `<circle cx="${O[0]}" cy="${O[1]}" r="${R}" fill="rgba(217,70,239,0.08)" stroke="${INK}" stroke-width="2"/>`;
  body += line(C, A) + line(C, B) + line(O, A, MUTED, 1.5, '5 4') + line(O, B, MUTED, 1.5, '5 4');
  body += dot(O, INK, 3) + label(O, 'O', -14, 5) + dot(A) + label(A, 'A', 0, -10) + dot(B) + label(B, 'B', 0, 20) + dot(C) + label(C, 'C', 14, 5);
  body += angleMark(C, B, A, angleText, 30);
  return svg(380, 300, body);
}

/** Isosceles trapezoid ABCD (AD bottom) with diagonal AC and the angle at A marked. */
export function trapezoidDiagonalFigure(top: string, bottom: string, angleText: string): string {
  const A: Pt = [40, 190];
  const D: Pt = [300, 190];
  const B: Pt = [110, 90];
  const C: Pt = [230, 90];
  let body = poly([A, B, C, D]) + line(A, C, ACCENT, 2);
  body += label(A, 'A', -14, 8) + label(B, 'B', -6, -8) + label(C, 'C', 8, -8) + label(D, 'D', 14, 8);
  body += label([170, 80], top, 0, 0, 'middle', MUTED) + label([170, 214], bottom, 0, 0, 'middle', MUTED);
  body += angleMark(A, D, C, angleText, 34);
  return svg(340, 230, body);
}

/** Number line with a shaded solution set: inside (a; b) or outside; endpoints hollow when strict. */
export function solutionSetFigure(a: number, b: number, inside: boolean, strict = true): string {
  const from = a - 2;
  const to = b + 2;
  const step = 300 / (to - from);
  const X = (v: number) => 30 + (v - from) * step;
  let body = line([10, 70], [350, 70], INK, 2) + `<path d="M 342 64 L 352 70 L 342 76" fill="none" stroke="${INK}" stroke-width="2"/>`;
  const shade = (x1: number, x2: number) => `<rect x="${x1}" y="46" width="${x2 - x1}" height="24" fill="rgba(217,70,239,0.3)"/>` + `<path d="M ${x1} 46 ${x2} 46 M ${x1} 46 L ${x1} 70" fill="none" stroke="${ACCENT}" stroke-width="2"/>`;
  body += inside ? shade(X(a), X(b)) : shade(12, X(a)) + shade(X(b), 350);
  body += label([X(a), 98], String(a)) + label([X(b), 98], String(b));
  const end = (v: number) => `<circle cx="${X(v)}" cy="70" r="5" fill="${strict ? '#1A0B2E' : ACCENT}" stroke="${ACCENT}" stroke-width="2"/>`;
  body += end(a) + end(b);
  return svg(360, 110, body);
}

/** Two circles on grid paper; radii given as squares of cell lengths (centers on grid nodes). */
export function gridCirclesFigure(r1sq: number, r2sq: number, cells = 12, cell = 22): string {
  const pad = 10;
  const size = cells * cell + pad * 2;
  let body = '';
  for (let i = 0; i <= cells; i++) body += line([pad + i * cell, pad], [pad + i * cell, pad + cells * cell], GRID, 1) + line([pad, pad + i * cell], [pad + cells * cell, pad + i * cell], GRID, 1);
  const r1 = Math.sqrt(r1sq) * cell;
  const r2 = Math.sqrt(r2sq) * cell;
  const c1: Pt = [pad + 3 * cell, pad + 6 * cell];
  const c2: Pt = [pad + 8 * cell, pad + 6 * cell];
  body += `<circle cx="${c1[0]}" cy="${c1[1]}" r="${r1.toFixed(1)}" fill="rgba(163,230,53,0.2)" stroke="${LIME}" stroke-width="2"/>` + dot(c1, INK, 3);
  body += `<circle cx="${c2[0]}" cy="${c2[1]}" r="${r2.toFixed(1)}" fill="rgba(217,70,239,0.2)" stroke="${ACCENT}" stroke-width="2"/>` + dot(c2, INK, 3);
  return svg(size, size, body);
}

/** Number line from 0 to `max` with tenths and a marked point A (position as a fraction). */
export function fractionPointFigure(value: number, max = 2, mark = 'A'): string {
  const step = 320 / max;
  const X = (v: number) => 20 + v * step;
  let body = line([10, 70], [350, 70], INK, 2);
  for (let v = 0; v <= max * 10; v++) {
    const major = v % 10 === 0;
    body += line([X(v / 10), major ? 62 : 66], [X(v / 10), major ? 78 : 74], major ? INK : MUTED, major ? 2 : 1);
    if (major) body += label([X(v / 10), 98], String(v / 10));
  }
  body += dot([X(value), 70], ACCENT, 5) + label([X(value), 48], mark, 0, 0, 'middle', ACCENT);
  return svg(360, 110, body);
}
