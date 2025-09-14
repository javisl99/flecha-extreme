'use client';

import { useState } from 'react';

interface AddProductButtonProps {
  onAddProduct: () => void;
}

export default function AddProductButton({ onAddProduct }: AddProductButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onAddProduct}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-primary-dark hover:bg-primary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group cursor-pointer"
      title="Añadir nuevo producto"
    >
      <div className="relative">
        <svg 
          className={`w-6 h-6 transition-transform duration-300 ${isHovered ? 'rotate-90' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
          />
        </svg>
        
      </div>
      
      {/* Tooltip */}
      <div className={`absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none`}>
        Añadir Producto
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
      </div>
    </button>
  );
}
