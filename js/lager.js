// Fremskridt gemmes KUN i brugerens egen browser (localStorage).
// Intet sendes nogen steder hen. Virker localStorage ikke (privat vindue,
// blokerede cookies osv.), husker siden det kun, indtil fanen lukkes.

const NOEGLE = 'copilot5min.v1';
let data = { faerdige: {} };
let virker = true;

try {
  const raa = window.localStorage.getItem(NOEGLE);
  if (raa) {
    const d = JSON.parse(raa);
    if (d && typeof d === 'object' && d.faerdige && typeof d.faerdige === 'object') data = d;
  }
  // Prøv at skrive, så vi ved om det virker
  window.localStorage.setItem(NOEGLE + '.test', '1');
  window.localStorage.removeItem(NOEGLE + '.test');
} catch {
  virker = false;
}

function gem() {
  if (!virker) return;
  try {
    window.localStorage.setItem(NOEGLE, JSON.stringify(data));
  } catch {
    virker = false;
  }
}

export const lagringVirker = () => virker;

export function erFaerdig(id) {
  return Boolean(data.faerdige[id]);
}

/** Markér et forløb som gennemført og gem, hvor mange minutter det sparer om måneden. */
export function markerFaerdig(id, minutterPrMaaned) {
  data.faerdige[id] = {
    minutter: Math.max(0, Number(minutterPrMaaned) || 0),
    dato: new Date().toISOString().slice(0, 10),
  };
  gem();
}

export function minutterFor(id) {
  return data.faerdige[id]?.minutter || 0;
}

/** Samlet tid sparet om måneden for de forløb, der stadig findes. */
export function samletMinutter(ids) {
  return ids.reduce((sum, id) => sum + minutterFor(id), 0);
}

export function nulstil() {
  data = { faerdige: {} };
  if (!virker) return;
  try {
    window.localStorage.removeItem(NOEGLE);
  } catch {
    /* ignorer */
  }
}
