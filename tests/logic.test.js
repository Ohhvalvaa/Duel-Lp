import test from 'node:test';
import assert from 'node:assert/strict';
import { typeKey, damage, heal, halve, rollRotation, frontFace, FACES, PIPS, rollDie, remember, undo } from '../docs/logic.js';

const type = (...keys) => keys.reduce(typeKey, '');

test('scrittura', () => {
  assert.equal(type('0'), '');
  assert.equal(type('00'), '');
  assert.equal(type('5', '00'), '500');
  assert.equal(type('1', '0', '5'), '105');
  assert.equal(type('5', 'back'), '');
  assert.equal(typeKey('', 'back'), '');
});

test('scrittura: massimo 6 cifre', () => {
  assert.equal(type('123456', '7'), '123456');
  assert.equal(type('12345', '00'), '12345');
});

test('life point', () => {
  assert.equal(damage(8000, 700), 7300);
  assert.equal(damage(500, 700), 0);
  assert.equal(heal(500, 700), 1200);
  assert.equal(halve(8000), 4000);
  assert.equal(halve(1875), 938);
});

test('dado: ogni tiro gira e mostra la faccia estratta', () => {
  for (let value = 1; value <= 6; value++) {
    for (const start of [[0, 0], [1170, 1530], [810, 1710]]) {
      const end = rollRotation(start, value);
      assert.ok(end[0] > start[0] && end[1] > start[1], 'deve girare in avanti');
      assert.equal(frontFace(end), value);
    }
  }
});

test('dado: forma regolare', () => {
  assert.deepEqual(FACES.map((face) => face.value).sort(), [1, 2, 3, 4, 5, 6]);
  for (const face of FACES) {
    assert.equal(PIPS[face.value].length, face.value);
    const opposite = FACES.find((other) => other.value === 7 - face.value);
    assert.deepEqual(opposite.normal.map((n) => n + 0), face.normal.map((n) => 0 - n));
  }
});

test('scrittura: tasti 0, 00 e 000', () => {
  assert.equal(type('000'), '');
  assert.equal(type('1', '000'), '1000');
  assert.equal(type('2', '5', '00'), '2500');
  assert.equal(type('1', '0', '00'), '1000');
  assert.equal(type('123', '000'), '123000');
  assert.equal(type('1234', '000'), '1234');
});

test('dado: scarta i valori oltre l\'ultimo multiplo di 6', () => {
  const draws = [2 ** 32 - 1, 2 ** 32 - 4, 5];
  assert.equal(rollDie(() => draws.shift()), 6);
  assert.equal(draws.length, 0);
  assert.equal(rollDie(() => 0), 1);
});

test('dado: ogni faccia esce con la stessa probabilita', () => {
  const n = 600000;
  const count = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i++) count[rollDie() - 1]++;
  const expected = n / 6;
  const chi2 = count.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
  assert.ok(chi2 < 20.5, `chi quadro ${chi2.toFixed(2)} con conteggi ${count}`); // 5 gradi di liberta', p = 0.001
});

test('annulla: torna indietro un passo alla volta', () => {
  let h = [];
  h = remember(h, [8000, 8000]);
  h = remember(h, [7000, 8000]);
  let [rest, lps] = undo(h);
  assert.deepEqual(lps, [7000, 8000]);
  [rest, lps] = undo(rest);
  assert.deepEqual(lps, [8000, 8000]);
  assert.deepEqual(undo(rest), [[], null]);
});

test('annulla: tiene solo le ultime voci', () => {
  let h = [];
  for (let i = 0; i < 150; i++) h = remember(h, [i, 0]);
  assert.equal(h.length, 100);
  assert.deepEqual(h[0], [50, 0]);
});
