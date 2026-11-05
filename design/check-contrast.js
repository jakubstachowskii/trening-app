// Sprawdza kontrast par kolorów z design/tokens.json (WCAG 2.1).
// Użycie: node design/check-contrast.js design/tokens.json
const fs = require('fs');

const tokens = JSON.parse(fs.readFileSync(process.argv[2] || 'design/tokens.json', 'utf8')).color;

const rgb = (h) =>
  h.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
    : h.match(/[\d.]+/g).map(Number);
const blend = (fg, bg) => {
  const f = rgb(fg);
  const b = rgb(bg);
  if (f.length < 4) return f;
  return [0, 1, 2].map((i) => Math.round(f[i] * f[3] + b[i] * (1 - f[3])));
};
const luminance = (c) => {
  const v = c
    .map((x) => x / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (fg, bg) => {
  const a = luminance(blend(fg, bg));
  const b = luminance(rgb(bg));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// [pierwszy plan, tło, minimum]
const CHECKS = [
  ['label', 'surface', 4.5],
  ['label', 'selected', 4.5],
  ['label2', 'surface', 4.5],
  ['label2', 'fill', 4.5],
  ['label2', 'bg', 4.5],
  ['accentText', 'surface', 4.5],
  ['accentText', 'bg', 4.5],
  ['onAccent', 'accent', 4.5],
  ['accent', 'surface', 3],
  ['accent', 'bg', 3],
  ['success', 'surface', 3],
  ['warning', 'surface', 3],
  ['danger', 'surface', 4.5],
];

let failed = 0;
for (const mode of ['dark', 'light']) {
  for (const [id, acc] of Object.entries(tokens.accents)) {
    if (id === 'default') continue;
    const c = { ...tokens[mode], ...acc[mode] };
    const out = CHECKS.map(([fg, bg, min]) => {
      const r = ratio(c[fg], c[bg]);
      if (r < min) failed++;
      return `${fg}/${bg} ${r.toFixed(2)}${r < min ? ' ✗' : ''}`;
    });
    console.log(`${mode}/${id}: ${out.join(' | ')}`);
  }
}
console.log(failed ? `NIEZALICZONE: ${failed}` : 'Wszystkie pary zaliczone');
process.exit(failed ? 1 : 0);
