// "Find fejlen": Copilot har skrevet et svar ud fra en kilde (fx en mail).
// Brugeren tjekker svaret mod kilden og trykker på de sætninger, der er forkerte.
// Rigtige sætninger giver et venligt hint. Efter tre forkerte tryk blinker fejlene.
//
// Datafelter: kilde{ titel, tekst[] }, prompt, saetninger[{ tekst, forkert?, forklaring? }], faerdig

import { h, ikon, formateret } from '../dom.js';
import { skrivFrem } from './copilot-svar.js';

export function fejl(trin, ctx) {
  const saetninger = trin.saetninger || [];
  const antalFejl = saetninger.filter((s) => s.forkert).length;
  let fundet = 0;
  let bom = 0;

  const status = h('p', { class: 'sim-status', 'aria-live': 'polite' }, 'Copilot skriver…');
  const forklaringer = h('ul', { class: 'fejl-forklaringer' });
  const svarPlads = h('div', { class: 'fejl-svar' });

  const kilde = trin.kilde
    ? h('figure', { class: 'mail-kort' },
      h('figcaption', {}, h('span', { class: 'mail-kort-fra' }, trin.kilde.titel || 'Kilden')),
      (trin.kilde.tekst || []).map((p) => h('p', {}, formateret(p))))
    : null;

  const knapper = saetninger.map((s) => {
    const k = h('button', { class: 'saetning', type: 'button' }, s.tekst);
    k.addEventListener('click', () => {
      if (k.classList.contains('fanget')) return;
      if (s.forkert) {
        k.classList.add('fanget');
        k.classList.remove('puls');
        k.setAttribute('aria-label', `${s.tekst} (forkert)`);
        fundet += 1;
        forklaringer.append(h('li', {}, ikon('flueben'), h('span', {}, formateret(s.forklaring || 'Det passer ikke med kilden.'))));
        if (fundet === antalFejl) {
          status.dataset.type = 'godt';
          status.textContent = trin.faerdig || 'Godt fanget! Tjek altid datoer, beløb og navne mod kilden.';
          knapper.forEach((b) => { b.disabled = true; });
          ctx.klar();
        } else {
          status.dataset.type = 'godt';
          status.textContent = `Godt set! ${antalFejl - fundet === 1 ? 'Én fejl' : antalFejl - fundet + ' fejl'} tilbage.`;
        }
      } else {
        bom += 1;
        k.classList.add('ok');
        setTimeout(() => k.classList.remove('ok'), 900);
        status.dataset.type = 'hint';
        if (bom >= 3) {
          status.textContent = 'Den passer. Fejlene blinker nu – sammenlign dem med kilden.';
          knapper.forEach((b, i) => { if (saetninger[i].forkert && !b.classList.contains('fanget')) b.classList.add('puls'); });
        } else {
          status.textContent = 'Den passer med kilden. Kig efter datoer, beløb og hvem der må hvad.';
        }
      }
    });
    return k;
  });

  // Skriv svaret frem, og gør derefter sætningerne trykbare
  (async () => {
    const boble = await skrivFrem(svarPlads, saetninger.map((s) => s.tekst).join(' '));
    boble.querySelector('.svar-tekst')?.replaceChildren(h('p', { class: 'saetninger' },
      knapper.flatMap((k, i) => (i ? [' ', k] : [k]))));
    status.dataset.type = '';
    status.textContent = `Copilot har lavet ${antalFejl === 1 ? 'én fejl' : antalFejl + ' fejl'}. Tryk på ${antalFejl === 1 ? 'den' : 'dem'}.`;
  })();

  return h('div', { class: 'fejl' },
    kilde,
    trin.prompt ? h('p', { class: 'ss-prompt' }, ikon('gnist'), h('span', {}, 'Prompt: ', h('strong', {}, `“${trin.prompt}”`))) : null,
    svarPlads, status, forklaringer);
}
