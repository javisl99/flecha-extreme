import { useState } from 'react';
import { Button } from '@/shared/components';
import { useDocumentos } from '@/hooks/useDocumentos';
import { toast } from 'react-hot-toast';
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SubirDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  nombre: string;
  descripcion: string;
  archivo: File | null;
}

export function SubirDocumentoModal({ isOpen, onClose, onSuccess }: SubirDocumentoModalProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    archivo: null,
  });
  const { subirDocumento, loading } = useDocumentos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.archivo) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    // Validar que sea un archivo PDF
    if (!formData.archivo.type.includes('pdf')) {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño máximo (10MB)
    if (formData.archivo.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 10MB');
      return;
    }

    const result = await subirDocumento({
      nombre: formData.nombre,
      descripcion: formData.descripcion || undefined,
      archivo: formData.archivo,
    });

    if (result.success) {
      toast.success('Documento subido correctamente');
      onSuccess();
      onClose();
      // Limpiar el formulario
      setFormData({
        nombre: '',
        descripcion: '',
        archivo: null,
      });
    } else {
      toast.error(result.error || 'Error al subir el documento');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl sm:rounded-2xl">
        <div className="primary-gradient flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-white" />
            <h2 className="font-headline text-xl font-extrabold tracking-tight text-white">Subir Documento</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md text-white/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                Nombre *
              </label>
              <input
                type="text"
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Nombre del documento"
                required
              />
            </div>

            <div>
              <label htmlFor="archivo" className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
                Archivo PDF *
              </label>
              <label
                htmlFor="archivo"
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-outline-variant/45 bg-surface-container-low px-4 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-surface-container-high"
              >
                <ArrowUpTrayIcon className="h-4.5 w-4.5" />
                {formData.archivo ? 'Cambiar archivo' : 'Seleccionar PDF'}
              </label>
              <input
                id="archivo"
                name="archivo"
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFormData({ ...formData, archivo: file || null });
                }}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="descripcion" className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="min-h-[100px] w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Añade un contexto para identificar el documento"
            />
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <div className="flex items-start gap-2.5">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-primary">Requisitos</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Solo se permiten archivos PDF de hasta 10MB.
                </p>
                {formData.archivo ? (
                  <p className="mt-1 text-xs font-semibold text-on-surface">
                    Archivo seleccionado: {formData.archivo.name}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-5 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
              disabled={loading}
              className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 text-white shadow-lg shadow-primary/20 hover:brightness-110"
            >
              Subir documento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
