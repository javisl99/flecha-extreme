'use client';

import { useState } from 'react';
import {
  LockClosedIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/shared/components';
import { useUserData } from '@/hooks/useUserData';

export default function ConfiguracionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useUserData();

  const handleCambiarContrasena = async () => {
    if (!nuevaContrasena) {
      setError('Por favor, introduce una nueva contraseña');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updatePassword(nuevaContrasena);

    if (result.success) {
      setSuccess('Contraseña actualizada correctamente');
      setNuevaContrasena('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(null);
      }, 2000);
    } else {
      setError(result.error || 'Error al actualizar la contraseña');
    }

    setLoading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNuevaContrasena('');
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary-dark">
              Configuración
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Gestiona la seguridad de tu cuenta.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            icon={<LockClosedIcon className="h-5 w-5" />}
            className="primary-gradient min-h-11 rounded-full border border-primary-light/10 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:brightness-110"
          >
            Cambiar contraseña
          </Button>
        </div>

        <section className="rounded-[1.5rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-card-ambient">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-headline text-xl font-extrabold text-primary-dark">
                Seguridad
              </h2>
              <p className="max-w-2xl text-sm text-on-surface-variant">
                Cambia tu contraseña cuando lo necesites para mantener protegida tu cuenta.
                Esta acción actualiza tus credenciales sin modificar el resto de ajustes.
              </p>
              <p className="inline-flex rounded-full border border-outline-variant/35 bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface-variant">
                Estado: protección activa
              </p>
            </div>
          </div>
        </section>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-t-[1.5rem] border border-outline-variant/35 bg-surface-container-lowest shadow-xl sm:rounded-2xl">
            <div className="primary-gradient flex items-center justify-between px-6 py-4">
              <h2 className="font-headline text-xl font-extrabold tracking-tight text-white">
                Cambiar contraseña
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md text-white/85 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <span className="sr-only">Cerrar</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="nueva-contrasena"
                  className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-outline"
                >
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  id="nueva-contrasena"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Introduce tu nueva contraseña"
                  className="h-11 w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 text-sm text-on-surface shadow-sm transition focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <p className="mt-2 text-xs text-on-surface-variant">
                  Se aplicará en tu siguiente inicio de sesión.
                </p>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-4 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="min-h-11 rounded-full border-outline-variant/45 bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCambiarContrasena}
                  loading={loading}
                  disabled={loading}
                  className="primary-gradient min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-110"
                >
                  {loading ? 'Actualizando...' : 'Aceptar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
