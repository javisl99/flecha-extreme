'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useClientes } from '@/hooks/useClientes';

interface SelectorClienteProps {
  selectedClienteId: string | null;
  onClienteChange: (clienteId: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

export function SelectorCliente({
  selectedClienteId,
  onClienteChange,
  placeholder = 'Buscar por nombre, apellidos o DNI',
  className = '',
  disabled = false
}: SelectorClienteProps) {
  const { clientes, loading } = useClientes();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCliente = useMemo(
    () => clientes.find((cliente) => cliente.id === selectedClienteId) ?? null,
    [clientes, selectedClienteId]
  );

  const filteredClientes = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(searchTerm);

    if (!normalizedSearch) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const nombre = normalizeSearchValue(cliente.nombre);
      const apellidos = normalizeSearchValue(cliente.apellidos);
      const nombreCompleto = `${nombre} ${apellidos}`.trim();
      const dni = normalizeSearchValue(cliente.dni ?? '');

      return (
        nombre.includes(normalizedSearch) ||
        apellidos.includes(normalizedSearch) ||
        nombreCompleto.includes(normalizedSearch) ||
        dni.includes(normalizedSearch)
      );
    });
  }, [clientes, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    setSearchTerm(selectedCliente ? `${selectedCliente.nombre} ${selectedCliente.apellidos}` : '');
  }, [isOpen, selectedCliente]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClienteSelect = (clienteId: string | null) => {
    const cliente = clienteId ? clientes.find((item) => item.id === clienteId) ?? null : null;
    onClienteChange(clienteId);
    setSearchTerm(cliente ? `${cliente.nombre} ${cliente.apellidos}` : '');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onClienteChange(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onFocus={() => {
            if (disabled) return;
            setIsOpen(true);
          }}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm text-gray-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 ${
            disabled
              ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-400'
              : ''
          }`}
        />
        {!disabled && searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            aria-label="Limpiar selección de cliente"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {isOpen && !disabled ? (
        <div className="absolute z-[60] mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleClienteSelect(null)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
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
                No se encontraron clientes
              </div>
            ) : (
              filteredClientes.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => handleClienteSelect(cliente.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${
                    selectedClienteId === cliente.id ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="font-medium">
                    {cliente.nombre} {cliente.apellidos}
                  </div>
                  {cliente.dni ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      DNI: {cliente.dni}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
