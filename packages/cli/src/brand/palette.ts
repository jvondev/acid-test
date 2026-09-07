// 🎨 ACID-TEST DEDICATED BRAND PALETTE & TRUECOLOR GRADIENT ENGINE
// Engineered for zero cognitive overload, high contrast, and dark terminal aesthetic

export const BRAND_COLORS = {
  surfaces: {
    base: '#0B0F17',        // Deep Obsidian Black
    card: '#111827',        // Surface Card Layer
    active: '#1E293B',      // Active Selection Layer
    border: '#334155',      // Subtle Dividers
    borderActive: '#10B981',// Active Focus Emerald
  },
  gradient: [
    [5, 150, 105],   // #059669 Deep Jade / Forest Emerald
    [16, 185, 129],  // #10B981 Vivid Emerald
    [34, 197, 94],   // #22C55E Toxic Acid Green
    [132, 204, 22],  // #84CC16 Vibrant Lime
    [163, 230, 53],  // #A3E635 Luminous Acid Lime
  ] as [number, number, number][],
  status: {
    pass: '#10B981',     // Emerald
    fail: '#EF4444',     // Crimson
    warn: '#F59E0B',     // Amber
    info: '#06B6D4',     // Cyan
    muted: '#94A3B8',    // Slate
    dimmed: '#475569',   // Dimmed Gray
    white: '#F8FAFC',    // Crisp White
  },
} as const;

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

export function interpolateRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  factor: number
): [number, number, number] {
  return [
    Math.round(c1[0] + factor * (c2[0] - c1[0])),
    Math.round(c1[1] + factor * (c2[1] - c1[1])),
    Math.round(c1[2] + factor * (c2[2] - c1[2])),
  ];
}

// Precomputed 256-step ANSI Gradient Lookup Table for Zero-Allocation O(1) Color Interpolation
function buildGradientLut(palette: readonly [number, number, number][], steps = 256): string[] {
  const lut: string[] = new Array(steps);
  const segs = palette.length - 1;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const p = t * segs;
    const idx = Math.min(Math.floor(p), segs - 1);
    const localP = p - idx;
    const [r, g, b] = interpolateRgb(palette[idx], palette[idx + 1], localP);
    lut[i] = `\x1b[38;2;${r};${g};${b}m`;
  }
  return lut;
}

export const BRAND_GRADIENT_LUT = buildGradientLut(BRAND_COLORS.gradient, 256);

export function getGradientAnsi(t: number, palette = BRAND_COLORS.gradient): string {
  if (palette === BRAND_COLORS.gradient) {
    if (t <= 0) return BRAND_GRADIENT_LUT[0];
    if (t >= 1) return BRAND_GRADIENT_LUT[255];
    const idx = (t * 255) | 0;
    return BRAND_GRADIENT_LUT[idx];
  }

  const clamped = Math.max(0, Math.min(1, t));
  const segs = palette.length - 1;
  const p = clamped * segs;
  const idx = Math.min(Math.floor(p), segs - 1);
  const localP = p - idx;

  const [r, g, b] = interpolateRgb(palette[idx], palette[idx + 1], localP);
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function colorizeText(text: string, startT = 0, endT = 1, palette = BRAND_COLORS.gradient): string {
  const chars = Array.from(text);
  const total = Math.max(1, chars.length - 1);
  return chars
    .map((char, i) => {
      if (char === ' ') return ' ';
      const t = startT + (i / total) * (endT - startT);
      return `${getGradientAnsi(t, palette)}${char}\x1b[0m`;
    })
    .join('');
}

export function renderGradientAscii(lines: string[], palette = BRAND_COLORS.gradient): string[] {
  const maxLen = Math.max(...lines.map((l) => l.length));
  return lines.map((line) => {
    let out = '';
    Array.from(line).forEach((char, colIdx) => {
      if (char === ' ') {
        out += ' ';
        return;
      }
      const t = colIdx / Math.max(1, maxLen - 1);
      out += `${getGradientAnsi(t, palette)}${char}\x1b[0m`;
    });
    return out;
  });
}
