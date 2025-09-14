'use client';

import Image from 'next/image';
import { formatPrice } from '../../lib/formatUtils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
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
    } else {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Imagen del producto */}
      <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Información del producto */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {item.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatPrice(item.price)}/u.
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[2rem] text-center">
          {item.quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Precio total */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatPrice(totalPrice)}
        </p>
      </div>

      {/* Botón eliminar */}
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
        title="Eliminar producto"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
