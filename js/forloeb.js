// Afvikler et forløb ét trin ad gangen ud fra datafilen.
// Nye trin-typer tilføjes i KOMPONENTER nedenfor.

import { h, ikon, formateret, formaterTid } from './dom.js';
import { simulator } from './komponenter/simulator.js';
import { valg } from './komponenter/valg.js';
import { quiz } from './komponenter/quiz.js';
import { goerDet } from './komponenter/goer-det.js';
import { video } from './komponenter/video.js';
import { tid } from './komponenter/tid.js';
import { byg } from './komponenter/byg.js';
import { skyder } from './komponenter/skyder.js';
import { fejl } from './komponenter/fejl.js';

// Det, man skal i forløbet, vist på startskærmen (én linje pr. trin-type)
const INTRO_PUNKT = {
  video: 'Se, hvordan det ser ud',
  simulator: 'Prøv det selv i en øvebane',
  valg: 'Vælg den bedste prompt',
  byg: 'Byg en god prompt',
  skyder: 'Se forskellen før og efter',
  fejl: 'Find fejlene i et svar',
  quiz: 'Svar på ét spørgsmål',
  'goer-det': 'Prøv det i dit eget arbejde',
};

function intro(trin, ctx) {
  const f = ctx.forloeb;
  const tidTrin = (f.trin || []).find((t) => t.type === 'tid');
  const minutter = tidTrin
    ? Math.max(0, (Number(tidTrin.normalt) || 0) - (Number(tidTrin.medCopilot) || 0)) * (Number(tidTrin.gangePrMaaned) || 1)
    : 0;
  const punkter = (f.trin || []).map((t) => INTRO_PUNKT[t.type]).filter(Boolean)
    .filter((p, i, a) => a.indexOf(p) === i);
  return h('div', { class: 'intro' },
    h('p', { class: 'intro-meta' }, ikon('ur'), `ca. ${f.varighed || 5} min`, f.program ? ` · ${f.program}` : ''),
    minutter > 0 ? h('p', { class: 'intro-loefte' }, ikon('gnist'),
      h('span', {}, 'Kan spare dig ', h('strong', {}, formaterTid(minutter)), ' om måneden')) : null,
    punkter.length ? h('div', { class: 'intro-plan' },
      h('p', { class: 'intro-plan-titel' }, 'Det skal du'),
      h('ol', { class: 'skridt' }, punkter.map((p) => h('li', {}, h('span', {}, p))))) : null);
}

// Skærmoptagelser, der ikke findes endnu, springes over for brugerne.
// Tilføj ?rediger til adressen for at se pladsholderne.
export const redigerTilstand = () => new URLSearchParams(location.search).has('rediger');

export async function forberedForloeb(forloeb) {
  if (redigerTilstand()) return forloeb;
  const trin = await Promise.all((forloeb.trin || []).map(async (t) => {
    if (t.type !== 'video') return t;
    if (!t.fil) return null;
    try {
      const svar = await fetch(t.fil, { method: 'HEAD', cache: 'no-cache' });
      return svar.ok ? t : null;
    } catch {
      return null;
    }
  }));
  return { ...forloeb, trin: trin.filter(Boolean) };
}

// type → { vis: funktion, etiket: lille overskrift, klarFraStart: kan man gå videre med det samme? }
export const KOMPONENTER = {
  intro: { vis: intro, etiket: '', klarFraStart: true },
  video: { vis: video, etiket: 'Se det', klarFraStart: true },
  simulator: { vis: simulator, etiket: 'Prøv det' },
  valg: { vis: valg, etiket: 'Prøv det' },
  byg: { vis: byg, etiket: 'Prøv det' },
  skyder: { vis: skyder, etiket: 'Prøv det' },
  fejl: { vis: fejl, etiket: 'Prøv det' },
  quiz: { vis: quiz, etiket: 'Tjek dig selv' },
  'goer-det': { vis: goerDet, etiket: 'Gør det nu', klarFraStart: true },
  tid: { vis: tid, etiket: 'Tid sparet', klarFraStart: true },
};

export function visForloeb(rod, forloeb, { samletMinutter, naesteForloeb = () => null }) {
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
      h('a', { class: 'luk', href: '#' }, ikon('tilbage'), 'Alle forløb'),
      fremskridt, fremskridtTekst),
    scene,
    h('nav', { class: 'forloeb-bund', 'aria-label': 'Trin' }, tilbage, naesteTip, naeste));

  let naesteId = null; // sættes på sidste trin, hvis der er et forløb mere at tage

  function gaaVidere() {
    if (naeste.disabled) return;
    if (nu >= trinListe.length - 1) location.hash = naesteId ? naesteId : '';
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
    const sidste = i === trinListe.length - 1;
    const ctx = { forloeb, klar: () => saetKlar(true), samletMinutter, naesteForloeb };

    const erIntro = trin.type === 'intro';
    const overskrift = h(erIntro ? 'h1' : 'h2', { class: 'scene-titel', tabindex: '-1' },
      trin.titel || (erIntro ? forloeb.titel : trin.type === 'quiz' ? trin.spoergsmaal : ''));

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
    // Sidste trin: foreslå næste forløb (beregnes efter, at dette er markeret som klaret)
    naesteId = sidste ? (naesteForloeb()?.id || null) : null;
    naeste.textContent = erIntro ? 'Kom i gang' : sidste ? (naesteId ? 'Næste forløb' : 'Til forsiden') : 'Næste';
    naeste.append(ikon('pil'));
    saetKlar(Boolean(komp?.klarFraStart) || !komp);

    window.scrollTo({ top: 0 });
    overskrift.focus({ preventScroll: true });
  }

  document.title = `${forloeb.titel} · Copilot på 5 minutter`;
  vis(0);
}
