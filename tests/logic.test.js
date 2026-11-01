import test from 'node:test';
import assert from 'node:assert/strict';
import { typeKey, damage, heal, halve, rollRotation, frontFace, FACES, PIPS } from '../docs/logic.js';

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
