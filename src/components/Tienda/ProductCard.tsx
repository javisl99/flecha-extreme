'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from './data';
import { formatPrice } from '../../lib/formatUtils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onEditProduct: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onEditProduct }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (quantity <= 0 || quantity > product.stock) {
      return;
    }

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 220));
    onAddToCart(product, quantity);
    setQuantity(1);
    setIsAdding(false);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const isOutOfStock = product.stock === 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('svg')) {
      return;
    }
    onEditProduct(product);
  };

  const stockTone =
    product.stock === 0
      ? 'bg-red-100 text-red-700 border-red-200'
      : product.stock <= 3
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const stockLabel =
    product.stock === 0 ? 'Sin stock' : product.stock <= 3 ? `Ultimas ${product.stock} und.` : `${product.stock} und.`;

  return (
    <article
      className={`group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-outline-variant/28 bg-surface-container-lowest shadow-[0_16px_32px_rgba(0,25,71,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(0,25,71,0.12)] ${
        isOutOfStock ? 'opacity-80' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="relative h-44 overflow-hidden border-b border-outline-variant/20 bg-surface-container-low">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${stockTone}`}>
            {stockLabel}
          </span>
        </div>

        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-dark/60 backdrop-blur-[1px]">
            <span className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-bold text-white">No disponible</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 min-h-[3rem]">
          <h3 className="line-clamp-2 text-sm font-bold text-on-surface sm:text-base">{product.name}</h3>
          {product.description ? <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant sm:text-sm">{product.description}</p> : null}
        </div>

        <div className="mb-3 flex items-end justify-between gap-3">
          <span className="font-headline text-xl font-extrabold text-primary-dark sm:text-2xl">{formatPrice(product.price)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-outline sm:text-xs">por unidad</span>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex h-10 min-w-0 items-center justify-between rounded-full border border-outline-variant/45 bg-surface-container-low px-2">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isOutOfStock}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Disminuir cantidad"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <span className="min-w-[1.5rem] text-center text-sm font-bold text-on-surface">{quantity}</span>

            <button
              onClick={incrementQuantity}
              disabled={quantity >= product.stock || isOutOfStock}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Aumentar cantidad"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`h-10 rounded-full px-3 text-xs font-bold transition min-[420px]:min-w-[8.25rem] sm:px-4 sm:text-sm ${
              isOutOfStock
                ? 'cursor-not-allowed border border-outline-variant/40 bg-surface-container-low text-outline'
                : isAdding
                  ? 'bg-emerald-600 text-white'
                  : 'primary-gradient text-white shadow-md shadow-primary/25 hover:brightness-110'
            }`}
          >
            {isAdding ? 'Anadiendo...' : isOutOfStock ? 'Sin stock' : 'Anadir'}
          </button>
        </div>
      </div>
    </article>
  );
}
