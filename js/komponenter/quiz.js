// "Tjek dig selv": ét spørgsmål med svar med det samme og en kort forklaring.
//
// Datafelter: spoergsmaal, svar[], rigtigt (nummer, starter ved 0), forklaring

import { h, ikon, formateret } from '../dom.js';

export function quiz(trin, ctx) {
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const forklaring = h('p', { class: 'forklaring', hidden: true }, formateret(trin.forklaring || ''));
  let besvaret = false;

  const knapper = (trin.svar || []).map((tekst, i) =>
    h('button', { class: 'quiz-svar', type: 'button', onclick: () => svar(i) },
      h('span', { class: 'quiz-markering', 'aria-hidden': 'true' }), h('span', {}, tekst)));

  function svar(i) {
    if (besvaret) return;
    besvaret = true;
    const rigtig = i === trin.rigtigt;
    knapper.forEach((k, j) => {
      k.disabled = true;
      if (j === trin.rigtigt) { k.classList.add('rigtig'); k.querySelector('.quiz-markering').append(ikon('flueben')); }
      else if (j === i) k.classList.add('forkert');
    });
    feedback.dataset.type = rigtig ? 'godt' : 'hint';
    feedback.textContent = rigtig ? 'Rigtigt!' : 'Ikke helt. Det rigtige svar er markeret.';
    forklaring.hidden = false;
    ctx.klar();
  }

  return h('div', { class: 'quiz' },
    trin.titel ? h('p', { class: 'quiz-spoergsmaal' }, trin.spoergsmaal || '') : null,
    h('div', { class: 'quiz-liste' }, knapper),
    feedback, forklaring);
}
