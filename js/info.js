// Info-fanen: "Hvad får jeg?" – hvad man får med en Copilot-licens (Premium)
// i forhold til den almindelige Copilot Chat. Teksten ligger i indhold/premium.json.
// Hver række slutter med en knap til det forløb, hvor man prøver det selv.

import { h, ikon, formateret } from './dom.js';

/**
 * @param {object} d indholdet fra premium.json
 * @param {Map<string, object>} forloeb id → forløb (til knapperne)
 */
export function infoSide(d, forloeb) {
  const uden = d.uden || {};
  const med = d.med || {};

  const raekker = (d.raekker || []).map((r, i) => {
    const f = r.forloeb ? forloeb.get(r.forloeb) : null;
    return h('li', { class: 'info-raekke' },
      h('div', { class: 'info-emne' },
        h('span', { class: 'info-nr', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
        h('h2', { class: 'info-titel' }, r.titel)),
      h('div', { class: 'info-uden' },
        h('p', { class: 'info-kolonne-navn kun-smal' }, uden.navn),
        h('p', {}, formateret(r.uden)),
        r.udenMaerke ? h('p', { class: 'info-maerke' }, r.udenMaerke) : null),
      h('div', { class: 'info-med' },
        h('p', { class: 'info-kolonne-navn info-kolonne-navn--med kun-smal' }, med.navn),
        h('p', {}, formateret(r.med)),
        r.eksempel ? h('p', { class: 'info-eksempel' }, `“${r.eksempel}”`) : null,
        f ? h('a', { class: 'info-proev', href: `#${f.id}` },
          h('span', {}, 'Prøv det: ', h('strong', {}, f.titel)),
          ikon('pil')) : null));
  });

  return [
    h('header', { class: 'info-top' },
      h('h1', { class: 'info-overskrift' },
        d.titel, h('br'), h('span', { class: 'info-fremhaevet' }, d.titelFremhaevet)),
      d.tekst ? h('p', { class: 'info-tekst' }, formateret(d.tekst)) : null),

    h('div', { class: 'info-kolonner', 'aria-hidden': 'true' },
      h('span'),
      h('p', {}, h('span', { class: 'info-kolonne-navn' }, uden.navn), h('span', { class: 'info-under' }, uden.under)),
      h('p', {}, h('span', { class: 'info-kolonne-navn info-kolonne-navn--med' }, med.navn), h('span', { class: 'info-under' }, med.under))),

    h('ol', { class: 'info-liste' }, raekker),

    d.sikkerhed ? h('section', { class: 'info-sikkerhed' },
      h('h2', {}, d.sikkerhed.titel),
      h('p', {}, formateret(d.sikkerhed.tekst))) : null,

    d.forbehold ? h('section', { class: 'info-forbehold' },
      h('p', { class: 'etiket' }, d.forbehold.etiket),
      h('h2', {}, d.forbehold.titel),
      h('p', {}, formateret(d.forbehold.tekst))) : null,

    h('p', { class: 'info-videre' },
      h('a', { class: 'knap knap--primaer', href: '#' }, 'Gå til forløbene', ikon('pil'))),
  ].filter(Boolean);
}
