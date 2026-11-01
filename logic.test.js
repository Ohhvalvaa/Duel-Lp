import test from 'node:test';
import assert from 'node:assert/strict';
import { pressKey, evaluate, damage, heal, halve } from './logic.js';

const type = (...keys) => keys.reduce(pressKey, '');

test('scrittura: niente zeri iniziali', () => {
  assert.equal(type('0'), '');
  assert.equal(type('00'), '');
  assert.equal(type('5', '00'), '500');
  assert.equal(type('5', '+', '0', '3'), '5+3');
  assert.equal(type('5', '+', '00'), '5+');
});

test('scrittura: operatori', () => {
  assert.equal(type('+'), '');
  assert.equal(type('5', '+', '×'), '5×');
  assert.equal(type('5', '+', 'back'), '5');
  assert.equal(pressKey('', 'back'), '');
});

test('scrittura: massimo 7 cifre per numero', () => {
  assert.equal(type('1234567', '8'), '1234567');
  assert.equal(type('123456', '00'), '123456');
});

test('calcolo: casi da duello', () => {
  assert.equal(evaluate('2500−1800'), 700);
  assert.equal(evaluate('1800−2500'), 700);
  assert.equal(evaluate('500×3'), 1500);
  assert.equal(evaluate('2500÷2+800'), 2050);
  assert.equal(evaluate('1000+500×2'), 2000);
  assert.equal(evaluate('10−2−3'), 5);
  assert.equal(evaluate('2+3×4−1'), 13);
  assert.equal(evaluate('12÷2×3'), 18);
});

test('calcolo: casi limite', () => {
  assert.equal(evaluate(''), null);
  assert.equal(evaluate('2500−'), 2500);
  assert.equal(evaluate('2500÷0'), null);
  assert.equal(evaluate('1875÷2'), 938);
});

test('life point', () => {
  assert.equal(damage(8000, 700), 7300);
  assert.equal(damage(500, 700), 0);
  assert.equal(heal(500, 700), 1200);
  assert.equal(halve(8000), 4000);
  assert.equal(halve(1875), 938);
});
