'use client';

import { useState, useEffect } from 'react';
import { Card, Button } from '@/shared/components';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/context/UserContext';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col justify-center items-center p-4">
      <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
        <Image
          src="/cropped-lgo.png"
          alt="Flecha Extreme Logo"
          width={220}
          height={72}
          priority
          className="drop-shadow-lg"
        />
      </div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-dark to-primary-light bg-clip-text text-transparent dark:from-primary-light dark:to-primary-dark p-2 rounded-lg">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 p-2 rounded-lg inline-block">
            Accede a tu cuenta de Flecha Extreme
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100/80 dark:bg-red-900/80 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-input-border dark:border-input-border bg-white/50 dark:bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="ejemplo@flechaextreme.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-input-border dark:border-input-border bg-white/50 dark:bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              placeholder="Contraseña"
              required
            />
          </div>
          
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 rounded-lg font-semibold text-base hover:shadow-lg transition-all duration-200"
            disabled={authLoading}
          >
            {authLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión
              </span>
            ) : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">o</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <Link
          className="flex w-full items-center justify-center rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-base font-semibold text-primary-dark transition hover:border-primary/45 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          href="/demo"
        >
          Probar demo con datos ficticios
        </Link>
        <p className="mt-3 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
          Acceso directo y aislado. Los cambios no se guardan ni llegan a la base real.
        </p>
      </Card>
      
      <p className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Flecha Extreme. Todos los derechos reservados.
      </p>
    </div>
  );
}
