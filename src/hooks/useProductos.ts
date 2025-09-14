'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Product } from '@/components/Tienda/data';

export function useProductos() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) {
        throw error;
      }

      // Transformar los datos de la base de datos al formato esperado
      const transformedProductos: Product[] = data?.map((producto: any) => ({
        id: producto.id.toString(),
        name: producto.nombre,
        price: parseFloat(producto.precio),
        stock: parseInt(producto.stock),
        image: producto.url_foto || '',
        description: producto.descripcion || '',
        category: producto.categoria || 'Equipamiento'
      })) || [];

      setProductos(transformedProductos);
    } catch (err) {
      console.error('Error al obtener productos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const addStockToProduct = async (productId: string, stockToAdd: number) => {
    try {
      // Primero obtener el stock actual
      const { data: currentProduct, error: fetchError } = await supabase
        .from('producto')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newStock = currentProduct.stock + stockToAdd;

      // Actualizar con el nuevo stock
      const { error } = await supabase
        .from('producto')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setProductos(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, stock: newStock }
            : product
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error al agregar stock:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  const subtractStockFromProduct = async (productId: string, stockToSubtract: number) => {
    try {
      // Primero obtener el stock actual
      const { data: currentProduct, error: fetchError } = await supabase
        .from('producto')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Verificar que hay suficiente stock
      if (currentProduct.stock < stockToSubtract) {
        throw new Error(`Stock insuficiente. Disponible: ${currentProduct.stock}, Solicitado: ${stockToSubtract}`);
      }

      const newStock = currentProduct.stock - stockToSubtract;

      // Actualizar con el nuevo stock
      const { error } = await supabase
        .from('producto')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setProductos(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, stock: newStock }
            : product
        )
      );

      return { success: true };
    } catch (err) {
      console.error('Error al restar stock:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  const subtractStockFromMultipleProducts = async (items: { id: string; quantity: number }[]) => {
    try {
      // Verificar stock disponible para todos los productos antes de hacer cambios
      for (const item of items) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from('producto')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError) {
          throw new Error(`Error al verificar stock del producto ${item.id}: ${fetchError.message}`);
        }

        if (currentProduct.stock < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ${item.id}. Disponible: ${currentProduct.stock}, Solicitado: ${item.quantity}`);
        }
      }

      // Si todos los productos tienen stock suficiente, proceder a restar
      const updatePromises = items.map(async (item) => {
        const { data: currentProduct, error: fetchError } = await supabase
          .from('producto')
          .select('stock')
          .eq('id', item.id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        const newStock = currentProduct.stock - item.quantity;

        const { error } = await supabase
          .from('producto')
          .update({ stock: newStock })
          .eq('id', item.id);

        if (error) {
          throw error;
        }

        return { productId: item.id, newStock };
      });

      const results = await Promise.all(updatePromises);

      // Actualizar el estado local
      setProductos(prev => 
        prev.map(product => {
          const result = results.find(r => r.productId === product.id);
          return result ? { ...product, stock: result.newStock } : product;
        })
      );

      return { success: true };
    } catch (err) {
      console.error('Error al restar stock de múltiples productos:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  const addNewProduct = async (productData: Omit<Product, 'id'>, imageFile?: File) => {
    try {
      let imageUrl = '';

      // Si hay un archivo de imagen, subirlo al bucket
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `productos/${fileName}`;

        // Subir archivo al bucket 'fotos_productos'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos_productos')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('fotos_productos')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Crear el producto en la base de datos
      const { data, error } = await supabase
        .from('producto')
        .insert([{
          nombre: productData.name,
          precio: productData.price,
          stock: productData.stock,
          url_foto: imageUrl,
          descripcion: productData.description || ''
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Agregar el nuevo producto al estado local
      const newProduct: Product = {
        id: data.id.toString(),
        name: data.nombre,
        price: parseFloat(data.precio),
        stock: parseInt(data.stock),
        image: data.url_foto || '',
        description: data.descripcion || '',
        category: data.categoria || 'Equipamiento'
      };

      setProductos(prev => [...prev, newProduct]);

      return { success: true, product: newProduct };
    } catch (err) {
      console.error('Error al crear producto:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  const updateProduct = async (productId: string, updatedData: Partial<Product>, imageFile?: File) => {
    try {
      let imageUrl = '';

      // Si hay un archivo de imagen, subirlo al bucket
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `productos/${fileName}`;

        // Subir archivo al bucket 'fotos_productos'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos_productos')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('fotos_productos')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Preparar los datos para actualizar
      const updateData: any = {};
      if (updatedData.name) updateData.nombre = updatedData.name;
      if (updatedData.price !== undefined) updateData.precio = updatedData.price;
      if (updatedData.stock !== undefined) updateData.stock = updatedData.stock;
      if (updatedData.description !== undefined) updateData.descripcion = updatedData.description;
      if (imageUrl) updateData.url_foto = imageUrl;

      // Actualizar el producto en la base de datos
      const { data, error } = await supabase
        .from('producto')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      setProductos(prev => 
        prev.map(product => 
          product.id === productId 
            ? {
                ...product,
                name: updatedData.name || product.name,
                price: updatedData.price !== undefined ? updatedData.price : product.price,
                stock: updatedData.stock !== undefined ? updatedData.stock : product.stock,
                description: updatedData.description !== undefined ? updatedData.description : product.description,
                image: imageUrl || product.image
              }
            : product
        )
      );

      return { success: true, product: data };
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      // Primero obtener la información del producto para acceder a la URL de la imagen
      const { data: productData, error: fetchError } = await supabase
        .from('producto')
        .select('url_foto')
        .eq('id', productId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Si el producto tiene una imagen, eliminarla del bucket
      if (productData.url_foto && productData.url_foto.trim() !== '') {
        try {
          // Extraer el nombre del archivo de la URL
          const urlParts = productData.url_foto.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `productos/${fileName}`;

          // Eliminar el archivo del bucket 'fotos_productos'
          const { error: deleteImageError } = await supabase.storage
            .from('fotos_productos')
            .remove([filePath]);

          if (deleteImageError) {
            console.warn('Error al eliminar imagen del storage:', deleteImageError);
            // No lanzamos error aquí porque queremos continuar con la eliminación del producto
          }
        } catch (imageError) {
          console.warn('Error al procesar eliminación de imagen:', imageError);
          // Continuamos con la eliminación del producto aunque falle la eliminación de la imagen
        }
      }

      // Eliminar el producto de la base de datos
      const { error } = await supabase
        .from('producto')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Actualizar el estado local eliminando el producto
      setProductos(prev => prev.filter(product => product.id !== productId));

      return { success: true };
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  };

  return {
    productos,
    loading,
    error,
    refetch: fetchProductos,
    addStockToProduct,
    subtractStockFromProduct,
    subtractStockFromMultipleProducts,
    addNewProduct,
    updateProduct,
    deleteProduct
  };
}
