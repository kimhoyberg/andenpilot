// "Gør det nu": en konkret opgave i brugerens eget program og en knap,
// der kopierer prompten.
//
// Datafelter: trin[] (korte skridt), prompt

import { h, ikon, formateret } from '../dom.js';

async function kopier(tekst) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(tekst);
      return true;
    }
  } catch { /* prøv reserveløsningen */ }
  try {
    const ta = h('textarea', { class: 'sr', readonly: true });
    ta.value = tekst;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function goerDet(trin) {
  const promptTekst = h('p', { class: 'prompt-tekst' }, trin.prompt || '');
  const besked = h('span', { class: 'kopi-besked', 'aria-live': 'polite' });
  const knap = h('button', {
    class: 'knap knap--primaer', type: 'button',
    onclick: async () => {
      const ok = await kopier(trin.prompt || '');
      if (ok) {
        besked.textContent = 'Kopieret! Sæt den ind i Copilot.';
        knap.classList.add('kopieret');
      } else {
        // Markér teksten, så man selv kan kopiere den
        const r = document.createRange();
        r.selectNodeContents(promptTekst);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        besked.textContent = 'Teksten er markeret. Kopiér den selv (Ctrl+C eller hold fingeren på den).';
      }
    },
  }, ikon('kopi'), 'Kopiér prompten');

  return h('div', { class: 'goer-det' },
    trin.trin && trin.trin.length
      ? h('ol', { class: 'skridt' }, trin.trin.map((s) => h('li', {}, h('span', {}, formateret(s)))))
      : null,
    h('figure', { class: 'prompt-boks' },
      h('figcaption', {}, 'Din prompt'),
      promptTekst),
    h('div', { class: 'kopi-raekke' }, knap, besked));
}
