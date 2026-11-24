// Komponent 3: "Vælg den bedste prompt". To prompts side om side.
// Efter valget skrives begge svar frem, så forskellen er tydelig.
//
// Datafelter: a{prompt, svar}, b{prompt, svar}, bedst ("a"|"b"), forklaring

import { h, formateret } from '../dom.js';
import { skrivFrem } from './copilot-svar.js';

export function valg(trin, ctx) {
  let valgt = null;
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const forklaring = h('p', { class: 'forklaring', hidden: true }, formateret(trin.forklaring || ''));

  const kolonner = ['a', 'b'].map((k) => {
    const d = trin[k] || {};
    const knap = h('button', { class: 'valg-knap', type: 'button', onclick: () => vaelg(k) },
      h('span', { class: 'valg-bogstav', 'aria-hidden': 'true' }, k.toUpperCase()),
      h('span', { class: 'valg-prompt' }, `“${d.prompt || ''}”`));
    const svarPlads = h('div', { class: 'valg-svar' });
    const maerke = h('span', { class: 'maerke', hidden: true }, 'Bedste prompt');
    const kol = h('div', { class: 'valg-kolonne' }, maerke, knap, svarPlads);
    return { k, d, knap, svarPlads, maerke, kol };
  });

  async function vaelg(k) {
    if (valgt) return;
    valgt = k;
    const rigtig = k === trin.bedst;
    for (const c of kolonner) {
      c.knap.disabled = true;
      c.knap.setAttribute('aria-pressed', String(c.k === k));
      c.kol.classList.toggle('valgt', c.k === k);
      if (c.k === trin.bedst) { c.kol.classList.add('bedst'); c.maerke.hidden = false; }
    }
    feedback.dataset.type = rigtig ? 'godt' : 'hint';
    feedback.textContent = rigtig
      ? 'Godt valgt! Se forskellen på de to svar.'
      : 'Godt forsøg. Se forskellen – den anden prompt giver det mest brugbare svar.';

    await Promise.all(kolonner.map((c, i) => skrivFrem(c.svarPlads, c.d.svar, { forsinkelse: 900 + i * 250 })));
    forklaring.hidden = false;
    ctx.klar();
  }

  return h('div', { class: 'valg' },
    h('div', { class: 'valg-gitter' }, kolonner.map((c) => c.kol)),
    feedback, forklaring);
}
