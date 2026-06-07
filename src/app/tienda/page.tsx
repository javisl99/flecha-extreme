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
import OverlayPanel from '@/components/shared/OverlayPanel';
import Toast from '@/shared/components/Toast';
import { useProductos } from '@/hooks/useProductos';
import { usePagos } from '@/hooks/usePagos';
import { type Product, type CartItem } from '@/components/Tienda/data';
import { formatPrice } from '@/lib/formatUtils';

const LoadingSkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-surface-container-high ${className}`}>
    <div className="tienda-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

const LoadingSkeletonPill = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-full bg-surface-container-high ${className}`}>
    <div className="tienda-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

export default function TiendaPage() {
  const [vistaActual, setVistaActual] = useState<VistaTipo>('tienda');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setShowCartDrawer(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Loading real es la combinación del loading de datos Y el tiempo mínimo
  const isLoading = loading || minLoadingTime;
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const renderLoadingSkeleton = () => (
    <div className="flex flex-col gap-5">
      <style jsx global>{`
        @keyframes tienda-loading-shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }

        .tienda-loading-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 45%,
            rgba(255, 255, 255, 0.24) 50%,
            rgba(255, 255, 255, 0.12) 55%,
            transparent 100%
          );
          animation: tienda-loading-shimmer 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest px-4 py-4 shadow-card-ambient sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <LoadingSkeletonBlock className="h-8 w-56" />
            <LoadingSkeletonBlock className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <LoadingSkeletonBlock className="h-11 w-40 rounded-full" />
            <LoadingSkeletonPill className="h-11 w-28" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto px-0 pb-4 pt-0">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[1.75rem] border border-outline-variant/25 bg-surface-container-lowest shadow-card-ambient">
                <LoadingSkeletonBlock className="h-56 w-full rounded-none rounded-t-[1.75rem]" />
                <div className="space-y-3 p-4">
                  <LoadingSkeletonBlock className="h-5 w-4/5 rounded-full" />
                  <LoadingSkeletonBlock className="h-4 w-3/5 rounded-full" />
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <LoadingSkeletonPill className="h-8 w-24" />
                    <LoadingSkeletonPill className="h-8 w-20" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <LoadingSkeletonBlock className="h-10 rounded-xl" />
                    <LoadingSkeletonBlock className="h-10 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden w-96 shrink-0 xl:block">
          <div className="rounded-[1.5rem] border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-card-ambient">
            <div className="space-y-3">
              <LoadingSkeletonBlock className="h-6 w-36" />
              <LoadingSkeletonBlock className="h-4 w-52" />
            </div>

            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
                  <LoadingSkeletonBlock className="h-16 w-16 rounded-2xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <LoadingSkeletonBlock className="h-4 w-5/6 rounded-full" />
                    <LoadingSkeletonBlock className="h-3 w-2/3 rounded-full" />
                    <div className="flex items-center gap-2 pt-1">
                      <LoadingSkeletonPill className="h-5 w-16" />
                      <LoadingSkeletonPill className="h-5 w-14" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              <LoadingSkeletonBlock className="h-10 w-full rounded-full" />
              <LoadingSkeletonBlock className="h-10 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="app-safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant/25 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-xl xl:hidden">
        <LoadingSkeletonBlock className="h-12 w-full rounded-full" />
      </div>
    </div>
  );

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Verificar que no se exceda el stock al sumar la cantidad
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= product.stock) {
          return prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: newQuantity, stock: product.stock }
              : item
          );
        } else {
          // Si excede el stock, ajustar al máximo disponible
          return prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: product.stock, stock: product.stock }
              : item
          );
        }
      } else {
        return [...prevItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.image,
          stock: product.stock
        }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          // Verificar que la cantidad no exceda el stock disponible
          const maxQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: maxQuantity };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setShowCartDrawer(false);
  };

  const handleCheckout = () => {
    // Simular proceso de checkout
    const total = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    showToast(`¡Pedido completado! Total: ${total.toFixed(2)} €`, 'success');
    setCartItems([]);
  };

  const handleProceedToPayment = (discountPercentage: number) => {
    setDiscountPercentage(discountPercentage);
    setShowCartDrawer(false);
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
        
        // Retornar el resultado con el ID del pedido
        return { pedidoId: result.data?.pedidoId };
      } else {
        showToast(result.message || 'Error al procesar el pago', 'error');
        return;
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      showToast('Error al procesar el pago', 'error');
      return;
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
    <div className="min-h-screen-safe flex flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-outline-variant/40 bg-surface-container-lowest px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-bold text-primary-dark">
            {vistaActual === 'tienda' ? 'Tienda Flecha Extreme' : 'Pedidos Flecha Extreme'}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
      <div className="flex flex-1 overflow-hidden">
        {vistaActual === 'tienda' ? (
          <>
            {/* Área de productos */}
            <div className="flex-1 min-w-0 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 xl:pb-6">
              {isLoading ? (
                renderLoadingSkeleton()
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
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,18.5rem))] justify-start gap-5 xl:gap-6">
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

            {/* Cesta lateral desktop */}
            <div className="hidden w-96 shrink-0 p-4 pl-0 xl:block">
              <ShoppingCart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onCheckout={handleCheckout}
                onProceedToPayment={handleProceedToPayment}
                className="md:border-l-0"
                mode="embedded"
              />
            </div>
          </>
        ) : (
          /* Vista de Pedidos */
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <VistaPedidos />
          </div>
        )}
      </div>

      {vistaActual === 'tienda' ? (
        <>
          <div className="app-safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-outline-variant/25 bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-xl xl:hidden">
            <button
              type="button"
              onClick={() => setShowCartDrawer(true)}
              className="primary-gradient flex min-h-12 w-full items-center justify-between rounded-full px-4 py-3 text-left text-sm font-bold text-white shadow-lg shadow-primary/20"
            >
              <span>{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</span>
              <span>{formatPrice(cartSubtotal)}</span>
            </button>
          </div>

          <OverlayPanel
            isOpen={showCartDrawer}
            onClose={() => setShowCartDrawer(false)}
            title="Cesta de compra"
            position="right"
            bodyClassName="h-full"
            panelClassName="xl:hidden"
          >
            <ShoppingCart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              onProceedToPayment={handleProceedToPayment}
              mode="drawer"
              className="h-full"
            />
          </OverlayPanel>
        </>
      ) : null}

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
