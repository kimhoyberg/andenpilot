// Komponent 5: Før/efter-skyder mellem en rodet tekst og Copilots forbedrede
// version. Træk i teksten (eller brug piletasterne) for at se forskellen.
//
// Datafelter: foer, efter (tekst; tom linje = nyt afsnit), prompt (valgfri), faerdig

import { h, ikon, formateret } from '../dom.js';

function afsnit(tekst) {
  return String(tekst || '').split(/\n+/).filter((l) => l.trim()).map((l) => h('p', {}, formateret(l)));
}

export function skyder(trin, ctx) {
  let pos = 100; // 100 = kun "Før" vises
  let klaret = false;

  const status = h('p', { class: 'sim-status', 'aria-live': 'polite' },
    'Træk i teksten mod venstre for at se Copilots version.');

  const foer = h('div', { class: 'ss-lag ss-foer', 'aria-hidden': 'true' },
    h('span', { class: 'ss-maerke' }, 'Før'), afsnit(trin.foer));
  const efter = h('div', { class: 'ss-lag ss-efter', 'aria-hidden': 'true' },
    h('span', { class: 'ss-maerke ss-maerke--ai' }, ikon('gnist'), 'Efter'), afsnit(trin.efter));

  const greb = h('div', {
    class: 'ss-greb', role: 'slider', tabindex: '0',
    'aria-label': 'Skyder mellem før og efter', 'aria-valuemin': '0', 'aria-valuemax': '100',
  }, h('span', { class: 'ss-knop', 'aria-hidden': 'true' }, '‹ ›'));

  // Skjult tekst til skærmlæsere, så begge versioner kan læses
  const sr = h('div', { class: 'sr' },
    h('p', {}, 'Før:'), afsnit(trin.foer), h('p', {}, 'Efter, skrevet af Copilot:'), afsnit(trin.efter));

  const ramme = h('div', { class: 'ss' }, foer, efter, greb);

  function saet(v) {
    pos = Math.max(0, Math.min(100, v));
    ramme.style.setProperty('--pos', pos + '%');
    greb.setAttribute('aria-valuenow', String(Math.round(100 - pos)));
    greb.setAttribute('aria-valuetext', pos > 50 ? 'Viser mest før' : 'Viser mest efter');
    if (!klaret && pos <= 20) {
      klaret = true;
      status.dataset.type = 'godt';
      status.textContent = trin.faerdig || 'Sådan! Træk frem og tilbage, og se forskellen.';
      ctx.klar();
    }
  }

  const fraPunkt = (x) => {
    const r = ramme.getBoundingClientRect();
    return ((x - r.left) / r.width) * 100;
  };

  let traekker = false;
  ramme.addEventListener('pointerdown', (e) => {
    traekker = true;
    ramme.setPointerCapture(e.pointerId);
    ramme.classList.add('aktiv');
    saet(fraPunkt(e.clientX));
  });
  ramme.addEventListener('pointermove', (e) => { if (traekker) saet(fraPunkt(e.clientX)); });
  const stop = () => { traekker = false; ramme.classList.remove('aktiv'); };
  ramme.addEventListener('pointerup', stop);
  ramme.addEventListener('pointercancel', stop);

  greb.addEventListener('keydown', (e) => {
    const trin10 = { ArrowLeft: -10, ArrowDown: -10, ArrowRight: 10, ArrowUp: 10, Home: -100, End: 100 }[e.key];
    if (trin10 == null) return;
    e.preventDefault();
    saet(pos + trin10);
  });

  saet(100);

  return h('div', { class: 'skyder' },
    trin.prompt
      ? h('p', { class: 'ss-prompt' }, ikon('gnist'), h('span', {}, 'Prompt: ', h('strong', {}, `“${trin.prompt}”`)))
      : null,
    status, ramme, sr);
}
