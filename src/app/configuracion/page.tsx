'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { useUserData } from '@/hooks/useUserData';

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function ConfiguracionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useUserData();

  const handleCambiarContraseña = async () => {
    if (!nuevaContraseña) {
      setError('Por favor, introduce una nueva contraseña');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updatePassword(nuevaContraseña);

    if (result.success) {
      setSuccess('Contraseña actualizada correctamente');
      setNuevaContraseña('');
      // Cerramos el modal después de 2 segundos
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
    setNuevaContraseña('');
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <div className={`p-6 space-y-6 ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}>
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Configuración</h1>
        
        <div>
          <div className="w-full max-w-md">
            <Card title="Seguridad" icon={<LockIcon />}>
              <div className="space-y-4">
                <Button variant="primary" className="w-full" onClick={() => setIsModalOpen(true)}>
                  Cambiar Contraseña
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Cambio de Contraseña */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cambiar Contraseña</h2>
            
            <div className="mb-4">
              <label htmlFor="nuevaContraseña" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="nuevaContraseña"
                value={nuevaContraseña}
                onChange={(e) => setNuevaContraseña(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ingrese su nueva contraseña"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              {success && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">{success}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCambiarContraseña}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : 'Aceptar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
