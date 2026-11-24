// Afvikler et forløb ét trin ad gangen ud fra datafilen.
// Nye trin-typer tilføjes i KOMPONENTER nedenfor.

import { h, ikon, formateret } from './dom.js';
import { simulator } from './komponenter/simulator.js';
import { valg } from './komponenter/valg.js';
import { quiz } from './komponenter/quiz.js';
import { goerDet } from './komponenter/goer-det.js';
import { video } from './komponenter/video.js';
import { tid } from './komponenter/tid.js';

const intro = (trin, ctx) =>
  h('p', { class: 'intro-meta' }, ikon('ur'), `ca. ${ctx.forloeb.varighed || 5} min`,
    ctx.forloeb.program ? ` · ${ctx.forloeb.program}` : '');

// type → { vis: funktion, etiket: lille overskrift, klarFraStart: kan man gå videre med det samme? }
export const KOMPONENTER = {
  intro: { vis: intro, etiket: '', klarFraStart: true },
  video: { vis: video, etiket: 'Se det', klarFraStart: true },
  simulator: { vis: simulator, etiket: 'Prøv det' },
  valg: { vis: valg, etiket: 'Prøv det' },
  quiz: { vis: quiz, etiket: 'Tjek dig selv' },
  'goer-det': { vis: goerDet, etiket: 'Gør det nu', klarFraStart: true },
  tid: { vis: tid, etiket: 'Tid sparet', klarFraStart: true },
};

export function visForloeb(rod, forloeb, { samletMinutter }) {
  const trinListe = forloeb.trin || [];
  let nu = 0;

  const fremskridt = h('ol', { class: 'fremskridt', 'aria-hidden': 'true' },
    trinListe.map(() => h('li')));
  const fremskridtTekst = h('span', { class: 'sr' });

  const scene = h('section', { class: 'scene' });
  const tilbage = h('button', { class: 'knap knap--stille', type: 'button', onclick: () => vis(nu - 1) },
    ikon('tilbage'), 'Tilbage');
  const naesteTip = h('span', { class: 'naeste-tip' });
  const naeste = h('button', { class: 'knap knap--primaer', type: 'button', onclick: gaaVidere });

  rod.replaceChildren(
    h('header', { class: 'forloeb-top' },
      h('a', { class: 'luk', href: '#/' }, ikon('tilbage'), 'Alle forløb'),
      fremskridt, fremskridtTekst),
    scene,
    h('nav', { class: 'forloeb-bund', 'aria-label': 'Trin' }, tilbage, naesteTip, naeste));

  function gaaVidere() {
    if (naeste.disabled) return;
    if (nu >= trinListe.length - 1) location.hash = '#/';
    else vis(nu + 1);
  }

  function saetKlar(klar) {
    naeste.disabled = !klar;
    naesteTip.textContent = klar ? '' : 'Lav øvelsen først';
    if (klar && nu > 0) naeste.classList.add('vink');
  }

  function vis(i) {
    if (i < 0 || i >= trinListe.length) return;
    nu = i;
    const trin = trinListe[i];
    const komp = KOMPONENTER[trin.type];
    const ctx = { forloeb, klar: () => saetKlar(true), samletMinutter };

    const erIntro = trin.type === 'intro';
    const overskrift = h(erIntro ? 'h1' : 'h2', { class: 'scene-titel', tabindex: '-1' },
      trin.titel || (erIntro ? forloeb.titel : ''));

    scene.replaceChildren(...[
      komp && komp.etiket ? h('p', { class: 'etiket' }, komp.etiket) : null,
      overskrift,
      trin.tekst ? h('p', { class: 'scene-tekst' }, formateret(trin.tekst)) : null,
      komp ? komp.vis(trin, ctx) : h('p', { class: 'feedback', 'data-type': 'hint' },
        `Ukendt trin-type: "${trin.type}". Tjek datafilen.`),
    ].filter(Boolean));
    scene.dataset.type = trin.type;

    [...fremskridt.children].forEach((li, j) => {
      li.className = j < i ? 'gjort' : j === i ? 'nu' : '';
    });
    fremskridtTekst.textContent = `Trin ${i + 1} af ${trinListe.length}`;

    tilbage.hidden = i === 0;
    naeste.classList.remove('vink');
    naeste.textContent = erIntro ? 'Kom i gang' : i === trinListe.length - 1 ? 'Til forsiden' : 'Næste';
    naeste.append(ikon('pil'));
    saetKlar(Boolean(komp?.klarFraStart) || !komp);

    window.scrollTo({ top: 0 });
    overskrift.focus({ preventScroll: true });
  }

  document.title = `${forloeb.titel} · Copilot på 5 minutter`;
  vis(0);
}
