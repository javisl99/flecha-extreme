'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from './data';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';

interface ModalEditProductProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateProduct: (productId: string, updatedProduct: Partial<Product>, imageFile?: File) => void;
  onDeleteProduct: (productId: string) => void;
}

export default function ModalEditProduct({ 
  isOpen, 
  onClose, 
  product,
  onUpdateProduct,
  onDeleteProduct 
}: ModalEditProductProps) {
  const [editedProduct, setEditedProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    description: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Inicializar datos cuando se abre la modal
  useEffect(() => {
    if (product && isOpen) {
      setEditedProduct({
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description || ''
      });
      // Asegurar que la imagen se muestre correctamente
      if (product.image && product.image.trim() !== '') {
        setImagePreview(product.image);
      } else {
        setImagePreview('');
      }
      setSelectedImage(null);
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);

    try {
      const updatedData: Partial<Product> = {
        name: editedProduct.name,
        price: editedProduct.price,
        stock: editedProduct.stock,
        description: editedProduct.description
      };

      onUpdateProduct(product.id, updatedData, selectedImage || undefined);
      onClose();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEditedProduct({
      name: '',
      price: 0,
      stock: 0,
      description: ''
    });
    setSelectedImage(null);
    setImagePreview('');
    setIsSubmitting(false);
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

  const handleInputChange = (field: string, value: string | number) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteProduct = () => {
    if (!product) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!product) return;
    onDeleteProduct(product.id);
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-500 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Editar Producto
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
          {/* Imagen del producto */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Imagen del Producto
            </label>
            <div className="flex items-center space-x-4">
              <label className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary relative bg-gray-100 dark:bg-gray-700">
                {imagePreview && imagePreview.trim() !== '' ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full transition-all duration-300 bg-white"
                    style={{ display: 'block' }}
                    onError={() => {
                      console.error('Error loading image:', imagePreview);
                      setImagePreview('');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700">
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
                <div className="absolute inset-0 bg-transparent transition-all duration-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400 opacity-0 hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </label>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Haz clic en la imagen para cambiarla
                </p>
                {selectedImage && (
                  <p className="text-sm text-primary mt-1">
                    Archivo seleccionado: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Nombre del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              required
            />
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editedProduct.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={editedProduct.stock}
                onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={editedProduct.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-all duration-200"
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleDeleteProduct}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors cursor-pointer bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </div>
            </button>
            
            <div className="flex space-x-3">
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
                    Guardando...
                  </div>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ModalConfirmacion
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        titulo="Eliminar Producto"
        mensaje={`¿Estás seguro de que quieres eliminar el producto "${product?.name}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
      />
    </div>
  );
}
