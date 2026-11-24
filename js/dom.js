// Små hjælpefunktioner, som alle komponenter bruger.

/** Opret et element: h('button', { class: 'x', onclick: fn }, 'Tekst') */
export function h(tag, attrs = {}, ...boern) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const b of boern.flat(Infinity)) {
    if (b == null || b === false) continue;
    el.append(b instanceof Node ? b : document.createTextNode(String(b)));
  }
  return el;
}

export const vent = (ms) => new Promise((r) => setTimeout(r, ms));

export const reduceretBevaegelse = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const IKONER = {
  gnist: '<path d="M12 2c.8 5.5 4.5 9.2 10 10-5.5.8-9.2 4.5-10 10-.8-5.5-4.5-9.2-10-10 5.5-.8 9.2-4.5 10-10z" fill="currentColor"/>',
  flueben: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  pil: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  tilbage: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/>',
  kopi: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/>',
  ur: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
};

/** Lille SVG-ikon. Teksten kommer fra konstanterne ovenfor, aldrig fra data. */
export function ikon(navn, klasse = 'ikon') {
  const span = document.createElement('span');
  span.className = klasse;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" width="1em" height="1em">${IKONER[navn] || ''}</svg>`;
  return span;
}

/** "**fed**" i tekst → [{ t, fed }] */
export function inline(tekst) {
  const dele = [];
  const re = /\*\*(.+?)\*\*/g;
  let i = 0;
  let m;
  while ((m = re.exec(tekst))) {
    if (m.index > i) dele.push({ t: tekst.slice(i, m.index) });
    dele.push({ t: m[1], fed: true });
    i = re.lastIndex;
  }
  if (i < tekst.length) dele.push({ t: tekst.slice(i) });
  return dele;
}

/** Tekst med **fed** som DOM-noder (uden animation). */
export function formateret(tekst) {
  return inline(tekst || '').map((d) => (d.fed ? h('strong', {}, d.t) : document.createTextNode(d.t)));
}

/** Minutter om måneden → "ca. 1½ time" / "ca. 45 minutter" */
export function formaterTid(min) {
  if (!min || min <= 0) return '0 minutter';
  if (min < 55) return `ca. ${Math.round(min / 5) * 5 || min} minutter`;
  const halve = Math.round(min / 30);
  const hele = Math.floor(halve / 2);
  const halv = halve % 2 === 1;
  if (hele === 0) return 'ca. ½ time';
  const tal = `${hele}${halv ? '½' : ''}`;
  // På dansk: "1 time", "1½ time", "2 timer", "2½ time"
  return `ca. ${tal} ${hele === 1 || halv ? 'time' : 'timer'}`;
}
