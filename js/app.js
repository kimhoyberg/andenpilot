// Forside og navigation. Siden skifter visning via adressen:
//   (ingen #)           → fanen "Lær Copilot" (forsiden)
//   #premium            → fanen "Hvad får jeg?" (indhold/premium.json)
//   #<id>               → forløbet i forloeb/<id>.json, fx #teams-referat

import { h, ikon, formaterTid } from './dom.js';
import { erFaerdig, minutterFor, samletMinutter, lagringVirker, nulstil } from './lager.js';
import { visForloeb, forberedForloeb } from './forloeb.js';
import { infoSide } from './info.js';

const INFO_ID = 'premium';

const rod = document.getElementById('app');
const cache = new Map();

async function hentJson(sti) {
  if (cache.has(sti)) return cache.get(sti);
  const svar = await fetch(sti, { cache: 'no-cache' });
  if (!svar.ok) throw new Error(`${sti}: ${svar.status}`);
  const data = await svar.json();
  cache.set(sti, data);
  return data;
}

const hentOversigt = () => hentJson('forloeb/oversigt.json');
const hentForloeb = (id) => hentJson(`forloeb/${encodeURIComponent(id)}.json`);

const gyldig = (id) => typeof id === 'string' && /^[\w-]+$/.test(id);

// oversigt.json kan have "grupper" (med overskrifter) eller blot en flad "forloeb"-liste
async function hentGrupper() {
  const o = await hentOversigt();
  const grupper = Array.isArray(o.grupper)
    ? o.grupper.map((g) => ({ titel: g.titel || '', ids: (g.forloeb || []).filter(gyldig) }))
    : [{ titel: '', ids: (o.forloeb || []).filter(gyldig) }];
  return grupper.filter((g) => g.ids.length);
}

async function alleForloeb() {
  const ids = (await hentGrupper()).flatMap((g) => g.ids);
  const resultater = await Promise.allSettled(ids.map(hentForloeb));
  return resultater.map((r, i) => (r.status === 'fulfilled' ? { ...r.value, id: ids[i] } : null)).filter(Boolean);
}

function fejlside(tekst) {
  rod.replaceChildren(
    h('div', { class: 'fejl' },
      h('h1', {}, 'Ups – noget gik galt'),
      h('p', {}, tekst),
      h('p', {}, h('a', { href: '#' }, 'Til forsiden'))));
}

// De to faner øverst på forsiden og info-siden
function faner(aktiv, infoNavn) {
  const fane = (navn, href, id) => h('a', {
    class: 'fane' + (aktiv === id ? ' aktiv' : ''), href,
    'aria-current': aktiv === id ? 'page' : null,
  }, navn);
  return h('nav', { class: 'faner-top', 'aria-label': 'Sider' },
    h('p', { class: 'maerkevare' }, ikon('gnist'), 'Copilot på 5 minutter'),
    h('div', { class: 'faner' },
      fane('Lær Copilot', '#', 'laer'),
      fane(infoNavn || 'Hvad får jeg?', `#${INFO_ID}`, 'info')));
}

async function hentInfo() {
  try { return await hentJson(`indhold/${INFO_ID}.json`); } catch { return null; }
}

async function visInfo() {
  const [info, liste] = await Promise.all([hentJson(`indhold/${INFO_ID}.json`), alleForloeb()]);
  document.title = `${info.fane || 'Hvad får jeg?'} · Copilot på 5 minutter`;
  rod.replaceChildren(
    faner('info', info.fane),
    ...infoSide(info, new Map(liste.map((f) => [f.id, f]))));
}

