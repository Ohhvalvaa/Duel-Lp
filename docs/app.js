import { START_LP, FACES, PIPS, typeKey, damage, heal, halve, rollRotation, rotatePoint, rollDie, remember, undo, stepCounter } from './logic.js';

const STORAGE_KEY = 'duel-lp-v2';
const $ = (id) => document.getElementById(id);
const cards = [...document.querySelectorAll('.player')];
const lpView = (p) => cards[p].querySelector('.lp');

// Presente solo dentro l'app nativa: sul web queste funzioni non fanno nulla.
const native = window.Capacitor?.isNativePlatform?.() ? window.Capacitor.Plugins : null;
const vibrate = (style = 'LIGHT') => native?.Haptics?.impact({ style }).catch(() => {});

const newPlayers = (names = ['Giocatore 1', 'Giocatore 2']) =>
  names.map((name) => ({ name, lp: START_LP, counter: 0 }));

let state = { players: newPlayers(), active: 0, flipped: [false, false], history: [] };
const lps = () => state.players.map((player) => player.lp);
let entry = '';

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.players?.length === 2) state = { ...state, ...saved };
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
  // Il tastierino si gira verso il giocatore selezionato.
  document.querySelector('.center').dataset.flipped = String(Boolean(state.flipped[state.active]));
  $('undo').disabled = !state.history.length;
  state.players.forEach((player, p) => {
    const card = cards[p];
    card.dataset.active = String(p === state.active);
    card.querySelector('.counter-value').textContent = player.counter || 0;
    card.dataset.out = String(player.lp === 0);
    card.dataset.flipped = String(Boolean(state.flipped[p]));
    card.querySelector('.bar-fill').style.width = `${Math.min(100, (player.lp / START_LP) * 100)}%`;
    card.querySelector('.entry').textContent = p === state.active ? entry : '';
    animateLp(p, player.lp);
  });
  save();
}

function showEffect(p, delta) {
  const card = cards[p];
  card.classList.remove('hit', 'gain');
  void card.offsetWidth; // riparte l'animazione anche con due colpi di fila
  card.classList.add(delta < 0 ? 'hit' : 'gain');

  const label = document.createElement('span');
  label.className = 'delta';
  label.textContent = `${delta < 0 ? '−' : '+'}${Math.abs(delta)}`;
  label.addEventListener('animationend', () => label.remove());
  card.append(label);
}

// --- Dialogo ---------------------------------------------------------------

