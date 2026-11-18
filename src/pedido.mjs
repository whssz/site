export const MAX_QUANTITY = 99; // Interface limit, not a promise of availability.
export const MODE_LABELS = Object.freeze({ pickup: 'Recolha', delivery: 'Entrega' });
const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
export const formatPrice = (cents) => euro.format(cents / 100);
export const hasPrice = (item) => Number.isSafeInteger(item.priceCents) && item.priceCents >= 0;

export function orderModel(menu, options = {}) {
  const items = new Map(menu.flatMap(category => category.items.map(item => [item.id, item])));
  const whatsapp = typeof options.whatsapp === 'string' && /^[1-9]\d{7,14}$/.test(options.whatsapp) ? options.whatsapp : null;
  const supportedModes = whatsapp ? options.directModes : options.platform?.modes;
  const modes = Object.keys(MODE_LABELS).filter(mode => supportedModes?.includes(mode));
  const requiresAddress = Boolean(whatsapp && options.requiresDeliveryAddress && modes.includes('delivery'));

  function normalize(cart) {
    const safe = Object.create(null);
    if (!cart || typeof cart !== 'object') return safe;
    for (const [id, q] of Object.entries(cart)) {
      if (items.has(id) && Number.isInteger(q) && q > 0) safe[id] = Math.min(q, MAX_QUANTITY);
    }
    return safe;
  }
  function update(cart, id, step) {
    const next = normalize(cart);
    if (!items.has(id) || ![-1, 0, 1].includes(step)) return next;
    const quantity = step === 0 ? 0 : Math.max(0, Math.min(MAX_QUANTITY, (next[id] ?? 0) + step));
    if (quantity) next[id] = quantity;
    else delete next[id];
    return next;
  }
  function summarize(cart) {
    const lines = Object.entries(normalize(cart)).map(([id, quantity]) => {
      const item = items.get(id);
      const amount = hasPrice(item) ? item.priceCents * quantity : null;
      return { item, quantity, amount };
    });
    const quantity = lines.reduce((n, line) => n + line.quantity, 0);
    const priced = lines.filter(line => line.amount !== null);
    const subtotal = priced.length ? priced.reduce((n, line) => n + line.amount, 0) : null;
    return { lines, quantity, subtotal, complete: lines.length > 0 && priced.length === lines.length };
  }
  function message({ name, cart, mode, note, address }) {
    const { lines, subtotal, complete } = summarize(cart);
    if (!lines.length) return '';
    const result = [`Olá, ${name}! Gostaria de consultar este pedido:`, ''];
    for (const line of lines) {
      const price = line.amount === null ? '' : ` — ${formatPrice(line.amount)}`;
      result.push(`• ${line.quantity} × ${line.item.name}${price}`);
    }
    if (modes.includes(mode)) result.push('', `Preferência: ${MODE_LABELS[mode]}`);
    if (requiresAddress && mode === 'delivery' && address?.trim()) result.push(`Morada de entrega: ${address.trim().slice(0, 240)}`);
    if (note?.trim()) result.push('', `Observações: ${note.trim().slice(0, 300)}`);
    if (subtotal !== null) result.push('', `${complete ? 'Subtotal dos artigos' : 'Subtotal dos artigos com preço'}: ${formatPrice(subtotal)}`);
    result.push(complete ? 'Confirme por favor a disponibilidade e o valor final.' : 'Confirme por favor a disponibilidade e os preços.');
    return result.join('\n');
  }
  function whatsappUrl(text) {
    if (!whatsapp || !text) return null;
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text.toWellFormed())}`;
  }
  return { items, modes, whatsapp, requiresAddress, normalize, update, summarize, message, whatsappUrl };
}
