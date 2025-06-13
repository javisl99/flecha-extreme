'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button } from '@/shared/components';
import { DocumentIcon } from '@heroicons/react/24/outline';
import { SubirDocumentoModal } from '@/components/Documentos/SubirDocumentoModal';
import { useDocumentos, Documento } from '@/hooks/useDocumentos';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useUserData } from '@/hooks/useUserData';
import { FiltrosDocumentos, type FiltrosDocumentoState } from '@/components/Documentos/FiltrosDocumentos';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';

export default function DocumentosPage() {
  const [filtros, setFiltros] = useState<FiltrosDocumentoState>({
    nombre: '',
    descripcion: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<Documento | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { obtenerDocumentos, eliminarDocumento } = useDocumentos();
  const { usuario, loading: userLoading } = useUserData();
  
  const documentosFiltrados = documentos.filter(doc => {
    const cumpleNombre = !filtros.nombre || doc.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
    const cumpleDescripcion = !filtros.descripcion || (doc.descripcion?.toLowerCase() || '').includes(filtros.descripcion.toLowerCase());
    const cumpleUsuario = !filtros.usuario || 
      (doc.usuario && 
        (`${doc.usuario.nombre} ${doc.usuario.apellidos}`).toLowerCase().includes(filtros.usuario.toLowerCase())
      );

    const fechaDocumento = new Date(doc.created_at);
    const cumpleFechaDesde = !filtros.fechaDesde || fechaDocumento >= new Date(filtros.fechaDesde);
    const cumpleFechaHasta = !filtros.fechaHasta || fechaDocumento <= new Date(filtros.fechaHasta);

    return cumpleNombre && cumpleDescripcion && cumpleUsuario && cumpleFechaDesde && cumpleFechaHasta;
  });

  const cargarDocumentos = useCallback(async () => {
    try {
      const result = await obtenerDocumentos();
      
      if (result.success && result.data) {
        setDocumentos(result.data);
      } else {
        console.error('Error al cargar documentos:', result.error);
        toast.error('Error al cargar los documentos');
      }
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      toast.error('Error al cargar los documentos');
    }
  }, [obtenerDocumentos]);

  useEffect(() => {
    const inicializarDatos = async () => {
      if (!userLoading && usuario) {
        try {
          const result = await obtenerDocumentos();
          if (result.success && result.data) {
            setDocumentos(result.data);
          } else {
            console.error('Error al cargar documentos:', result.error);
            toast.error('Error al cargar los documentos');
          }
        } catch (error) {
          console.error('Error al cargar documentos:', error);
          toast.error('Error al cargar los documentos');
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    inicializarDatos();
  }, [userLoading, usuario, obtenerDocumentos]);

  const handleEliminarDocumento = (documento: Documento) => {
    setDocumentoAEliminar(documento);
    setIsModalConfirmacionOpen(true);
  };

  const handleConfirmarEliminacion = async () => {
    if (!documentoAEliminar) return;

    try {
      setIsDeleting(true);
      const result = await eliminarDocumento(documentoAEliminar);
      
      if (result.success) {
        setDocumentos(docs => docs.filter(doc => doc.id !== documentoAEliminar.id));
        toast.success('Documento eliminado correctamente');
      } else {
        toast.error(result.error || 'Error al eliminar el documento');
      }
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error inesperado al eliminar el documento');
    } finally {
      setIsDeleting(false);
      setIsModalConfirmacionOpen(false);
      setDocumentoAEliminar(null);
    }
  };

  const handleVerDocumento = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Documentos</h1>
          <Button 
            variant="primary" 
            className="cursor-pointer flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
            disabled={isInitialLoading}
          >
            <DocumentIcon className="h-5 w-5" />
            Subir Documento
          </Button>
        </div>
        
        <Card>
          <div className="mb-4">
            <FiltrosDocumentos onFiltrosChange={setFiltros} />
          </div>
          
          <div className="overflow-x-auto">
            {isInitialLoading || userLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : documentosFiltrados.length === 0 ? (
              <div className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No se encontraron documentos que coincidan con los filtros aplicados
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descripción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                  {documentosFiltrados.map((documento) => (
                    <tr 
                      key={documento.id} 
                      onClick={() => handleVerDocumento(documento.url)}
                      className="hover:bg-table-row-hover dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">{documento.nombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {documento.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {documento.usuario ? `${documento.usuario.nombre} ${documento.usuario.apellidos}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {new Date(documento.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end space-x-2">
                          <a 
                            href={documento.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full text-primary-dark dark:text-primary-light bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                            title="Ver"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarDocumento(documento);
                            }}
                            className="p-1.5 rounded-full text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer" 
                            title="Eliminar"
                            disabled={isDeleting}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDeleting ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <SubirDocumentoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            cargarDocumentos();
          }}
        />

        <ModalConfirmacion
          isOpen={isModalConfirmacionOpen}
          onClose={() => {
            setIsModalConfirmacionOpen(false);
            setDocumentoAEliminar(null);
          }}
          onConfirm={handleConfirmarEliminacion}
          titulo="Eliminar Documento"
          mensaje={`¿Estás seguro de que quieres eliminar el documento "${documentoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
        />
      </div>
    </ProtectedRoute>
  );
} 