function openDialog(title, text, buttons) {
  const dialog = $('dialog');
  $('dialog-title').textContent = title;
  $('dialog-text').textContent = text;
  $('dialog-buttons').replaceChildren(...buttons.map(({ label, primary, onClick }) => {
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

// --- Azioni ----------------------------------------------------------------

function changeLp(p, compute) {
  const player = state.players[p];
  const from = player.lp;
  const to = compute(from);
  entry = '';
  if (to !== from) {
    state.history = remember(state.history, lps());
    player.lp = to;
    showEffect(p, to - from);
    vibrate(to < from ? 'MEDIUM' : 'LIGHT');
  }
  render();

  if (to === 0 && from !== 0) {
    vibrate('HEAVY');
    openDialog('Fine duello', '', [
      { label: 'Chiudi' },
      { label: 'Nuovo duello', primary: true, onClick: resetDuel },
    ]);
  }
}

function applyEntry(compute) {
  const amount = Number(entry);
  if (amount) changeLp(state.active, (lp) => compute(lp, amount));
}

function resetDuel() {
  // Anche il nuovo duello si annulla: un tocco per sbaglio non fa perdere la partita.
  const history = lps().every((lp) => lp === START_LP) ? state.history : remember(state.history, lps());
  state = { ...state, players: newPlayers(state.players.map((player) => player.name)), active: 0, history };
  entry = '';
  render();
}

function undoLast() {
  const [history, previous] = undo(state.history);
  if (!previous) return;
  state.history = history;
  entry = '';
  previous.forEach((lp, p) => {
    if (lp !== state.players[p].lp) showEffect(p, lp - state.players[p].lp);
    state.players[p].lp = lp;
  });
  vibrate();
  render();
}

// --- Dado ------------------------------------------------------------------

const ROLL_MS = 1500;
const CAMERA = 7; // distanza dal dado: piu' e' piccola, piu' forte e' la prospettiva

let rotation = [0, 0];
let rollFrame = 0;

/** Punto (a, b) sul piano di una faccia, proiettato sullo schermo. */
function projector(face, angles, cx, cy, size) {
  return (a, b) => {
    const point = [0, 1, 2].map((i) => face.normal[i] + face.u[i] * a + face.v[i] * b);
    const [x, y, z] = rotatePoint(point, angles);
    const scale = (size * CAMERA) / (CAMERA - z);
    return [cx + x * scale, cy + y * scale];
  };
}

function fillPath(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// Contorno di un quadrato con gli angoli arrotondati.
const ROUNDED = [[1, 1, 0], [-1, 1, 90], [-1, -1, 180], [1, -1, 270]].flatMap(([sx, sy, start]) =>
  Array.from({ length: 7 }, (_, i) => {
    const angle = ((start + i * 15) * Math.PI) / 180;
    return [sx * 0.76 + 0.24 * Math.cos(angle), sy * 0.76 + 0.24 * Math.sin(angle)];
  }));

function drawDie(ctx, angles, cx, cy, size) {
  const visible = FACES
    .map((face) => ({ face, facing: rotatePoint(face.normal, angles)[2] }))
    .filter(({ facing }) => facing > 0.001)
    .sort((a, b) => a.facing - b.facing);

  for (const { face, facing } of visible) {
    const at = projector(face, angles, cx, cy, size);
    // Fondo nero pieno: copre lo spazio lasciato dagli angoli arrotondati.
    fillPath(ctx, [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)]);
    ctx.fillStyle = '#000';
    ctx.fill();

    const shade = Math.round(4 + 14 * facing);
    fillPath(ctx, ROUNDED.map(([a, b]) => at(a, b)));
    ctx.fillStyle = `rgb(${shade} ${shade} ${shade})`;
    ctx.fill();
    ctx.strokeStyle = `rgb(255 255 255 / ${0.14 + 0.3 * facing})`;
    ctx.lineWidth = Math.max(1, size * 0.012);
    ctx.stroke();

    const light = Math.round(150 + 105 * facing);
    ctx.fillStyle = `rgb(${light} ${light} ${light})`;
    for (const [col, row] of PIPS[face.value]) {
      fillPath(ctx, Array.from({ length: 20 }, (_, i) => {
        const angle = (i * Math.PI) / 10;
        return at(col * 0.52 + 0.19 * Math.cos(angle), row * 0.52 + 0.19 * Math.sin(angle));
      }));
      ctx.fill();
    }
  }
}

/** Altezza del dado sul tavolo: caduta e due rimbalzi, con t da 0 a 1. */
function dropHeight(t, start) {
  if (t < 0.55) return start * (1 - (t / 0.55) ** 2);
  if (t < 0.78) return start * 0.14 * Math.sin((Math.PI * (t - 0.55)) / 0.23);
  if (t < 0.92) return start * 0.05 * Math.sin((Math.PI * (t - 0.78)) / 0.14);
  return 0;
}

function rollDice() {
  const stage = $('dice-stage');
  const canvas = $('dice-canvas');
  const value = rollDie();
  stage.hidden = false;
  $('dice-result').textContent = '';

  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);

  const from = rotation;
  const to = rollRotation(from, value);
  rotation = to;
  const size = Math.min(width, height) * 0.2;
  const groundY = height * 0.44;
  const startedAt = performance.now();

  cancelAnimationFrame(rollFrame);
  const frame = (now) => {
    const t = reduceMotion.matches ? 1 : Math.min(1, (now - startedAt) / ROLL_MS);
    const spin = 1 - (1 - t) ** 3;
    const angles = [0, 1].map((i) => from[i] + (to[i] - from[i]) * spin);
    ctx.clearRect(0, 0, width, height);
    drawDie(ctx, angles, width / 2, groundY - dropHeight(t, groundY + size * 2), size);
    if (t < 1) {
      rollFrame = requestAnimationFrame(frame);
      return;
    }
    $('dice-result').textContent = `Risultato: ${value}`;
    stage.dataset.value = value;
    vibrate('HEAVY');
  };
  rollFrame = requestAnimationFrame(frame);
}

// --- Eventi ----------------------------------------------------------------

document.querySelector('.center').addEventListener('click', (event) => {
  if (!event.target.closest('.keypad, #back')) return;
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'minus') applyEntry(damage);
  else if (button.dataset.action === 'plus') applyEntry(heal);
  else {
    entry = typeKey(entry, button.dataset.key);
    vibrate();
    render();
  }
});

cards.forEach((card, p) => {
  // pointerdown, non click: il giocatore si seleziona al primo tocco, senza ritardi.
  card.addEventListener('pointerdown', () => {
    state.active = p;
    render();
  });
  card.querySelector('.halve').addEventListener('click', () => {
    changeLp(p, halve);
  });
  card.querySelector('.flip').addEventListener('click', () => {
    state.flipped[p] = !state.flipped[p];
    vibrate();
    render();
  });
  for (const [selector, delta] of [['.counter-minus', -1], ['.counter-plus', 1]]) {
    card.querySelector(selector).addEventListener('click', () => {
      state.players[p].counter = stepCounter(state.players[p].counter, delta);
      vibrate();
      render();
    });
  }
});

$('dice').addEventListener('click', rollDice);
$('undo').addEventListener('click', undoLast);
$('dice-stage').addEventListener('click', () => {
  cancelAnimationFrame(rollFrame);
  $('dice-stage').hidden = true;
});

$('new-duel').addEventListener('click', () => {
  openDialog('Nuovo duello?', 'I Life Point tornano a 8000.', [
    { label: 'No' },
    { label: 'Sì', primary: true, onClick: resetDuel },
  ]);
});

// Tocco fuori dal dialogo = chiudi.
$('dialog').addEventListener('click', (event) => {
  if (event.target === $('dialog')) $('dialog').close();
});

// Lo schermo resta acceso durante il duello.
async function keepScreenOn() {
  try {
    if (native) await native.KeepAwake?.keepAwake();
    else await navigator.wakeLock?.request('screen');
  } catch { /* non supportato o negato: nessun problema */ }
}
document.addEventListener('pointerdown', keepScreenOn, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') keepScreenOn();
});

if (!native && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

load();
state.players.forEach((player, p) => {
  shown[p] = player.lp;
});
render();
