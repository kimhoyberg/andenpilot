// Komponent 7: Kort, lydløs skærmoptagelse i loop (mp4, webm eller gif).
// Findes filen ikke endnu, vises en tydelig pladsholder, der fortæller,
// hvilken optagelse der mangler, og hvad den skal vise.
//
// Datafelter: fil (fx "media/teams-referat.mp4"), beskrivelse, alt

import { h, ikon, reduceretBevaegelse } from '../dom.js';

function pladsholder(trin) {
  return h('div', { class: 'video-pladsholder' },
    ikon('film', 'ikon ikon--stor'),
    h('p', { class: 'vp-titel' }, 'Her kommer en kort skærmoptagelse'),
    h('p', { class: 'vp-tekst' }, trin.beskrivelse || ''),
    h('p', { class: 'vp-fil' }, 'Mangler filen: ', h('code', {}, trin.fil || '(intet filnavn angivet)')));
}

export function video(trin) {
  const ramme = h('div', { class: 'video-ramme' });
  const fil = trin.fil || '';

  if (!fil) {
    ramme.append(pladsholder(trin));
    return ramme;
  }

  if (/\.gif$/i.test(fil)) {
    const img = h('img', { src: fil, alt: trin.alt || trin.beskrivelse || 'Skærmoptagelse', loading: 'lazy' });
    img.addEventListener('error', () => ramme.replaceChildren(pladsholder(trin)));
    ramme.append(img);
    return ramme;
  }

  const v = h('video', {
    muted: true, loop: true, playsinline: true, preload: 'metadata',
    'aria-label': trin.alt || trin.beskrivelse || 'Skærmoptagelse',
  });
  v.muted = true; // skal sættes som egenskab for at autoplay virker i alle browsere
  v.addEventListener('error', () => ramme.replaceChildren(pladsholder(trin)));
  v.addEventListener('loadeddata', () => {
    if (!reduceretBevaegelse()) v.play().catch(() => {});
  });
  // Tryk på videoen for at sætte på pause / starte igen
  v.addEventListener('click', () => (v.paused ? v.play().catch(() => {}) : v.pause()));
  v.src = fil;
  ramme.append(v, h('p', { class: 'video-tip' }, 'Tryk på videoen for at sætte den på pause.'));
  return ramme;
}
