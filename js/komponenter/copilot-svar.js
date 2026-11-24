// Komponent 2: Copilot-svar, der skrives frem bogstav for bogstav i en chatboble
// med en lille "tænker…"-animation først.
//
// Tekstformat (samme i alle datafiler):
//   - linjer der starter med "- " bliver punkter
//   - **fed tekst** bliver fed
//   - tom linje = nyt afsnit

import { h, ikon, inline, vent, reduceretBevaegelse } from '../dom.js';

function bygStruktur(tekst) {
  const el = h('div', { class: 'svar-tekst' });
  const segmenter = [];
  let liste = null;

  for (const raa of String(tekst || '').split('\n')) {
    const linje = raa.trimEnd();
    if (!linje.trim()) {
      liste = null;
      continue;
    }
    let blok;
    let indhold = linje;
    const erPunkt = /^\s*[-•]\s+/.test(linje);
    if (erPunkt) {
      if (!liste) {
        liste = h('ul');
        liste.hidden = true;
        el.append(liste);
      }
      blok = h('li');
      liste.append(blok);
      indhold = linje.replace(/^\s*[-•]\s+/, '');
    } else {
      liste = null;
      blok = h('p');
      el.append(blok);
    }
    blok.hidden = true;
    for (const del of inline(indhold)) {
      const node = document.createTextNode('');
      blok.append(del.fed ? h('strong', {}, node) : node);
      segmenter.push({ node, tekst: del.t, blok, liste: erPunkt ? liste : null });
    }
  }
  return { el, segmenter };
}

/**
 * Tilføj en Copilot-boble til `beholder` og skriv `tekst` frem.
 * @param {HTMLElement} beholder
 * @param {string} tekst
 * @param {{ forsinkelse?: number, rul?: HTMLElement, etiket?: string }} valg
 * @returns {Promise<HTMLElement>} boblen, når den er færdig
 */
export async function skrivFrem(beholder, tekst, valg = {}) {
  const { forsinkelse = 1100, rul = null, etiket = 'Copilot' } = valg;
  const hurtig = reduceretBevaegelse();

  const boble = h('div', { class: 'boble boble--ai' });
  const hoved = h('div', { class: 'boble-hoved' }, ikon('gnist'), etiket);
  const taenker = h(
    'div',
    { class: 'taenker', role: 'status' },
    h('i'), h('i'), h('i'),
    h('span', { class: 'taenker-tekst' }, 'tænker…'),
  );
  boble.append(hoved, taenker);
  beholder.append(boble);
  const rulNed = () => { if (rul) rul.scrollTop = rul.scrollHeight; };
  rulNed();

  await vent(hurtig ? 150 : forsinkelse);
  taenker.remove();

  const { el, segmenter } = bygStruktur(tekst);
  el.setAttribute('aria-hidden', 'true'); // skærmlæsere får hele svaret til sidst
  boble.append(el);

  let spring = false;
  boble.title = 'Klik for at vise hele svaret';
  boble.addEventListener('click', () => { spring = true; }, { once: true });

  const total = segmenter.reduce((s, x) => s + x.tekst.length, 0);
  const prSkridt = Math.max(1, Math.ceil(total / 170)); // ca. 3–4 sekunder uanset længde

  for (const s of segmenter) {
    s.blok.hidden = false;
    if (s.liste) s.liste.hidden = false;
    if (hurtig || spring) {
      s.node.data = s.tekst;
      continue;
    }
    let i = 0;
    while (i < s.tekst.length) {
      if (spring) { i = s.tekst.length; }
      else i = Math.min(s.tekst.length, i + prSkridt);
      s.node.data = s.tekst.slice(0, i);
      rulNed();
      if (!spring) await vent(18);
    }
  }

  el.removeAttribute('aria-hidden');
  boble.removeAttribute('title');
  boble.classList.add('faerdig');
  rulNed();
  return boble;
}
