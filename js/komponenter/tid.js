// Komponent 6: "Tid sparet". Viser normal tid mod tid med Copilot og
// lægger besparelsen til brugerens samlede tal (kun i browseren).
//
// Datafelter: normalt (min), medCopilot (min), gangePrMaaned, hvad
// Valgfrit: foerTekst ("Det tager normalt"), normaltEtiket ("Normalt"), medEtiket ("Med Copilot")

import { h, ikon, formaterTid, reduceretBevaegelse } from '../dom.js';
import { markerFaerdig } from '../lager.js';

export function tid(trin, ctx) {
  const normalt = Number(trin.normalt) || 0;
  const med = Number(trin.medCopilot) || 0;
  const gange = Number(trin.gangePrMaaned) || 1;
  const prMaaned = Math.max(0, normalt - med) * gange;
  const foerTekst = trin.foerTekst || 'Det tager normalt';
  const normaltEtiket = trin.normaltEtiket || 'Normalt';
  const medEtiket = trin.medEtiket || 'Med Copilot';

  markerFaerdig(ctx.forloeb.id, prMaaned);
  const samlet = ctx.samletMinutter();

  const bjaelke = (etiket, min, klasse) => {
    const fyld = h('span', { class: 'bjaelke-fyld ' + klasse });
    const pct = normalt ? Math.max(6, (min / normalt) * 100) : 100;
    if (reduceretBevaegelse()) fyld.style.width = pct + '%';
    else requestAnimationFrame(() => requestAnimationFrame(() => { fyld.style.width = pct + '%'; }));
    return h('div', { class: 'bjaelke' },
      h('span', { class: 'bjaelke-etiket' }, etiket),
      h('span', { class: 'bjaelke-spor' }, fyld),
      h('span', { class: 'bjaelke-tal' }, `${min} min`));
  };

  return h('div', { class: 'tid' },
    h('p', { class: 'tid-stor' },
      `${foerTekst} ${normalt} min. `,
      h('span', { class: 'tid-ai' }, `${medEtiket}: ${med} min.`)),
    h('div', { class: 'bjaelker' },
      bjaelke(normaltEtiket, normalt, 'normal'),
      bjaelke(medEtiket, med, 'ai')),
    h('p', { class: 'tid-tekst' },
      `Gør du det ${gange === 1 ? 'én gang' : gange + ' gange'} om måneden, sparer du `,
      h('strong', {}, formaterTid(prMaaned)), ' om måneden.'),
    h('p', { class: 'tid-skoen' }, 'Tallene er et skøn. Din egen besparelse afhænger af, hvor tit du gør det.'),
    h('p', { class: 'tid-samlet' }, ikon('ur'),
      h('span', {}, 'I alt har du nu lært at spare ', h('strong', {}, formaterTid(samlet)), ' om måneden.')),
    naesteBlok(ctx));
}

function naesteBlok(ctx) {
  const n = ctx.naesteForloeb ? ctx.naesteForloeb() : null;
  if (!n) {
    return h('p', { class: 'tid-alle' }, ikon('flueben'), h('span', {}, h('strong', {}, 'Du har klaret alle forløb.'), ' Flot klaret!'));
  }
  return h('a', { class: 'tid-naeste', href: `#${n.id}` },
    h('span', {}, h('small', {}, 'Næste forløb'), h('strong', {}, n.titel)),
    ikon('pil'));
}
