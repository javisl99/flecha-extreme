'use client';

import Image from 'next/image';
import { formatPrice } from '../../lib/formatUtils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const totalPrice = item.price * item.quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.id);
      return;
    }

    if (newQuantity <= item.stock) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3 shadow-sm">
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low">
        <Image src={item.image} alt={item.name} fill className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-on-surface">{item.name}</h4>
        <p className="text-xs text-on-surface-variant">{formatPrice(item.price)}/u.</p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-outline-variant/45 bg-surface-container-low px-1 py-0.5">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high"
          aria-label="Restar unidad"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <span className="min-w-[1.8rem] text-center text-sm font-bold text-on-surface">{item.quantity}</span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.stock}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${
            item.quantity >= item.stock
              ? 'cursor-not-allowed text-outline'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          title={item.quantity >= item.stock ? `Stock maximo: ${item.stock}` : 'Sumar unidad'}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
      </div>

      <div className="min-w-[4.75rem] text-right">
        <p className="text-sm font-bold text-primary-dark">{formatPrice(totalPrice)}</p>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-outline transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        title="Eliminar producto"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
