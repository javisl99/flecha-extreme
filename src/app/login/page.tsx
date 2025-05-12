'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/shared/components';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login, user, loading: authLoading } = useUserContext();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, introduce tu correo y contraseña');
      return;
    }
    
    setError('');
    
    try {
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
        return;
      }
      
      // La redirección se maneja en el useEffect
    } catch (err) {
      setError('Error al iniciar sesión. Verifica tus credenciales.');
      console.error(err);
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
            disabled={authLoading}
          >
            {authLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión
              </span>
            ) : 'Iniciar Sesión'}
          </Button>
        </form>
        
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
