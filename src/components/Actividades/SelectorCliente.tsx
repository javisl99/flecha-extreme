'use client';

import { useState, useEffect, useRef } from 'react';
import { useClientes } from '@/hooks/useClientes';

interface SelectorClienteProps {
  selectedClienteId: string | null;
  onClienteChange: (clienteId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectorCliente({ 
  selectedClienteId, 
  onClienteChange, 
  placeholder = "Seleccionar cliente",
  className = "",
  disabled = false 
}: SelectorClienteProps) {
  const { clientes, loading, crearCliente } = useClientes();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCliente, setNewCliente] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    movil: '',
    dni: ''
  });
  const [creatingCliente, setCreatingCliente] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Obtener el cliente seleccionado
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newCliente.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!newCliente.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son obligatorios';
    }

    if (!newCliente.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCliente.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!newCliente.movil.trim()) {
      newErrors.movil = 'El móvil es obligatorio';
    } else if (!/^[0-9]{9}$/.test(newCliente.movil.replace(/\s/g, ''))) {
      newErrors.movil = 'El móvil debe tener 9 dígitos';
    }

    if (newCliente.dni.trim() && !/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(newCliente.dni)) {
      newErrors.dni = 'El DNI no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para crear nuevo cliente
  const handleCreateCliente = async () => {
    if (!validateForm()) {
      return;
    }

    setCreatingCliente(true);
    try {
      const nuevoCliente = await crearCliente({
        nombre: newCliente.nombre.trim(),
        apellidos: newCliente.apellidos.trim(),
        email: newCliente.email.trim(),
        movil: newCliente.movil.trim(),
        dni: newCliente.dni.trim().toUpperCase(),
        fechaRegistro: new Date().toISOString()
      });

      // Seleccionar automáticamente el nuevo cliente
      onClienteChange(nuevoCliente.data?.id);
      
      // Limpiar formulario
      setNewCliente({
        nombre: '',
        apellidos: '',
        email: '',
        movil: '',
        dni: ''
      });
      setErrors({});
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creando cliente:', error);
      setErrors({ general: 'Error al crear el cliente' });
    } finally {
      setCreatingCliente(false);
    }
  };

  // Función para manejar cambios en los inputs
  const handleInputChange = (field: string, value: string) => {
    setNewCliente(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Función para manejar la selección de cliente
  const handleClienteSelect = (clienteId: string | null) => {
    onClienteChange(clienteId);
    setIsOpen(false);
  };

  // Función para limpiar selección
  const handleClearSelection = () => {
    onClienteChange(null);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selector principal */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
            disabled 
              ? 'bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
          }`}
        >
          <span className={selectedClienteId !== null ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {selectedCliente 
              ? `${selectedCliente.nombre} ${selectedCliente.apellidos}`
              : selectedClienteId === null 
                ? 'Sin cliente'
                : placeholder
            }
          </span>
           <span className="text-gray-400">▼</span>
        </button>

        {/* Botón para limpiar selección */}
        {selectedClienteId !== null && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
          >
             <span className="text-gray-400 text-xs">×</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className={`absolute z-[60] w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg overflow-y-auto ${
          showCreateForm ? 'max-h-96' : 'max-h-48'
        }`}>
          {/* Lista de clientes */}
          <div className="py-1">
            {/* Opción "Sin cliente" */}
            <button
              type="button"
              onClick={() => handleClienteSelect(null)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                selectedClienteId === null ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              Sin cliente
            </button>

            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Cargando clientes...
              </div>
            ) : clientes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No hay clientes disponibles
              </div>
            ) : (
              clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleClienteSelect(cliente.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedClienteId === cliente.id ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {cliente.nombre} {cliente.apellidos}
                </button>
              ))
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 dark:border-gray-600"></div>

          {/* Botón para crear nuevo cliente */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-md border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer"
            >
               <span className="text-sm">+</span>
               Crear nuevo cliente
            </button>
          </div>

          {/* Formulario para crear nuevo cliente */}
          {showCreateForm && (
            <div className="p-3 bg-primary/5 border-t border-primary/20">
              <div className="space-y-3">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newCliente.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Nombre del cliente"
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.nombre 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nombre}</p>
                  )}
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={newCliente.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    placeholder="Apellidos del cliente"
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.apellidos 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.apellidos && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.apellidos}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newCliente.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@ejemplo.com"
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Móvil */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Móvil *
                  </label>
                  <input
                    type="tel"
                    value={newCliente.movil}
                    onChange={(e) => handleInputChange('movil', e.target.value)}
                    placeholder="123456789"
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.movil 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.movil && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.movil}</p>
                  )}
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    DNI/NIF
                  </label>
                  <input
                    type="text"
                    value={newCliente.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value.toUpperCase())}
                    placeholder="12345678A"
                    className={`w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.dni 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {errors.dni && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.dni}</p>
                  )}
                </div>

                {/* Error general */}
                {errors.general && (
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.general}</p>
                )}

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateCliente}
                    disabled={creatingCliente}
                    className="flex-1 px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {creatingCliente ? 'Creando...' : 'Crear cliente'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCliente({
                        nombre: '',
                        apellidos: '',
                        email: '',
                        movil: '',
                        dni: ''
                      });
                      setErrors({});
                    }}
                    disabled={creatingCliente}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
