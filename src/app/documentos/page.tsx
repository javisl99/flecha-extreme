'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/shared/components';
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { SubirDocumentoModal } from '@/components/Documentos/SubirDocumentoModal';
import { useDocumentos, Documento } from '@/hooks/useDocumentos';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { useUserData } from '@/hooks/useUserData';
import { FiltrosDocumentos, type FiltrosDocumentoState } from '@/components/Documentos/FiltrosDocumentos';
import ModalConfirmacion from '@/components/shared/ModalConfirmacion';
import TableSkeleton from '@/components/shared/TableSkeleton';
import PaginationControls from '@/components/shared/PaginationControls';

const DOCUMENTOS_POR_PAGINA = 10;

export default function DocumentosPage() {
  const [filtros, setFiltros] = useState<FiltrosDocumentoState>({
    nombre: '',
    descripcion: '',
    usuario: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmacionOpen, setIsModalConfirmacionOpen] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<Documento | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [paginaDocumentos, setPaginaDocumentos] = useState(1);
  const { obtenerDocumentos, eliminarDocumento } = useDocumentos();
  const { usuario, loading: userLoading } = useUserData();

  const getDocumentoFecha = (documento: Documento) => documento.created_at || documento.fechaCreacion || '';

  const formatearFechaDocumento = (documento: Documento) => {
    const fecha = getDocumentoFecha(documento);
    if (!fecha) return '-';
    const parsedDate = new Date(fecha);
    return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleDateString('es-ES');
  };

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      const cumpleNombre = !filtros.nombre || doc.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
      const cumpleDescripcion = !filtros.descripcion || (doc.descripcion?.toLowerCase() || '').includes(filtros.descripcion.toLowerCase());
      const cumpleUsuario = !filtros.usuario || (
        doc.usuario &&
        (`${doc.usuario.nombre} ${doc.usuario.apellidos}`).toLowerCase().includes(filtros.usuario.toLowerCase())
      );

      const fechaDocumento = new Date(getDocumentoFecha(doc));
      const cumpleFechaDesde = !filtros.fechaDesde || fechaDocumento >= new Date(filtros.fechaDesde);
      const cumpleFechaHasta = !filtros.fechaHasta || fechaDocumento <= new Date(filtros.fechaHasta);

      return cumpleNombre && cumpleDescripcion && cumpleUsuario && cumpleFechaDesde && cumpleFechaHasta;
    });
  }, [documentos, filtros]);

  const totalPaginasDocumentos = Math.max(1, Math.ceil(documentosFiltrados.length / DOCUMENTOS_POR_PAGINA));
  const paginaDocumentosActiva = Math.min(paginaDocumentos, totalPaginasDocumentos);
  const documentosPaginados = useMemo(() => {
    const inicio = (paginaDocumentosActiva - 1) * DOCUMENTOS_POR_PAGINA;
    return documentosFiltrados.slice(inicio, inicio + DOCUMENTOS_POR_PAGINA);
  }, [documentosFiltrados, paginaDocumentosActiva]);

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

  useEffect(() => {
    setPaginaDocumentos(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaDocumentos((paginaActual) => Math.min(paginaActual, totalPaginasDocumentos));
  }, [totalPaginasDocumentos]);

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
          setDocumentos((docs) => docs.filter((doc) => doc.id !== documentoAEliminar.id));
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
      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">Documentos</h1>
          <Button
            variant="primary"
            className="primary-gradient flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
            onClick={() => setIsModalOpen(true)}
            disabled={isInitialLoading}
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Subir Documento
          </Button>
        </div>

        <section className="overflow-hidden rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest shadow-card-ambient">
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <FiltrosDocumentos
              onFiltrosChange={setFiltros}
              title="Listado de documentos"
              subtitle="Encuentra documentos por nombre, usuario, descripción o fecha."
            />
          </div>

          <div className="border-t border-outline-variant/20" />

          <div className="hidden overflow-x-auto md:block">
            {isInitialLoading || userLoading ? (
              <TableSkeleton columns={5} rows={5} />
            ) : documentosFiltrados.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm font-medium text-outline">
                No se encontraron documentos que coincidan con los filtros aplicados
              </div>
            ) : (
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Nombre
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Descripción
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-[0.14em] text-outline">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documentosPaginados.map((documento, index) => (
                    <tr
                      key={documento.id}
                      onClick={() => handleVerDocumento(documento.url)}
                      className={`group cursor-pointer border-b border-outline-variant/10 transition ${
                        index % 2 ? 'bg-surface-container-low/25 hover:bg-surface-container-low' : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-1.5">
                            <DocumentIcon className="h-4 w-4 text-outline" />
                          </span>
                          <span className="truncate font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {documento.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {documento.descripcion || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {documento.usuario ? `${documento.usuario.nombre} ${documento.usuario.apellidos}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                        {formatearFechaDocumento(documento)}
                      </td>
                      <td
                        className="px-6 py-4 text-right text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          <a
                            href={documento.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low text-primary-dark transition hover:border-primary/30 hover:text-primary"
                            title="Ver"
                          >
                            <EyeIcon className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarDocumento(documento);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                            title="Eliminar"
                            disabled={isDeleting}
                          >
                            <TrashIcon className={`h-4.5 w-4.5 ${isDeleting ? 'opacity-50' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {isInitialLoading || userLoading ? (
              <TableSkeleton columns={1} rows={4} />
            ) : documentosFiltrados.length === 0 ? (
              <div className="rounded-xl border border-dashed border-outline-variant/35 bg-surface-container-low px-4 py-10 text-center text-sm font-medium text-outline">
                No se encontraron documentos que coincidan con los filtros aplicados
              </div>
            ) : (
              documentosPaginados.map((documento) => (
                <div
                  key={documento.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleVerDocumento(documento.url)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleVerDocumento(documento.url);
                    }
                  }}
                  className="group w-full rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-low px-4 py-4 text-left transition hover:bg-surface-container-high"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1.5">
                          <DocumentIcon className="h-4 w-4 text-outline" />
                        </span>
                        <span className="truncate text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                          {documento.nombre}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-on-surface-variant">{documento.descripcion || '-'}</p>
                    </div>
                    <span className="rounded-full bg-surface-container-lowest px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-primary">
                      Ver
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-on-surface-variant">
                    <p>{documento.usuario ? `${documento.usuario.nombre} ${documento.usuario.apellidos}` : '-'}</p>
                    <p>{formatearFechaDocumento(documento)}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={documento.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary-dark transition hover:border-primary/30 hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver documento
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarDocumento(documento);
                      }}
                      className="min-h-11 flex-1 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      disabled={isDeleting}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <PaginationControls
            currentPage={paginaDocumentosActiva}
            totalPages={totalPaginasDocumentos}
            totalItems={documentosFiltrados.length}
            pageSize={DOCUMENTOS_POR_PAGINA}
            onPageChange={setPaginaDocumentos}
          />
        </section>

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
          variante="documentos-v2"
        />
      </div>
    </ProtectedRoute>
  );
}
