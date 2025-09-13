'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from './data';

interface ModalAddProductProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddStock: (productId: string, stockToAdd: number) => void;
  onAddNewProduct: (productData: Omit<Product, 'id'>, imageFile?: File) => void;
}

export default function ModalAddProduct({ 
  isOpen, 
  onClose, 
  products, 
  onAddStock, 
  onAddNewProduct 
}: ModalAddProductProps) {
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('new');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockToAdd, setStockToAdd] = useState(1);
  
  // Datos para nuevo producto
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    image: '',
    description: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedOption === 'existing') {
        if (selectedProductId && stockToAdd > 0) {
          onAddStock(selectedProductId, stockToAdd);
        }
      } else {
        if (newProduct.name && newProduct.price > 0 && newProduct.stock >= 0) {
          onAddNewProduct(newProduct, selectedImage || undefined);
        }
      }
      
      // Reset form
      setSelectedOption('new');
      setSelectedProductId('');
      setStockToAdd(1);
      setNewProduct({
        name: '',
        price: 0,
        stock: 0,
        image: '',
        description: ''
      });
      setSelectedImage(null);
      setImagePreview('');
      
      onClose();
    } catch (error) {
      console.error('Error al procesar:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form al cerrar
    setSelectedOption('new');
    setSelectedProductId('');
    setStockToAdd(1);
    setNewProduct({
      name: '',
      price: 0,
      stock: 0,
      image: '',
      description: ''
    });
    setSelectedImage(null);
    setImagePreview('');
    onClose();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-500 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestionar Productos
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selector de opción */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de operación
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                autoFocus // Esto asegura que el botón "Nuevo Producto" esté enfocado por defecto
                onClick={() => {
                  setIsAnimating(true);
                  setSelectedOption('new');
                  setTimeout(() => setIsAnimating(false), 500);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedOption === 'new'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                } cursor-pointer`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Nuevo Producto</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Crear un nuevo producto
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsAnimating(true);
                  setSelectedOption('existing');
                  setTimeout(() => setIsAnimating(false), 500);
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedOption === 'existing'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                } cursor-pointer`}
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="font-medium">Agregar Stock</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Añadir unidades a producto existente
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Contenido según la opción seleccionada */}
          <div className={`relative transition-all duration-500 ease-in-out ${isAnimating ? 'modal-resize' : ''}`}>
            {selectedOption === 'existing' ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="animate-slideInLeft">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seleccionar Producto
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white cursor-pointer transition-all duration-200"
                    required
                  >
                    <option value="">Selecciona un producto...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock actual: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductId && (
                  <div className="animate-slideInRight">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cantidad a agregar
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stockToAdd}
                      onChange={(e) => setStockToAdd(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {/* Imagen */}
                <div className="animate-slideInLeft">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Imagen del Producto
                  </label>
                  <div className="flex items-center space-x-4 overflow-visible">
                    <label className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-visible flex-shrink-0 transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary relative">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                        required
                      />
                      {selectedImage && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Archivo seleccionado: {selectedImage.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Precio y Stock */}
                <div className="grid grid-cols-2 gap-4 animate-slideInUp">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Precio (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>


                {/* Descripción */}
                <div className="animate-slideInRight">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    placeholder="Descripción del producto..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer bg-gray-200 dark:bg-gray-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-primary-dark hover:bg-primary text-white hover:shadow-lg'
              } cursor-pointer`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Procesando...
                </div>
              ) : selectedOption === 'existing' ? (
                'Agregar Stock'
              ) : (
                'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
