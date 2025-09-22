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
}

export default function ShoppingCart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onProceedToPayment 
}: ShoppingCartProps) {
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [, ] = useState(false);

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;

  // const _handleCheckout = async () => {
  //   setIsCheckingOut(true);
  //   
  //   // Simular proceso de checkout
  //   await new Promise(resolve => setTimeout(resolve, 1500));
  //   
  //   onCheckout();
  //   setIsCheckingOut(false);
  // };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header de la cesta */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cesta de Compra
          </h2>
          <span className="text-sm font-medium text-primary-dark dark:text-primary-light">
            {items.length} {items.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l1 9a2 2 0 002 2h8a2 2 0 002-2l1-9M9 11V7a3 3 0 116 0v4M3 11h18" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tu cesta está vacía
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Añade productos para comenzar
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Resumen y acciones */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Descuento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descuento (%)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercentage === 0 ? '' : discountPercentage}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setDiscountPercentage(0);
                  } else {
                    setDiscountPercentage(Number(value));
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="0"
              />
              <button
                onClick={() => setDiscountPercentage(0)}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Resumen de precios */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
            </div>
            {discountPercentage > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Descuento ({formatNumber(discountPercentage, 0)}%):</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="text-gray-900 dark:text-white">Total:</span>
              <span className="text-primary-dark dark:text-primary-light">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <button
              onClick={() => onProceedToPayment(discountPercentage)}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 bg-green-600 hover:bg-green-700 text-white hover:shadow-lg cursor-pointer"
            >
              Proceder al Pago
            </button>
            
            <button
              onClick={onClearCart}
              className="w-full py-2 px-4 rounded-lg font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 cursor-pointer"
            >
              Cancelar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
