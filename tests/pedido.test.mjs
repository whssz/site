import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { orderModel, formatPrice, MAX_QUANTITY } from '../src/pedido.mjs';
const config = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url)));

const fixture = [{ items: [{ id: 'a', name: 'Artigo A', priceCents: 1099 }, { id: 'b', name: 'Artigo B', priceCents: 602 }, { id: 'c', name: 'Sem preço', priceCents: null }] }];

test('as quantidades permanecem inteiras, válidas e limitadas à seleção', () => {
  const model = orderModel(config.menu, config.order);
  const saved = model.normalize(JSON.parse('{"margherita":2,"malagueta":115,"tiramisu":1.4,"inexistente":4,"__proto__":1}'));
  assert.equal(saved.margherita, 2);
  assert.equal(saved.malagueta, MAX_QUANTITY);
  assert.equal(Object.keys(saved).length, 2);
  assert.equal(model.update(saved, 'malagueta', 1).malagueta, MAX_QUANTITY);
  assert.equal(model.update(saved, 'margherita', -1).margherita, 1);
  assert.equal(model.update(saved, 'margherita', 0).margherita, undefined);
  assert.equal(saved.margherita, 2, 'não altera o estado anterior');
});

test('subtotal só abrange valores confirmados; valores ausentes não são zero', () => {
  const model = orderModel(fixture);
  const complete = model.summarize({ a: 3, b: 2 });
  assert.equal(complete.subtotal, 4501);
  assert.equal(complete.quantity, 5);
  assert.equal(complete.complete, true);
  const partial = model.summarize({ a: 1, c: 2 });
  assert.equal(partial.subtotal, 1099);
  assert.equal(partial.complete, false);
  assert.equal(partial.lines[1].amount, null);
  assert.equal(model.summarize({ c: 1 }).subtotal, null);
  assert.equal(model.summarize({}).complete, false);
  assert.match(model.message({ name: 'A casa', cart: { a: 1, c: 2 } }), new RegExp(`Subtotal dos artigos com preço: ${formatPrice(1099)}`));
});

test('pedido de hoje copia prato, quantidade e preferência, sem inventar preço ou canal', () => {
  const model = orderModel(config.menu, config.order);
  const message = model.message({ name: config.name, cart: { margherita: 2, tiramisu: 1 }, mode: 'pickup', note: ' Se possível, cortar a pizza. ', address: 'não incluir' });
  assert.match(message, /2 × Pizza Margherita/);
  assert.match(message, /1 × Tiramisù/);
  assert.match(message, /Preferência: Recolha/);
  assert.match(message, /Observações: Se possível, cortar a pizza\./);
  assert.doesNotMatch(message, /€|Morada|não incluir|confirmado/);
  assert.equal(model.whatsappUrl(message), null);
  assert.equal(model.message({ name: config.name, cart: {} }), '');
});

test('a integração futura prepara, mas não envia, mensagem codificada no destino configurado', () => {
  const model = orderModel(fixture, { whatsapp: '12025550100', directModes: ['delivery'], requiresDeliveryAddress: true });
  const message = model.message({ name: 'A casa', cart: { a: 1 }, mode: 'delivery', note: 'açúcar & café?', address: 'Morada do teste' });
  const url = new URL(model.whatsappUrl(message));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/12025550100');
  assert.equal(url.searchParams.get('text'), message);
  assert.match(message, /açúcar & café\?/);
  assert.match(message, /Morada de entrega: Morada do teste/);
  assert.doesNotMatch(model.message({ name: 'A casa', cart: { a: 1 }, mode: 'pickup', address: 'Morada do teste' }), /Morada/);
  assert.equal(model.whatsappUrl(''), null);
});
