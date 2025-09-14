'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/Tienda/ProductCard';
import ShoppingCart from '@/components/Tienda/ShoppingCart';
import AddProductButton from '@/components/Tienda/AddProductButton';
import ModalAddProduct from '@/components/Tienda/ModalAddProduct';
import ModalEditProduct from '@/components/Tienda/ModalEditProduct';
import ModalPago from '@/components/Tienda/ModalPago';
import SwitchVista, { type VistaTipo } from '@/components/Tienda/SwitchVista';
import VistaPedidos from '@/components/Tienda/VistaPedidos';
import Toast from '@/shared/components/Toast';
import { SurfSpinner } from '@/shared/components';
import { useProductos } from '@/hooks/useProductos';
import { usePagos } from '@/hooks/usePagos';
import { type Product, type CartItem } from '@/components/Tienda/data';

export default function TiendaPage() {
  const [vistaActual, setVistaActual] = useState<VistaTipo>('tienda');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  
  // Estados para Toast
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error'
  });
  
  // Estado para controlar el tiempo mínimo de carga
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  
  // Hook para obtener productos de la base de datos
  const { productos, loading, error, addStockToProduct, addNewProduct, updateProduct, deleteProduct, refetch } = useProductos();
  
  // Hook para procesar pagos
  const { procesarPago } = usePagos();
  
  // Efecto para garantizar un tiempo mínimo de carga de 1 segundo
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Loading real es la combinación del loading de datos Y el tiempo mínimo
  const isLoading = loading || minLoadingTime;

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image
        }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCheckout = () => {
    // Simular proceso de checkout
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    showToast(`¡Pedido completado! Total: ${total.toFixed(2)} €`, 'success');
    setCartItems([]);
  };

  const handleProceedToPayment = (discountPercentage: number) => {
    setDiscountPercentage(discountPercentage);
    setShowPagoModal(true);
  };

  const handlePagoSubmit = async (data: {
    id_cliente: string | null;
    items: CartItem[];
    subtotal: number;
    descuento: number;
    descuentoPorcentaje: number;
    iva: number;
    total: number;
    concepto: string;
    pago: {
      metodo: string;
      estado: string;
    };
  }) => {
    try {
      const result = await procesarPago(data);
      
      if (result.success) {
        showToast(`¡Pago procesado exitosamente! Total: ${data.total.toFixed(2)} €`, 'success');
        setCartItems([]);
        setDiscountPercentage(0);
        // Refrescar los productos para actualizar el stock
        await refetch();
      } else {
        showToast(result.message || 'Error al procesar el pago', 'error');
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      showToast('Error al procesar el pago', 'error');
    }
  };

  const handleAddProduct = () => {
    setShowAddProductModal(true);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleAddStock = async (productId: string, stockToAdd: number) => {
    const result = await addStockToProduct(productId, stockToAdd);
    if (result.success) {
      showToast(`Stock agregado exitosamente. Se añadieron ${stockToAdd} unidades.`, 'success');
    } else {
      showToast(`Error al agregar stock: ${result.error}`, 'error');
    }
  };

  const handleAddNewProduct = async (productData: Omit<Product, 'id'>, imageFile?: File) => {
    const result = await addNewProduct(productData, imageFile);
    if (result.success) {
      showToast(`Producto "${productData.name}" creado exitosamente.`, 'success');
    } else {
      showToast(`Error al crear producto: ${result.error}`, 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = async (productId: string, updatedProduct: Partial<Product>, imageFile?: File) => {
    const result = await updateProduct(productId, updatedProduct, imageFile);
    if (result.success) {
      showToast(`Producto actualizado exitosamente.`, 'success');
    } else {
      showToast(`Error al actualizar producto: ${result.error}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProduct(productId);
    if (result.success) {
      showToast(`Producto eliminado exitosamente.`, 'success');
    } else {
      showToast(`Error al eliminar producto: ${result.error}`, 'error');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">
            {vistaActual === 'tienda' ? 'Tienda Flecha Extreme' : 'Pedidos Flecha Extreme'}
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* Botón flotante para añadir productos (solo en vista tienda) */}
            {vistaActual === 'tienda' && (
              <AddProductButton onAddProduct={handleAddProduct} />
            )}
            
            {/* Switch de vista */}
            <SwitchVista vistaActual={vistaActual} onVistaChange={setVistaActual} />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {vistaActual === 'tienda' ? (
          <>
            {/* Área de productos (2/3 de la pantalla) */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <SurfSpinner size="lg" showText={true} text="Cargando productos..." />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Error al cargar productos
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {error}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productos.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onEditProduct={handleEditProduct}
                      />
                    ))}
                  </div>
                  
                  {productos.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No hay productos disponibles
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Añade productos para comenzar a vender
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cesta lateral (1/3 de la pantalla) */}
            <div className="w-96 border-l border-gray-200 dark:border-gray-700">
              <ShoppingCart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={handleCheckout}
                onProceedToPayment={handleProceedToPayment}
              />
            </div>
          </>
        ) : (
          /* Vista de Pedidos */
          <div className="flex-1 overflow-y-auto p-6">
            <VistaPedidos />
          </div>
        )}
      </div>

      {/* Modal para agregar productos */}
      <ModalAddProduct
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        products={productos}
        onAddStock={handleAddStock}
        onAddNewProduct={handleAddNewProduct}
      />


      {/* Modal para editar productos */}
      <ModalEditProduct
        isOpen={showEditProductModal}
        onClose={() => {
          setShowEditProductModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Modal de pago */}
      <ModalPago
        isOpen={showPagoModal}
        onClose={() => setShowPagoModal(false)}
        onSubmit={handlePagoSubmit}
        cartItems={cartItems}
        discountPercentage={discountPercentage}
      />

      {/* Toast para notificaciones */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
}
