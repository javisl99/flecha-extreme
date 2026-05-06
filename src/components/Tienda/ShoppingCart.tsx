'use client';

import { useState } from 'react';
import CartItem from './CartItem';
import { formatPrice, formatNumber } from '../../lib/formatUtils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout?: () => void;
  onProceedToPayment: (discountPercentage: number) => void;
  className?: string;
  mode?: 'embedded' | 'drawer';
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  className = '',
  mode = 'embedded',
}: ShoppingCartProps) {
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  return (
    <section
      className={`flex h-full flex-col overflow-hidden ${
        mode === 'drawer'
          ? 'border-0 bg-surface-container-lowest shadow-none'
          : 'rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient'
      } ${className}`}
    >
      <header className="border-b border-outline-variant/20 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-headline text-xl font-extrabold text-primary-dark">Cesta de compra</h2>
          <span className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-outline">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant/35 bg-surface-container-low/50 p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
              <svg className="h-8 w-8 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l1 9a2 2 0 002 2h8a2 2 0 002-2l1-9M9 11V7a3 3 0 116 0v4M3 11h18" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-on-surface">Tu cesta esta vacia</p>
            <p className="mt-1 text-xs text-on-surface-variant">Anade productos para empezar el cobro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem key={item.id} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemoveItem} />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <footer className="space-y-3 border-t border-outline-variant/20 px-4 py-3">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
            <label htmlFor="discount-percentage" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-outline">
              Descuento (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="discount-percentage"
                type="number"
                min="0"
                max="100"
                value={discountPercentage === 0 ? '' : discountPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setDiscountPercentage(0);
                    return;
                  }

                  const parsedValue = Number(value);
                  setDiscountPercentage(Number.isNaN(parsedValue) ? 0 : Math.min(100, Math.max(0, parsedValue)));
                }}
                className="h-9 w-full rounded-full border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setDiscountPercentage(0)}
                className="h-9 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-primary"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3 text-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-semibold text-on-surface">{formatPrice(subtotal)}</span>
            </div>
            {discountPercentage > 0 ? (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Descuento ({formatNumber(discountPercentage, 0)}%)</span>
                <span className="font-semibold">-{formatPrice(discountAmount)}</span>
              </div>
            ) : null}
            <div className="mt-1.5 flex items-center justify-between border-t border-outline-variant/25 pt-1.5">
              <span className="font-headline text-base font-extrabold text-on-surface">Total</span>
              <span className="font-headline text-xl font-extrabold text-primary-dark">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => onProceedToPayment(discountPercentage)}
              className="h-11 rounded-full primary-gradient text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:brightness-110"
            >
              Proceder al pago
            </button>
            <button
              type="button"
              onClick={onClearCart}
              className="h-11 rounded-full border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              Cancelar pedido
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
