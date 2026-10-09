// Figures for the practical scenarios behind tasks 1–5 (paper formats, tyres).
const INK = '#F5F0FF';
const MUTED = '#B9ACD9';
const ACCENT = '#E879F9';
const LIME = '#A3E635';
const FONT = "font-family='Onest Variable, system-ui, sans-serif'";

type Pt = [number, number];
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}' ${FONT} font-size='15'>${body}</svg>`;
const label = (p: Pt, text: string, anchor = 'middle', color = INK) =>
  `<text x="${p[0]}" y="${p[1]}" fill="${color}" text-anchor="${anchor}" font-weight="600">${text}</text>`;
const line = (a: Pt, b: Pt, stroke = INK, width = 2, dash = '') =>
  `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${stroke}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

/** A0 sheet halved step by step into A1, A2, A3, A4, A5. */
export function paperFigure(): string {
  const W = 283;
  const H = 200;
  const x0 = 20;
  const y0 = 16;
  const rect = (x: number, y: number, w: number, h: number, name: string, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="1.5"/>` + label([x + w / 2, y + h / 2 + 5], name);
  let body = rect(x0, y0, W / 2, H, 'A1', 'rgba(217,70,239,0.18)');
  body += rect(x0 + W / 2, y0, W / 2, H / 2, 'A2', 'rgba(163,230,53,0.16)');
  body += rect(x0 + W / 2, y0 + H / 2, W / 4, H / 2, 'A3', 'rgba(217,70,239,0.12)');
  body += rect(x0 + (3 * W) / 4, y0 + H / 2, W / 4, H / 4, 'A4', 'rgba(163,230,53,0.1)');
  body += rect(x0 + (3 * W) / 4, y0 + (3 * H) / 4, W / 8, H / 4, 'A5', 'rgba(217,70,239,0.08)');
  body += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="${ACCENT}" stroke-width="2.5"/>`;
  body += label([x0 + W / 2, y0 + H + 22], 'A0 — весь лист', 'middle', MUTED);
  return svg(W + 40, H + 50, body);
}

/** Wheel cross-section: disk diameter d, tyre width B, sidewall height H, full diameter D. */
export function tyreFigure(): string {
  const cx = 150;
  const cy = 125;
  const R = 100;
  const r = 62;
  let body = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(217,70,239,0.14)" stroke="${INK}" stroke-width="2"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(163,230,53,0.14)" stroke="${INK}" stroke-width="2"/>`;
  const dx = cx - R - 22;
  body += line([dx, cy - R], [dx, cy + R], ACCENT, 1.5) + line([dx - 6, cy - R], [dx + 6, cy - R], ACCENT, 1.5) + line([dx - 6, cy + R], [dx + 6, cy + R], ACCENT, 1.5);
  body += label([dx - 10, cy + 5], 'D', 'end', ACCENT);
  body += line([cx, cy - r], [cx, cy + r], LIME, 1.5, '4 3') + label([cx + 8, cy + 5], 'd', 'start', LIME);
  body += line([cx + 18, cy - R], [cx + 18, cy - r], ACCENT, 1.5) + label([cx + 24, cy - R + 24], 'H', 'start', ACCENT);
  const bx = 300;
  body += `<rect x="${bx}" y="${cy - R}" width="54" height="${2 * R}" rx="10" fill="rgba(217,70,239,0.14)" stroke="${INK}" stroke-width="2"/>`;
  body += line([bx, cy + R + 16], [bx + 54, cy + R + 16], ACCENT, 1.5) + label([bx + 27, cy + R + 34], 'B', 'middle', ACCENT);
  return svg(380, 270, body);
}
