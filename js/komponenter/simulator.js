// Komponent 1: Klik-simulator – en forenklet, neutral udgave af et møde,
// en mail eller et dokument. Brugeren finder Copilot-knappen, vælger eller
// skriver en prompt og sender den. Diskrete hints ved forkerte klik.
// Der er ingen forkerte veje: man kommer altid igennem.
//
// Datafelter (se README): app, vindue, opgave, prompts[{tekst, svar}],
// fritekstSvar, faerdig

import { h, ikon, formateret } from '../dom.js';
import { skrivFrem } from './copilot-svar.js';

const APPS = {
  teams: { etiket: 'Møde', knapper: ['Chat', 'Personer', 'Reager', 'Del skærm', 'Copilot', 'Forlad'] },
  outlook: { etiket: 'Mail', knapper: ['Ny mail', 'Svar', 'Videresend', 'Slet', 'Copilot'] },
  word: { etiket: 'Dokument', knapper: ['Filer', 'Indsæt', 'Layout', 'Gennemse', 'Copilot'] },
};

const FARVER = ['#C9E4DE', '#F2D7C4', '#D7DDF4', '#EADCF0', '#F3E7B8', '#D4E8C9'];

function initialer(navn) {
  return navn.split(/\s+/).map((d) => d[0]).join('').slice(0, 2).toUpperCase();
}

function avatar(navn, i) {
  return h('span', { class: 'avatar', style: `--farve:${FARVER[i % FARVER.length]}`, 'aria-hidden': 'true' }, initialer(navn));
}

// ---------- Indholdet i de tre slags vinduer ----------

function teamsIndhold(v) {
  const deltagere = v.deltagere || [];
  return h('div', { class: 'moede' },
    h('div', { class: 'moede-fliser' },
      deltagere.map((d, i) => h('div', { class: 'flise' }, avatar(d, i), h('span', { class: 'flise-navn' }, d)))),
    h('div', { class: 'udskrift' },
      h('p', { class: 'udskrift-titel' },
        h('span', { class: 'prik-roed', 'aria-hidden': 'true' }), 'Transskription er slået til'),
      (v.udskrift || []).map((l) =>
        h('p', { class: 'udskrift-linje' },
          h('span', { class: 'udskrift-hvem' }, l.navn, ' ', h('span', { class: 'udskrift-tid' }, l.tid || '')),
          h('span', {}, l.tekst)))));
}

function outlookIndhold(v) {
  const liste = v.indbakke && v.indbakke.length
    ? h('ul', { class: 'indbakke', 'aria-label': 'Indbakke' },
      v.indbakke.map((m, i) => h('li', { class: i === 0 ? 'aktiv' : '' },
        h('strong', {}, m.fra), h('span', {}, m.emne))))
    : null;
  return h('div', { class: 'mailvisning' + (liste ? ' med-liste' : '') },
    liste,
    h('article', { class: 'mail' },
      h('p', { class: 'mail-emne' }, v.emne || ''),
      h('div', { class: 'mail-fra' }, avatar(v.fra || '?', 2),
        h('span', {}, h('strong', {}, v.fra || ''), h('br'), h('small', {}, v.tid || ''))),
      h('div', { class: 'mail-tekst' }, (v.tekst || []).map((p) => h('p', {}, formateret(p))))));
}

function wordIndhold(v) {
  return h('div', { class: 'dokument' },
    h('div', { class: 'side' },
      h('p', { class: 'side-titel' }, v.overskrift || ''),
      (v.afsnit || []).map((p) =>
        p.startsWith('## ') ? h('p', { class: 'side-under' }, p.slice(3)) : h('p', {}, formateret(p)))));
}

const INDHOLD = { teams: teamsIndhold, outlook: outlookIndhold, word: wordIndhold };

// ---------- Selve simulatoren ----------

