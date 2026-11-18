const MAX_QUANTITY = 99;
const ORDER_MODES = Object.freeze({ pickup: 'Recolha na pizzaria', delivery: 'Entrega' });
const euros = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const money = (cents) => euros.format(cents / 100);

function cleanSelection(raw, catalog) {
  const result = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [id, quantity] of Object.entries(raw)) {
    if (catalog.has(id) && Number.isInteger(quantity) && quantity > 0) {
      result[id] = Math.min(MAX_QUANTITY, quantity);
    }
  }
  return result;
}

function changeQuantity(selection, id, delta, catalog) {
  if (!catalog.has(id) || !Number.isInteger(delta)) return selection;
  const next = { ...selection };
  const quantity = Math.max(0, Math.min(MAX_QUANTITY, (next[id] ?? 0) + delta));
  if (quantity) next[id] = quantity;
  else delete next[id];
  return next;
}

function orderDetails(selection, catalog) {
  const lines = Object.entries(cleanSelection(selection, catalog)).map(([id, quantity]) => {
    const product = catalog.get(id);
    const total = Number.isSafeInteger(product.price) && product.price >= 0 ? product.price * quantity : null;
    return { product, quantity, total };
  });
  return {
    lines,
    count: lines.reduce((n, line) => n + line.quantity, 0),
    subtotal: lines.every(line => line.total !== null) ? lines.reduce((n, line) => n + line.total, 0) : null,
  };
}

function orderSummary(order, mode, notes = '', restaurantName = 'Avó Maria Pizza') {
  if (!Object.hasOwn(ORDER_MODES, mode) || !order.lines.length) return '';
  const lines = order.lines.map(({ product, quantity, total }) => {
    return `${quantity} × ${product.name}${total === null ? ' — preço a confirmar' : ` — ${money(total)}`}`;
  });
  const subtotal = order.subtotal === null ? 'a confirmar' : `${money(order.subtotal)} (referência Uber Eats, sem taxas)`;
  const safeNotes = String(notes).trim().slice(0, 240);
  return [
    `Pedido — ${restaurantName}`, `Modalidade: ${ORDER_MODES[mode]}`, '', ...lines, '',
    `Subtotal indicativo: ${subtotal}`, ...(safeNotes ? [`Observações: ${safeNotes}`] : []),
    'Por favor, confirmar preço e disponibilidade.',
  ].join('\n');
}

function orderChannel(business, mode, message) {
  if (!business.modes.includes(mode) || !message) return null;
  if (/^[1-9]\d{7,14}$/.test(business.whatsapp ?? '') && business.whatsappModes.includes(mode)) {
    const link = new URL(`https://wa.me/${business.whatsapp}`);
    link.searchParams.set('text', message);
    return { href: link.href, label: 'Abrir WhatsApp', external: true,
      note: 'Revê e envia a mensagem no WhatsApp. O pedido só existe depois de confirmado pela pizzaria.' };
  }
  if (mode === 'delivery') {
    return { href: business.store, label: 'Abrir Uber Eats', external: true,
      note: 'Usa o resumo como referência. A Uber Eats não importa o carrinho deste site; confirma lá a morada, os produtos e as condições de entrega.' };
  }
  return { href: `tel:${business.phone}`, label: 'Ligar para a pizzaria', external: false,
    note: 'Copia o resumo para o teres à mão. Liga para confirmar o pedido, os preços e a hora de recolha.' };
}

export { MAX_QUANTITY, ORDER_MODES, money, cleanSelection, changeQuantity, orderDetails, orderSummary, orderChannel };
