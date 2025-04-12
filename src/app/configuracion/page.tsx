'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';

export default function ConfiguracionPage() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificacionesEmail, setNotificacionesEmail] = useState(true);
  const [notificacionesSMS, setNotificacionesSMS] = useState(false);
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState('es');
  
  // Simulación de guardado
  const guardarCambios = () => {
    // Aquí iría la lógica para guardar los cambios
    alert('Configuración guardada correctamente');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">Configuración</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Apariencia" icon="🎨">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Modo oscuro</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={modoOscuro}
                    onChange={() => setModoOscuro(!modoOscuro)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Idioma</label>
                <select
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={idiomaSeleccionado}
                  onChange={(e) => setIdiomaSeleccionado(e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </Card>
          
          <Card title="Notificaciones" icon="🔔">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Notificaciones por email</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificacionesEmail}
                    onChange={() => setNotificacionesEmail(!notificacionesEmail)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Notificaciones por SMS</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificacionesSMS}
                    onChange={() => setNotificacionesSMS(!notificacionesSMS)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {notificacionesEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email para notificaciones</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ejemplo@flechaextreme.com"
                  />
                </div>
              )}
              
              {notificacionesSMS && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono para SMS</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+34 666 555 444"
                  />
                </div>
              )}
            </div>
          </Card>
          
          <Card title="Sistema" icon="⚙️">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda Predeterminada</label>
                <select
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dólar EEUU ($)</option>
                  <option value="GBP">Libra Esterlina (£)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato de Fecha</label>
                <select
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                  <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                  <option value="yyyy-mm-dd">AAAA-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zona Horaria</label>
                <select
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Europe/Madrid">Europa/Madrid (GMT+1)</option>
                  <option value="Europe/London">Europa/Londres (GMT+0)</option>
                  <option value="America/New_York">América/Nueva York (GMT-5)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card title="Empresa" icon="🏢">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="Flecha Extreme"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CIF/NIF</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="B12345678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
                <textarea
                  className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  defaultValue="Calle Ejemplo, 123
28001 Madrid, España"
                />
              </div>
            </div>
          </Card>
          
          <Card title="Seguridad" icon="🔒">
            <div className="space-y-4">
              <Button variant="primary" className="w-full">
                Cambiar Contraseña
              </Button>
              
              <Button variant="outline" className="w-full">
                Configurar Autenticación 2FA
              </Button>
            </div>
          </Card>
          
          <Card title="Acciones" icon="🛠️">
            <div className="space-y-4">
              <Button variant="primary" className="w-full" onClick={guardarCambios}>
                Guardar Cambios
              </Button>
              
              <Button variant="outline" className="w-full">
                Exportar Datos
              </Button>
              
              <Button variant="accent" className="w-full">
                Realizar Copia de Seguridad
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 