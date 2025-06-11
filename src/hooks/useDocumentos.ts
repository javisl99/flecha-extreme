import { useState } from 'react';
import supabaseClient from '@/lib/supabaseClient';
import { useUserData } from './useUserData';

export interface Documento {
  id: string;
  id_usuario: string;
  nombre: string;
  descripcion?: string;
  url: string;
  created_at: string;
  usuario?: {
    nombre: string;
    apellidos: string;
  };
}

interface SubirDocumentoParams {
  nombre: string;
  descripcion?: string;
  archivo: File;
}

interface DocumentoResponse {
  success: boolean;
  error?: string;
  data?: Documento;
}

interface DocumentosResponse {
  success: boolean;
  error?: string;
  data?: Documento[];
}

export function useDocumentos() {
  const [loading, setLoading] = useState(false);
  const { usuario } = useUserData();

  const subirDocumento = async ({ nombre, descripcion, archivo }: SubirDocumentoParams): Promise<DocumentoResponse> => {
    if (!usuario) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      // 1. Subir el archivo al bucket 'documentos'
      const fileName = `${Date.now()}_${archivo.name}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from('documentos')
        .upload(fileName, archivo);

      if (uploadError) {
        throw new Error('Error al subir el archivo: ' + uploadError.message);
      }

      // 2. Obtener la URL del archivo subido
      const { data: { publicUrl } } = supabaseClient
        .storage
        .from('documentos')
        .getPublicUrl(fileName);

      // 3. Insertar el registro en la tabla documento
      const { data: documentoData, error: documentoError } = await supabaseClient
        .from('documento')
        .insert({
          id_usuario: usuario.id,
          nombre,
          descripcion,
          url: publicUrl
        })
        .select()
        .single();

      if (documentoError) {
        // Si hay error, eliminamos el archivo subido para mantener consistencia
        await supabaseClient
          .storage
          .from('documentos')
          .remove([fileName]);
        
        throw new Error('Error al guardar el documento: ' + documentoError.message);
      }

      return { 
        success: true, 
        data: documentoData as Documento 
      };

    } catch (error) {
      console.error('Error en subirDocumento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al subir el documento' 
      };
    } finally {
      setLoading(false);
    }
  };

  const obtenerDocumentos = async (intentos = 3): Promise<DocumentosResponse> => {
    if (!usuario) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      const { data, error } = await supabaseClient
        .from('documento')
        .select(`
          *,
          usuario:id_usuario (
            nombre,
            apellidos
          )
        `)
        .eq('id_usuario', usuario.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Si hay un error y aún quedan intentos, reintentamos
        if (intentos > 1) {
          console.log(`Reintentando obtener documentos. Intentos restantes: ${intentos - 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de reintentar
          return obtenerDocumentos(intentos - 1);
        }
        throw error;
      }

      if (!data) {
        return { 
          success: false, 
          error: 'No se recibieron datos del servidor' 
        };
      }

      return { 
        success: true, 
        data: data as Documento[] 
      };

    } catch (error) {
      console.error('Error en obtenerDocumentos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al obtener los documentos' 
      };
    } finally {
      setLoading(false);
    }
  };

  const eliminarDocumento = async (documento: Documento): Promise<DocumentoResponse> => {
    if (!usuario) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    try {
      setLoading(true);

      // 1. Obtener el nombre del archivo de la URL
      const fileName = documento.url.split('/').pop();
      if (!fileName) {
        throw new Error('No se pudo obtener el nombre del archivo');
      }

      // 2. Eliminar el archivo del bucket
      const { error: storageError } = await supabaseClient
        .storage
        .from('documentos')
        .remove([fileName]);

      if (storageError) {
        throw new Error('Error al eliminar el archivo: ' + storageError.message);
      }

      // 3. Eliminar el registro de la tabla
      const { error: dbError } = await supabaseClient
        .from('documento')
        .delete()
        .eq('id', documento.id)
        .eq('id_usuario', usuario.id); // Verificación adicional de seguridad

      if (dbError) {
        throw new Error('Error al eliminar el registro: ' + dbError.message);
      }

      return { success: true };

    } catch (error) {
      console.error('Error en eliminarDocumento:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al eliminar el documento' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    subirDocumento,
    obtenerDocumentos,
    eliminarDocumento
  };
} 