export function simulator(trin, ctx) {
  const appNavn = APPS[trin.app] ? trin.app : 'word';
  const app = APPS[appNavn];
  const v = trin.vindue || {};
  const prompts = trin.prompts || [];

  let forkerte = 0;
  let aaben = false;
  let travl = false;
  let klaret = false;

  const status = h('p', { class: 'sim-status', 'aria-live': 'polite' });
  const saetStatus = (tekst, type = '') => {
    status.textContent = tekst;
    status.dataset.type = type;
  };
  saetStatus(trin.opgave || 'Find Copilot-knappen, og klik på den.');

  // Værktøjslinje
  const copilotKnap = h('button', { class: 'vk vk--copilot', type: 'button', onclick: aabn },
    ikon('gnist'), h('span', {}, 'Copilot'));
  const knapper = app.knapper.map((navn) =>
    navn === 'Copilot'
      ? copilotKnap
      : h('button', { class: 'vk' + (navn === 'Forlad' ? ' vk--forlad' : ''), type: 'button', onclick: () => forkert(navn) }, navn));

  function forkert(navn) {
    if (aaben) return;
    forkerte += 1;
    if (forkerte === 1) {
      saetStatus(trin.hint || `«${navn}» er ikke Copilot. Kig efter knappen med ✦.`, 'hint');
    } else {
      saetStatus('Den knap, der lyser nu, er Copilot. Prøv den.', 'hint');
      copilotKnap.classList.add('puls');
    }
  }

  // Copilot-panelet
  const chat = h('div', { class: 'cp-chat' },
    h('p', { class: 'cp-hej' }, trin.hilsen || 'Hej! Hvad kan jeg hjælpe dig med?'));
  const input = h('input', {
    class: 'cp-input', type: 'text', placeholder: 'Skriv til Copilot…', 'aria-label': 'Skriv til Copilot', autocomplete: 'off',
  });
  const sendKnap = h('button', { class: 'cp-send', type: 'submit', 'aria-label': 'Send' }, ikon('send'));
  const forslag = h('div', { class: 'cp-forslag', role: 'group', 'aria-label': 'Forslag til prompts' },
    prompts.map((p) => h('button', {
      class: 'chip', type: 'button',
      onclick: () => {
        input.value = p.tekst;
        sendKnap.classList.add('puls');
        saetStatus('Godt valg. Tryk nu på send-pilen.', '');
        sendKnap.focus();
      },
    }, p.tekst)));
  const formular = h('form', { class: 'cp-formular', onsubmit: send }, input, sendKnap);
  input.addEventListener('input', () => sendKnap.classList.toggle('puls', input.value.trim().length > 0));

  const panel = h('section', { class: 'cp-panel', 'aria-label': 'Copilot', hidden: true },
    h('header', { class: 'cp-hoved' }, ikon('gnist'), 'Copilot'),
    chat, forslag, formular);

  function aabn() {
    if (aaben) { input.focus(); return; }
    aaben = true;
    copilotKnap.classList.remove('puls');
    copilotKnap.classList.add('aktiv');
    copilotKnap.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    vindue.classList.add('panel-aaben');
    saetStatus(trin.opgave2 || 'Godt fundet! Vælg et af forslagene – eller skriv selv.', 'godt');
    // Lad animationen starte, før fokus flyttes
    requestAnimationFrame(() => forslag.querySelector('button')?.focus({ preventScroll: true }));
  }

  async function send(e) {
    e.preventDefault();
    const tekst = input.value.trim();
    if (!tekst) {
      saetStatus('Tryk på et af forslagene, eller skriv selv. Tryk så på send-pilen.', 'hint');
      return;
    }
    if (travl) return;
    travl = true;
    input.value = '';
    sendKnap.classList.remove('puls');
    forslag.querySelectorAll('button').forEach((b) => { b.disabled = true; });

    chat.append(h('div', { class: 'boble boble--mig' }, tekst));
    const match = prompts.find((p) => p.tekst.toLowerCase() === tekst.toLowerCase());
    const svar = match ? match.svar : (trin.fritekstSvar || prompts[0]?.svar || '');
    if (!match) {
      chat.append(h('p', { class: 'cp-note' },
        'Her ser du et eksempel. I det rigtige program svarer Copilot på præcis det, du skriver.'));
    }
    saetStatus('Copilot arbejder…');
    await skrivFrem(chat, svar, { rul: chat });
    travl = false;
    forslag.querySelectorAll('button').forEach((b) => { b.disabled = false; });

    if (!klaret) {
      klaret = true;
      saetStatus(trin.faerdig || 'Flot! Sådan gør du. Prøv gerne et af de andre forslag også.', 'godt');
      ctx.klar();
    } else {
      saetStatus('Godt. Du kan blive ved, eller gå videre.', 'godt');
    }
  }

  const vindue = h('div', { class: `vindue vindue--${appNavn}` },
    h('div', { class: 'vindue-top' },
      h('span', { class: 'vindue-prikker', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
      h('span', { class: 'vindue-etiket' }, app.etiket),
      h('span', { class: 'vindue-titel' }, v.titel || '')),
    h('div', { class: 'vindue-vaerktoej', role: 'toolbar', 'aria-label': 'Værktøjslinje' }, knapper),
    h('div', { class: 'vindue-krop' }, INDHOLD[appNavn](v), panel));

  return h('div', { class: 'sim' }, status, vindue);
}
