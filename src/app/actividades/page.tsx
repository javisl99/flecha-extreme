'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import { actividadesMock } from '@/components/Actividades/data';
import { Actividad } from '@/shared/types';

export default function ActividadesPage() {
  const [selectedTab, setSelectedTab] = useState<'list' | 'grid'>('grid');
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  const [filterText, setFilterText] = useState('');
  
  const filteredActividades = actividadesMock.filter(
    actividad => 
      actividad.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
      actividad.categoria.toLowerCase().includes(filterText.toLowerCase()) ||
      actividad.descripcion.toLowerCase().includes(filterText.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Actividades</h1>
        <Button variant="primary" icon="➕">
          Nueva Actividad
        </Button>
      </div>
      
      <Card>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <input
              type="text"
              placeholder="Buscar actividades..."
              className="w-full px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant={selectedTab === 'grid' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('grid')}
            >
              Cuadrícula
            </Button>
            <Button 
              variant={selectedTab === 'list' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('list')}
            >
              Lista
            </Button>
          </div>
        </div>
        
        {filteredActividades.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron actividades
          </div>
        ) : selectedTab === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActividades.map((actividad) => (
              <div 
                key={actividad.id}
                className="border border-card-border dark:border-card-border bg-card-bg dark:bg-card-bg rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedActividad(actividad)}
              >
                <div className="aspect-video bg-gradient-to-r from-blue-500 to-cyan-500 relative">
                  {actividad.imagen && (
                    <img 
                      src={actividad.imagen} 
                      alt={actividad.nombre} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="text-white text-sm font-medium">
                      {actividad.categoria}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{actividad.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{actividad.descripcion}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-primary-dark dark:text-primary-light font-medium">
                      {actividad.precio} €
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {actividad.duracion} min
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duración</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Capacidad</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Precio</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
                {filteredActividades.map((actividad) => (
                  <tr 
                    key={actividad.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => setSelectedActividad(actividad)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{actividad.nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{actividad.categoria}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{actividad.duracion} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{actividad.capacidad} personas</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{actividad.precio} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        actividad.activo 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                      }`}>
                        {actividad.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary-dark dark:text-primary-light hover:text-primary ml-4">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Modal de detalles de actividad */}
      {selectedActividad && (
        <div className="fixed inset-0 bg-modal-overlay flex items-center justify-center p-4 z-50">
          <div className="bg-card-bg dark:bg-card-bg border border-card-border dark:border-card-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="aspect-video bg-gradient-to-r from-blue-500 to-cyan-500 relative">
              {selectedActividad.imagen && (
                <img 
                  src={selectedActividad.imagen} 
                  alt={selectedActividad.nombre} 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="inline-block px-2 py-1 text-xs font-medium bg-primary-light/20 dark:bg-primary-dark/20 text-primary-dark dark:text-primary-light rounded mb-2">
                    {selectedActividad.categoria}
                  </div>
                  <h2 className="text-xl font-bold text-primary-dark dark:text-primary-light">{selectedActividad.nombre}</h2>
                </div>
                <button 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setSelectedActividad(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Duración</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedActividad.duracion} minutos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Capacidad</label>
                  <p className="text-gray-900 dark:text-gray-100">{selectedActividad.capacidad} personas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Precio</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedActividad.precio} €</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Estado</label>
                  <span className={`inline-block mt-1 text-sm px-2 py-1 rounded-full ${
                    selectedActividad.activo 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                  }`}>
                    {selectedActividad.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedActividad.descripcion}</p>
              </div>
              
              {selectedActividad.requisitos && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Requisitos</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedActividad.requisitos}</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 flex flex-wrap gap-2">
                <Button variant="primary" className="flex-1">
                  Editar Actividad
                </Button>
                <Button variant="accent" className="flex-1">
                  Crear Reserva
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setSelectedActividad(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 