async function visForside() {
  document.title = 'Copilot på 5 minutter';
  const [liste, info, grupper] = await Promise.all([alleForloeb(), hentInfo(), hentGrupper()]);
  const ids = liste.map((f) => f.id);
  const antalKlaret = ids.filter(erFaerdig).length;
  const minutter = samletMinutter(ids);
  const efterId = new Map(liste.map((f) => [f.id, f]));

  const raekke = (f, startHer) => {
    const klaret = erFaerdig(f.id);
    return h('li', {},
      h('a', { class: 'forloeb-raekke' + (klaret ? ' klaret' : ''), href: `#${f.id}` },
        h('span', { class: 'flueben-cirkel', 'aria-hidden': 'true' }, klaret ? ikon('flueben') : null),
        h('span', { class: 'raekke-tekst' },
          h('span', { class: 'raekke-titel' }, f.titel,
            startHer ? h('span', { class: 'start-her' }, 'Start her') : null),
          h('span', { class: 'raekke-meta' },
            klaret
              ? `Klaret · sparer ${formaterTid(minutterFor(f.id))} om måneden`
              : `ca. ${f.varighed || 5} min${f.program ? ' · ' + f.program : ''}`)),
        h('span', { class: 'sr' }, klaret ? '(klaret)' : ''),
        ikon('pil', 'ikon raekke-pil')));
  };

  const foersteId = ids[0];
  const lister = grupper.map((g) => {
    const fl = g.ids.map((id) => efterId.get(id)).filter(Boolean);
    if (!fl.length) return null;
    return h('section', { class: 'forloeb-gruppe' },
      g.titel ? h('h2', { class: 'gruppe-titel' }, g.titel) : null,
      h('ul', { class: 'forloeb-liste' }, fl.map((f) => raekke(f, antalKlaret === 0 && f.id === foersteId))));
  }).filter(Boolean);

  const pct = ids.length ? Math.round((antalKlaret / ids.length) * 100) : 0;

  rod.replaceChildren(
    faner('laer', info?.fane),
    h('header', { class: 'forside-top' },
      h('h1', { class: 'forside-titel' }, 'Lær Copilot på 5 minutter ad gangen.'),
      h('p', { class: 'forside-tekst' },
        'Vælg et forløb og prøv det selv i en øvebane, hvor intet kan gå galt.')),

    h('section', { class: 'status', 'aria-label': 'Dit fremskridt' },
      h('div', { class: 'status-del' },
        h('p', { class: 'status-tal' }, `${antalKlaret} af ${ids.length} klaret`),
        h('div', { class: 'status-spor', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(ids.length), 'aria-valuenow': String(antalKlaret), 'aria-label': 'Forløb klaret' },
          h('span', { style: `width:${pct}%` }))),
      h('p', { class: 'status-tid' },
        minutter > 0
          ? ['Du har lært at spare ', h('strong', {}, formaterTid(minutter)), ' om måneden. ',
            h('span', { class: 'skoen' }, '(skøn)')]
          : 'Gennemfør et forløb, og se hvor meget tid du kan spare.')),

    ...lister,

    info ? h('a', { class: 'forside-info', href: `#${INFO_ID}` },
      h('span', {}, 'Hvad er forskellen på Copilot Chat og Copilot med licens?'),
      ikon('pil', 'ikon raekke-pil')) : null,

    h('footer', { class: 'forside-bund' },
      h('p', {}, lagringVirker()
        ? 'Dit fremskridt gemmes kun i din egen browser. Ingen andre kan se det.'
        : 'Din browser tillader ikke, at siden gemmer dit fremskridt. Du kan sagtens bruge den – den husker det bare ikke til næste gang.'),
      antalKlaret > 0 ? startForfra() : null));
}

// "Start forfra" med bekræftelse direkte på siden (ingen pop-op)
function startForfra() {
  const boks = h('div', { class: 'forfra' });
  const spoerg = () => boks.replaceChildren(
    h('span', {}, 'Nulstil dit fremskridt?'),
    h('button', { class: 'link-knap', type: 'button', onclick: () => { nulstil(); visForside(); } }, 'Ja, start forfra'),
    h('button', { class: 'link-knap', type: 'button', onclick: vis }, 'Nej'));
  const vis = () => boks.replaceChildren(
    h('button', { class: 'link-knap', type: 'button', onclick: spoerg }, 'Start forfra'));
  vis();
  return boks;
}

async function rute() {
  const m = (location.hash || '').match(/^#(?:\/forloeb\/)?([\w-]+)$/);
  try {
    if (m && m[1] === INFO_ID) {
      await visInfo();
      window.scrollTo({ top: 0 });
    } else if (m) {
      const forloeb = await forberedForloeb({ ...(await hentForloeb(m[1])), id: m[1] });
      let liste = [];
      try { liste = await alleForloeb(); } catch { liste = [forloeb]; }
      const ids = liste.map((f) => f.id);
      // Det næste forløb, man ikke har klaret – i rækkefølgen fra oversigten, efter dette
      const naesteForloeb = () => {
        const i = ids.indexOf(forloeb.id);
        const raekkefoelge = [...liste.slice(i + 1), ...liste.slice(0, Math.max(0, i))];
        return raekkefoelge.find((f) => !erFaerdig(f.id)) || null;
      };
      visForloeb(rod, forloeb, { samletMinutter: () => samletMinutter(ids), naesteForloeb });
    } else {
      await visForside();
      window.scrollTo({ top: 0 });
    }
  } catch (e) {
    console.error(e);
    fejlside(location.protocol === 'file:'
      ? 'Siden skal åbnes via en webserver (fx GitHub Pages) – ikke direkte som fil. Se README.'
      : 'Forløbet kunne ikke hentes. Prøv at genindlæse siden.');
  }
}

window.addEventListener('hashchange', rute);
rute();
