import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MAX_QUANTITY, changeQuantity, cleanSelection, money, orderDetails, orderSummary, orderChannel } from '../src/order.mjs';

const { products, business } = JSON.parse(await readFile(new URL('../src/menu.json', import.meta.url), 'utf8'));
const catalog = new Map(products.map(item => [item.id, item]));

test('only catalog items and bounded integer quantities survive storage', () => {
  assert.deepEqual(cleanSelection(JSON.parse('{"obsolete": 3, "margherita": 101, "baconita": 1.5, "campo": -2, "__proto__": 1}'), catalog), { margherita: MAX_QUANTITY });
  assert.deepEqual(cleanSelection('invalid', catalog), {});
});

test('adds, changes and removes distinct products; arithmetic is in euro cents', () => {
  const initial = {};
  let selection = changeQuantity(initial, 'margherita', 2, catalog);
  selection = changeQuantity(selection, 'pepperoni', 1, catalog);
  assert.equal(orderDetails(selection, catalog).count, 3);
  assert.equal(orderDetails(selection, catalog).subtotal, 4000);
  selection = changeQuantity(selection, 'margherita', -1, catalog);
  selection = changeQuantity(selection, 'pepperoni', -1, catalog);
  assert.deepEqual(selection, { margherita: 1 });
  assert.equal(orderDetails(selection, catalog).subtotal, 1250);
  assert.deepEqual(initial, {});
});

test('order summary matches the selected item, mode, value and notes', () => {
  const details = orderDetails({ 'pao-chourico': 1, margherita: 2 }, catalog);
  const summary = orderSummary(details, 'pickup', '  Nota de teste  ');
  assert.match(summary, /Modalidade: Recolha na pizzaria/);
  assert.match(summary, /1 × Pão de Alho com Queijo e Chouriço de Porco Preto/);
  assert.match(summary, /2 × Margherita/);
  assert.ok(summary.includes(`Subtotal indicativo: ${money(3375)} (referência Uber Eats, sem taxas)`));
  assert.match(summary, /Observações: Nota de teste/);
  assert.equal(orderSummary(details, 'unknown'), '');
  assert.equal(orderSummary(orderDetails({}, catalog), 'delivery'), '');
});

test('do not present a subtotal as complete with an unpriced product', () => {
  const product = { id: 'unpriced', name: 'Item de teste', price: null };
  const sample = new Map([...catalog, [product.id, product]]);
  const order = orderDetails({ margherita: 1, unpriced: 3 }, sample);
  assert.equal(order.subtotal, null);
  assert.match(orderSummary(order, 'delivery'), /3 × Item de teste — preço a confirmar/);
  assert.match(orderSummary(order, 'delivery'), /Subtotal indicativo: a confirmar/);
});

test('unconfigured WhatsApp never converts a landline; the official pickup and delivery routes remain functional', () => {
  assert.equal(business.whatsapp, null);
  assert.equal(orderChannel(business, 'pickup', 'resumo').href, `tel:${business.phone}`);
  assert.equal(orderChannel(business, 'delivery', 'resumo').href, business.store);
  assert.equal(orderChannel(business, 'delivery', ''), null);
  assert.equal(orderChannel({ ...business, whatsapp: 'abc' }, 'pickup', 'resumo').href, `tel:${business.phone}`);
});

test('a configured WhatsApp serializes the summary without changing the delivery route', () => {
  const fixture = { ...business, whatsapp: '1234567890' };
  const message = '2 × Margherita\nObservações: & + €';
  const link = new URL(orderChannel(fixture, 'pickup', message).href);
  assert.equal(link.origin, 'https://wa.me');
  assert.equal(link.pathname, '/1234567890');
  assert.equal(link.searchParams.get('text'), message);
  assert.equal(orderChannel(fixture, 'delivery', message).href, business.store);
});
