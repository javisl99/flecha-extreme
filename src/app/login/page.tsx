'use client';

import { useState } from 'react';
import { Card, Button } from '@/shared/components';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Credenciales de prueba
const TEST_EMAIL = 'admin@flechaextreme.com';
const TEST_PASSWORD = 'admin123';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, introduce tu correo y contraseña');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Simulación de verificación de credenciales
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar las credenciales
      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        // Redirección al dashboard tras login exitoso
        router.push('/dashboard');
      } else {
        setError('Credenciales incorrectas. Usa las credenciales de prueba mostradas abajo.');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="mb-8">
        <Image
          src="/cropped-lgo.png"
          alt="Flecha Extreme Logo"
          width={200}
          height={65}
          priority
        />
      </div>
      
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary-dark dark:text-primary-light">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Accede a tu cuenta de Flecha Extreme
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ejemplo@flechaextreme.com"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <Link href="/recuperar-password" className="text-xs text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Contraseña"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Recordarme
            </label>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
        
        {/* Credenciales de prueba */}
        <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Credenciales de prueba</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <span className="font-medium">Email:</span> {TEST_EMAIL}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            <span className="font-medium">Contraseña:</span> {TEST_PASSWORD}
          </p>
        </div>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">¿No tienes una cuenta?</span>{' '}
          <Link href="/registro" className="text-primary hover:underline font-medium">
            Regístrate aquí
          </Link>
        </div>
      </Card>
      
      <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Flecha Extreme. Todos los derechos reservados.
      </p>
    </div>
  );
}
