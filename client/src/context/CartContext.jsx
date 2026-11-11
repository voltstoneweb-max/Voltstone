import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'voltstone_bag';
const MAX_QTY = 10; // el servidor también limita a 10 por prenda

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || { items: [], favs: [] }; } catch { return { items: [], favs: [] }; }
};

/** Bolsa de compras y favoritos. Se guardan en el navegador; el precio y el stock reales los valida el servidor al pagar. */
export function CartProvider({ children }) {
  const [state, setState] = useState(load);
  const [drawer, setDrawer] = useState({ open: false, tab: 'bag' });

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento: la bolsa dura solo esta visita */ }
  }, [state]);

  const addItem = useCallback((p, size, qty = 1) => {
    setState((s) => {
      const key = `${p._id}|${size}`;
      const limit = Math.min(MAX_QTY, p.stock ?? MAX_QTY);
      const found = s.items.find((i) => i.key === key);
      if (found) return { ...s, items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.min(limit, i.qty + qty), stock: p.stock } : i)) };
      const line = { key, productId: p._id, name: p.name, price: p.price, size, qty: Math.min(limit, qty), imageUrl: p.imageUrl || '', stock: p.stock };
      return { ...s, items: [...s.items, line] };
    });
  }, []);
  const setQty = useCallback((key, qty) => setState((s) => ({ ...s, items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(i.stock ?? MAX_QTY, MAX_QTY, qty)) } : i)) })), []);
  const removeItem = useCallback((key) => setState((s) => ({ ...s, items: s.items.filter((i) => i.key !== key) })), []);
  const clear = useCallback(() => setState((s) => ({ ...s, items: [] })), []);

  const toggleFav = useCallback((p) => setState((s) => {
    const has = s.favs.some((f) => f.id === p._id);
    return { ...s, favs: has ? s.favs.filter((f) => f.id !== p._id) : [...s.favs, { id: p._id, name: p.name, price: p.price, imageUrl: p.imageUrl || '', category: p.category }] };
  }), []);

  const value = useMemo(() => ({
    items: state.items,
    favs: state.favs,
    count: state.items.reduce((n, i) => n + i.qty, 0),
    subtotal: state.items.reduce((n, i) => n + i.price * i.qty, 0),
    isFav: (id) => state.favs.some((f) => f.id === id),
    addItem, setQty, removeItem, clear, toggleFav,
    drawer,
    openBag: (tab = 'bag') => setDrawer({ open: true, tab }),
    setTab: (tab) => setDrawer((d) => ({ ...d, tab })),
    closeBag: () => setDrawer((d) => ({ ...d, open: false }))
  }), [state, drawer, addItem, setQty, removeItem, clear, toggleFav]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
