import { START_LP, pressKey, evaluate, damage, heal, halve } from './logic.js';

const STORAGE_KEY = 'duel-lp-v1';
const $ = (id) => document.getElementById(id);
const cards = [...document.querySelectorAll('.player')];
const lpView = (p) => cards[p].querySelector('.lp');

const newPlayers = (names = ['Giocatore 1', 'Giocatore 2']) =>
  names.map((name) => ({ name, lp: START_LP }));

let state = { players: newPlayers(), active: 0, log: [] };
let expr = '';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.players?.length === 2) state = saved;
  } catch { /* si riparte da un duello nuovo */ }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* senza salvataggio l'app funziona lo stesso */ }
}

// --- Disegno ---------------------------------------------------------------

const shown = [START_LP, START_LP];
const frames = [0, 0];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function animateLp(p, target) {
  cancelAnimationFrame(frames[p]);
  const from = shown[p];
  if (from === target || reduceMotion.matches) {
    shown[p] = target;
    lpView(p).textContent = target;
    return;
  }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 450);
    shown[p] = Math.round(from + (target - from) * (1 - (1 - t) ** 3));
    lpView(p).textContent = shown[p];
    if (t < 1) frames[p] = requestAnimationFrame(step);
  };
  frames[p] = requestAnimationFrame(step);
}

function render() {
  const value = evaluate(expr);

  state.players.forEach((player, p) => {
    const card = cards[p];
    const input = card.querySelector('.name');
    if (document.activeElement !== input) input.value = player.name;
    card.dataset.active = String(p === state.active);
    card.dataset.out = String(player.lp === 0);
    card.querySelector('.preview').textContent =
      p === state.active && value ? `−${value} → ${damage(player.lp, value)}` : '';
    animateLp(p, player.lp);
  });

  $('expr').textContent = /[+−×÷]/.test(expr) ? expr : '';
  $('value').textContent = value ?? '0';
  $('damage').disabled = !value;
  $('heal').disabled = !value;
  $('undo').disabled = !state.log.some((entry) => entry.player !== undefined);
  save();
}

// --- Dialoghi --------------------------------------------------------------

function openDialog(html, buttons) {
  const dialog = $('dialog');
  $('dialog-body').innerHTML = html;
  const row = $('dialog-buttons');
  row.replaceChildren(...buttons.map(({ label, primary, onClick }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (primary) button.className = 'primary';
    button.addEventListener('click', () => {
      dialog.close();
      onClick?.();
    });
    return button;
  }));
  dialog.showModal();
}

const escapeHtml = (text) => {
  const node = document.createElement('div');
  node.textContent = text;
  return node.innerHTML;
};

// --- Azioni ----------------------------------------------------------------

function changeLp(p, compute, label) {
  const player = state.players[p];
  const from = player.lp;
  const to = compute(from);
  if (to === from) return;
  player.lp = to;
  state.log.push({ player: p, from, to, label });
  expr = '';
  render();

  if (to === 0) {
    const winner = state.players[1 - p].name;
    openDialog(`<h2>${escapeHtml(winner)} vince!</h2><p>${escapeHtml(player.name)} è a 0 LP.</p>`, [
      { label: 'Annulla', onClick: undo },
      { label: 'Nuovo duello', primary: true, onClick: resetDuel },
    ]);
  }
}

function undo() {
  const index = state.log.findLastIndex((entry) => entry.player !== undefined);
  if (index < 0) return;
  const [entry] = state.log.splice(index, 1);
  state.players[entry.player].lp = entry.from;
  render();
}

function resetDuel() {
  state = {
    players: newPlayers(state.players.map((player) => player.name)),
    active: 0,
    log: [],
  };
  expr = '';
  render();
}

function showRandom(title, result) {
  state.log.push({ note: `${title}: ${result}` });
  save();
  openDialog(`<h2>${title}</h2><p class="big-result">${result}</p>`, [{ label: 'OK', primary: true }]);
}

const randomInt = (max) => crypto.getRandomValues(new Uint32Array(1))[0] % max;

function showHistory() {
  const items = [...state.log].reverse().map((entry) => {
    if (entry.note) return `<li>${escapeHtml(entry.note)}</li>`;
    const name = escapeHtml(state.players[entry.player].name);
    return `<li>${name}: ${entry.label}<small>${entry.from} → ${entry.to}</small></li>`;
  });
  const body = items.length
    ? `<ul class="log">${items.join('')}</ul>`
    : '<p>Nessuna mossa ancora.</p>';
  openDialog(`<h2>Cronologia</h2>${body}`, [{ label: 'Chiudi', primary: true }]);
}

// --- Eventi ----------------------------------------------------------------

document.querySelector('.keypad').addEventListener('click', (event) => {
  const key = event.target.closest('button')?.dataset.key;
  if (!key) return;
  expr = pressKey(expr, key);
  render();
});

cards.forEach((card, p) => {
  // pointerdown, non click: quando un nome perde il focus WebKit puo' perdere il click,
  // e il danno finirebbe sul giocatore sbagliato.
  card.addEventListener('pointerdown', () => {
    state.active = p;
    render();
  });
  const input = card.querySelector('.name');
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') input.blur();
  });
  input.addEventListener('focus', () => {
    state.active = p;
    render();
  });
  input.addEventListener('input', () => {
    state.players[p].name = input.value;
    save();
  });
  input.addEventListener('blur', () => {
    state.players[p].name = input.value.trim() || `Giocatore ${p + 1}`;
    render();
  });
});

$('clear').addEventListener('click', () => {
  expr = '';
  render();
});

$('damage').addEventListener('click', () => {
  const value = evaluate(expr);
  if (value) changeLp(state.active, (lp) => damage(lp, value), `−${value}`);
});

$('heal').addEventListener('click', () => {
  const value = evaluate(expr);
  if (value) changeLp(state.active, (lp) => heal(lp, value), `+${value}`);
});

$('halve').addEventListener('click', () => changeLp(state.active, halve, '½'));
$('undo').addEventListener('click', undo);
$('history').addEventListener('click', showHistory);
$('coin').addEventListener('click', () => showRandom('Moneta', randomInt(2) ? 'Testa' : 'Croce'));
$('dice').addEventListener('click', () => showRandom('Dado', randomInt(6) + 1));

$('new-duel').addEventListener('click', () => {
  openDialog('<h2>Nuovo duello?</h2><p>I Life Point tornano a 8000 e la cronologia si azzera.</p>', [
    { label: 'No' },
    { label: 'Sì', primary: true, onClick: resetDuel },
  ]);
});

// Tocco fuori dal dialogo = chiudi.
$('dialog').addEventListener('click', (event) => {
  if (event.target === $('dialog')) $('dialog').close();
});

// Lo schermo resta acceso durante il duello, dove il browser lo permette.
async function keepScreenOn() {
  try {
    await navigator.wakeLock?.request('screen');
  } catch { /* non supportato o negato: nessun problema */ }
}
document.addEventListener('pointerdown', keepScreenOn, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepScreenOn();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

load();
state.players.forEach((player, p) => {
  shown[p] = player.lp;
});
render();
