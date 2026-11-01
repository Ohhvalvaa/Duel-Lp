// Logica pura del calcolatore: nessun accesso al DOM, cosi' si prova con `node --test`.

export const START_LP = 8000;
export const OPS = ['+', '−', '×', '÷'];
const MAX_DIGITS = 7;

const isOp = (c) => OPS.includes(c);

/** Applica un tasto (cifra, 00, operatore o back) e restituisce la nuova espressione. */
export function pressKey(expr, key) {
  if (key === 'back') return expr.slice(0, -1);

  const last = expr.at(-1);

  if (isOp(key)) {
    if (!expr) return expr; // un'espressione non inizia con un operatore
    return isOp(last) ? expr.slice(0, -1) + key : expr + key;
  }

  const current = expr.split(/[+−×÷]/).at(-1);
  if (current === '0' || current === '') {
    if (key === '0' || key === '00') return expr; // niente zeri iniziali
    if (current === '0') return expr.slice(0, -1) + key;
  }
  if (current.length + key.length > MAX_DIGITS) return expr;
  return expr + key;
}

/**
 * Calcola l'espressione (× e ÷ prima di + e −). Restituisce un intero >= 0,
 * oppure null se non c'e' nulla da calcolare. Il segno si perde di proposito:
 * 1800 − 2500 sono comunque 700 di danno. Le frazioni si arrotondano per eccesso,
 * come per i Life Point e l'ATK dimezzati.
 */
export function evaluate(expr) {
  const clean = isOp(expr.at(-1)) ? expr.slice(0, -1) : expr;
  if (!clean) return null;

  const numbers = clean.split(/[+−×÷]/).map(Number);
  const ops = clean.replace(/\d/g, '').split('');

  const terms = [numbers[0]];
  const signs = [];
  ops.forEach((op, i) => {
    const n = numbers[i + 1];
    if (op === '×') terms[terms.length - 1] *= n;
    else if (op === '÷') terms[terms.length - 1] = n === 0 ? NaN : terms.at(-1) / n;
    else {
      signs.push(op);
      terms.push(n);
    }
  });

  const total = terms.slice(1).reduce(
    (sum, term, i) => (signs[i] === '+' ? sum + term : sum - term),
    terms[0],
  );
  return Number.isFinite(total) ? Math.ceil(Math.abs(total)) : null;
}

/** I Life Point non scendono mai sotto zero. */
export const damage = (lp, amount) => Math.max(0, lp - amount);
export const heal = (lp, amount) => lp + amount;
/** Dimezza arrotondando per eccesso, come da regolamento. */
export const halve = (lp) => Math.ceil(lp / 2);
