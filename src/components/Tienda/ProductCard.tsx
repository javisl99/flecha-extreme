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
    if (quantity > 0 && quantity <= product.stock) {
      setIsAdding(true);
      
      // Simular animación de añadido
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onAddToCart(product, quantity);
      setQuantity(1);
      setIsAdding(false);
    }
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
    // Evitar que se abra la modal si se hace clic en los botones o controles
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('svg')) {
      return;
    }
    onEditProduct(product);
  };

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full cursor-pointer ${
        isOutOfStock ? 'opacity-60' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Imagen del producto */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Sin Stock
            </span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            ¡Últimas unidades!
          </div>
        )}
      </div>

      {/* Contenido del producto */}
      <div className="p-4 flex flex-col flex-1">
        {/* Contenido superior flexible */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 truncate">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Contenido inferior fijo */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-primary-dark dark:text-primary-light">
              {formatPrice(product.price)}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                product.stock === 0 
                  ? 'bg-red-500' 
                  : product.stock <= 3 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
              }`}></div>
              <span className={`text-xs font-medium ${
                product.stock === 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : product.stock <= 3 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {product.stock} unidades
              </span>
            </div>
          </div>

          {/* Selector de cantidad y botón añadir */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg flex-shrink-0">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isOutOfStock}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="px-2 py-1.5 text-sm font-medium min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                disabled={quantity >= product.stock || isOutOfStock}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all duration-200 text-sm cursor-pointer ${
                isOutOfStock
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : isAdding
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-dark hover:bg-primary text-white hover:shadow-lg'
              }`}
            >
              {isAdding ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : isOutOfStock ? (
                'Sin Stock'
              ) : (
                'Añadir'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
