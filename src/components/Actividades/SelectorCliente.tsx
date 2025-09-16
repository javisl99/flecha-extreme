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
  const [searchTerm, setSearchTerm] = useState('');
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

  // Filtrar clientes basándose en el término de búsqueda
  const filteredClientes = clientes.filter(cliente => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const nombreCompleto = `${cliente.nombre} ${cliente.apellidos}`.toLowerCase();
    const email = cliente.email?.toLowerCase() || '';
    const movil = cliente.movil?.toString() || '';
    const dni = cliente.dni?.toLowerCase() || '';
    
    return nombreCompleto.includes(searchLower) || 
           email.includes(searchLower) || 
           movil.includes(searchTerm) || 
           dni.includes(searchLower);
  });

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setSearchTerm(''); // Limpiar búsqueda al cerrar
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

    // Validar nombre
    if (!newCliente.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    // Validar apellidos
    if (!newCliente.apellidos.trim()) {
      newErrors.apellidos = 'Los apellidos son obligatorios';
    }

    // Validar email
    if (!newCliente.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCliente.email.trim())) {
      newErrors.email = 'El email no es válido';
    }

    // Validar móvil (exactamente 9 dígitos)
    if (!newCliente.movil.trim()) {
      newErrors.movil = 'El móvil es obligatorio';
    } else {
      const movilLimpio = newCliente.movil.replace(/\s/g, '');
      if (!/^[0-9]{9}$/.test(movilLimpio)) {
        newErrors.movil = 'El móvil debe tener exactamente 9 dígitos';
      }
    }

    // Validar DNI (8 números + 1 letra)
    if (newCliente.dni.trim()) {
      const dniLimpio = newCliente.dni.trim().toUpperCase();
      if (!/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(dniLimpio)) {
        newErrors.dni = 'El DNI debe tener 8 números seguidos de una letra válida';
      }
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
    let processedValue = value;
    
    // Aplicar restricciones según el campo
    switch (field) {
      case 'movil':
        // Solo permitir números y espacios, máximo 9 dígitos
        processedValue = value.replace(/[^0-9\s]/g, '').slice(0, 9);
        break;
      case 'dni':
        // Solo permitir números y letras, máximo 9 caracteres
        processedValue = value.replace(/[^0-9A-Za-z]/g, '').slice(0, 9).toUpperCase();
        break;
      case 'email':
        // Convertir a minúsculas para email
        processedValue = value.toLowerCase();
        break;
      default:
        processedValue = value;
    }
    
    setNewCliente(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Función para manejar la selección de cliente
  const handleClienteSelect = (clienteId: string | null) => {
    onClienteChange(clienteId);
    setIsOpen(false);
    setSearchTerm(''); // Limpiar búsqueda al seleccionar
  };

  // Función para limpiar selección
  const handleClearSelection = () => {
    onClienteChange(null);
    setIsOpen(false);
    setSearchTerm(''); // Limpiar búsqueda al limpiar selección
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
          showCreateForm ? 'max-h-[32rem]' : 'max-h-80'
        }`}>
          {/* Campo de búsqueda */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center"
                >
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Botón para crear nuevo cliente */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
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
            <div className="p-3 bg-primary/5 border-b border-primary/20">
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
                    placeholder="ejemplo@correo.com"
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
                    maxLength={9}
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
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    placeholder="12345678A"
                    maxLength={9}
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
            ) : filteredClientes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
              </div>
            ) : (
              filteredClientes.map((cliente) => (
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
        </div>
      )}
    </div>
  );
}
