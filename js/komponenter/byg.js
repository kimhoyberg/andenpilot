// Komponent 4: "Byg prompten". Brikkerne (Hvem, Hvad, Format, Tone) trækkes
// op i prompten – eller man trykker på dem. Prompten bygger sig op undervejs.
// Når alle brikker er på plads, kan prompten sendes til Copilot.
//
// Datafelter: brikker[{ type, tekst }] i den rækkefølge, de skal stå i prompten,
//             svar (Copilots svar), mail (valgfri: { fra, emne, tekst[] }), faerdig

import { h, ikon, formateret } from '../dom.js';
import { skrivFrem } from './copilot-svar.js';

const KATEGORI = { hvem: 'hvem', hvad: 'hvad', format: 'format', tone: 'tone' };
const kat = (type) => KATEGORI[String(type || '').toLowerCase()] || 'hvad';

// Bland rækkefølgen, men aldrig så den er den samme som i prompten
function bland(liste) {
  if (liste.length < 2) return liste.slice();
  let ud;
  do {
    ud = liste.slice().sort(() => Math.random() - 0.5);
  } while (ud.every((x, i) => x === liste[i]));
  return ud;
}

function mailKort(m) {
  return h('figure', { class: 'mail-kort' },
    h('figcaption', {},
      h('span', { class: 'mail-kort-fra' }, m.fra || ''),
      h('span', { class: 'mail-kort-emne' }, m.emne || '')),
    (m.tekst || []).map((p) => h('p', {}, formateret(p))));
}

export function byg(trin, ctx) {
  const brikker = (trin.brikker || []).map((b, i) => ({ ...b, i, kat: kat(b.type), placeret: false }));
  let tilbage = brikker.length;

  const status = h('p', { class: 'sim-status', 'aria-live': 'polite' },
    'Træk en brik op i prompten – eller tryk på den.');

  // Prompten med tomme pladser
  const pladser = brikker.map((b) =>
    h('span', { class: `plads plads--${b.kat}` }, h('span', { class: 'plads-tom' }, b.type, '?')));
  const prompt = h('div', { class: 'byg-prompt', 'aria-label': 'Din prompt' },
    h('p', { class: 'byg-prompt-etiket' }, ikon('gnist'), 'Din prompt'),
    h('p', { class: 'byg-prompt-tekst' }, pladser.flatMap((p, i) => (i ? [' ', p] : [p]))));

  const sendKnap = h('button', { class: 'knap knap--ai', type: 'button', hidden: true, onclick: send },
    ikon('send'), 'Send til Copilot');
  const svarPlads = h('div', { class: 'byg-svar' });

  // Brikkerne
  const knapper = new Map();
  const bakke = h('div', { class: 'bakke', role: 'group', 'aria-label': 'Brikker' },
    bland(brikker).map((b) => {
      const k = h('button', { class: `brik brik--${b.kat}`, type: 'button' },
        h('span', { class: 'brik-type' }, b.type),
        h('span', { class: 'brik-tekst' }, b.tekst));
      knapper.set(b, k);
      gorTraekbar(k, b);
      return k;
    }));

  function placer(b) {
    if (b.placeret) return;
    b.placeret = true;
    tilbage -= 1;
    const k = knapper.get(b);
    k.disabled = true;
    k.classList.add('brugt');
    const plads = pladser[b.i];
    plads.replaceChildren(b.tekst);
    plads.classList.add('fyldt');
    if (tilbage > 0) {
      status.dataset.type = 'godt';
      status.textContent = `«${b.type}» er på plads. ${tilbage === 1 ? 'Én brik' : tilbage + ' brikker'} tilbage.`;
      bakke.querySelector('.brik:not(:disabled)')?.focus({ preventScroll: true });
    } else {
      status.dataset.type = 'godt';
      status.textContent = 'Prompten er klar. Send den til Copilot.';
      bakke.hidden = true;
      sendKnap.hidden = false;
      sendKnap.classList.add('puls');
      sendKnap.focus({ preventScroll: true });
    }
  }

  async function send() {
    sendKnap.disabled = true;
    sendKnap.classList.remove('puls');
    status.dataset.type = '';
    status.textContent = 'Copilot skriver…';
    await skrivFrem(svarPlads, trin.svar || '');
    sendKnap.hidden = true;
    status.dataset.type = 'godt';
    status.textContent = trin.faerdig || 'Flot! Alle fire dele giver et svar, du næsten kan sende med det samme.';
    ctx.klar();
  }

  // Træk med mus eller finger. Et kort tryk (uden at trække) placerer også brikken.
  function gorTraekbar(knap, b) {
    let start = null;
    let spoegelse = null;
    let trukket = false;

    knap.addEventListener('click', () => {
      if (trukket) { trukket = false; return; }
      placer(b);
    });

    knap.addEventListener('pointerdown', (e) => {
      if (knap.disabled || e.button > 0) return;
      start = { x: e.clientX, y: e.clientY };
      trukket = false;
      knap.setPointerCapture(e.pointerId);
    });

    knap.addEventListener('pointermove', (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!spoegelse && Math.hypot(dx, dy) > 8) {
        const r = knap.getBoundingClientRect();
        spoegelse = knap.cloneNode(true);
        spoegelse.classList.add('spoegelse');
        spoegelse.style.width = r.width + 'px';
        spoegelse.style.left = r.left + 'px';
        spoegelse.style.top = r.top + 'px';
        document.body.append(spoegelse);
        knap.classList.add('loeftet');
        start.left = r.left;
        start.top = r.top;
      }
      if (spoegelse) {
        spoegelse.style.transform = `translate(${dx}px, ${dy}px) rotate(-1.5deg)`;
        prompt.classList.toggle('over', erOver(e));
      }
    });

    const slut = (e, afbrudt) => {
      if (!start) return;
      if (spoegelse) {
        trukket = true;
        const ramte = !afbrudt && erOver(e);
        spoegelse.remove();
        spoegelse = null;
        knap.classList.remove('loeftet');
        prompt.classList.remove('over');
        if (ramte) placer(b);
        else {
          status.dataset.type = 'hint';
          status.textContent = 'Slip brikken oppe i prompten – eller tryk bare på den.';
        }
      }
      start = null;
    };
    knap.addEventListener('pointerup', (e) => slut(e, false));
    knap.addEventListener('pointercancel', (e) => slut(e, true));
  }

  function erOver(e) {
    const r = prompt.getBoundingClientRect();
    const luft = 24;
    return e.clientX > r.left - luft && e.clientX < r.right + luft && e.clientY > r.top - luft && e.clientY < r.bottom + luft;
  }

  return h('div', { class: 'byg' },
    trin.mail ? mailKort(trin.mail) : null,
    prompt, status, bakke, sendKnap, svarPlads);
}
