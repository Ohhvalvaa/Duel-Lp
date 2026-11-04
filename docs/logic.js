// Logica pura del calcolatore: nessun accesso al DOM, cosi' si prova con `node --test`.

export const START_LP = 8000;
const MAX_DIGITS = 6;

/** Applica un tasto (cifra, 00 o back) al valore che si sta scrivendo. */
export function typeKey(entry, key) {
  if (key === 'back') return entry.slice(0, -1);
  if (!entry && /^0+$/.test(key)) return entry; // niente zeri iniziali
  if (entry.length + key.length > MAX_DIGITS) return entry;
  return entry + key;
}

/**
 * Dado da 1 a 6 davvero uniforme. `random32` da' interi a 32 bit (di serie: crypto, non Math.random).
 * Il semplice `% 6` favorirebbe 1-4 di pochissimo, perche' 2^32 non e' divisibile per 6:
 * i valori oltre l'ultimo multiplo di 6 si scartano e si estrae di nuovo.
 */
const RANGE = 2 ** 32;
const LIMIT = RANGE - (RANGE % 6);
const cryptoRandom32 = () => crypto.getRandomValues(new Uint32Array(1))[0];
export function rollDie(random32 = cryptoRandom32) {
  let x;
  do x = random32(); while (x >= LIMIT);
  return (x % 6) + 1;
}

/** Cronologia per "annulla": si salvano i Life Point di entrambi prima di ogni azione, al massimo `max`. */
export const remember = (history, lps, max = 100) => [...history, [...lps]].slice(-max);
/** Toglie l'ultima voce: [cronologia rimasta, Life Point da ripristinare oppure null]. */
export const undo = (history) => (history.length ? [history.slice(0, -1), history.at(-1)] : [history, null]);

/** I Life Point non scendono mai sotto zero. */
export const damage = (lp, amount) => Math.max(0, lp - amount);
export const heal = (lp, amount) => lp + amount;
/** Dimezza arrotondando per eccesso, come da regolamento. */
export const halve = (lp) => Math.ceil(lp / 2);

/**
 * Facce del dado: `normal` esce dalla faccia, `u` e `v` sono i suoi assi.
 * Facce opposte = 7. Assi come nello schermo: x a destra, y in basso, z verso chi guarda.
 */
export const FACES = [
  { value: 1, normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { value: 6, normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  { value: 3, normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { value: 4, normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { value: 2, normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
  { value: 5, normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
];

/** Posizione dei punti sulla faccia, in colonne e righe da -1 a 1. */
export const PIPS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

/** Ruota un punto attorno a Y e poi a X (angoli in gradi). */
export function rotatePoint([x, y, z], [degX, degY]) {
  const ax = (degX * Math.PI) / 180;
  const ay = (degY * Math.PI) / 180;
  const x1 = x * Math.cos(ay) + z * Math.sin(ay);
  const z1 = -x * Math.sin(ay) + z * Math.cos(ay);
  return [x1, y * Math.cos(ax) - z1 * Math.sin(ax), y * Math.sin(ax) + z1 * Math.cos(ax)];
}

/** La faccia rivolta verso chi guarda. */
export function frontFace(rotation) {
  const depth = (face) => rotatePoint(face.normal, rotation)[2];
  return FACES.reduce((best, face) => (depth(face) > depth(best) ? face : best)).value;
}

/** Rotazione del dado che mostra di fronte la faccia `value`. */
const FACE_ROTATION = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180],
};

/**
 * Prossima rotazione del dado: parte da quella attuale, aggiunge giri interi e
 * arriva esattamente sull'orientamento della faccia estratta.
 */
export function rollRotation([x, y], value, turns = 3) {
  const [faceX, faceY] = FACE_ROTATION[value];
  const next = (from, to, spins) => from - (from % 360) + spins * 360 + to;
  return [next(x, faceX, turns), next(y, faceY, turns + 1)];
}
