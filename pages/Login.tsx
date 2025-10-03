/**
 * Login.tsx
 * 
 * Este componente representa la página de inicio de sesión.
 * Es la primera pantalla que ven los usuarios que no han iniciado sesión.
 * 
 * Responsabilidades:
 * - Mostrar un formulario con campos para el correo electrónico y la contraseña.
 * - Capturar lo que el usuario escribe en esos campos.
 * - Al enviar el formulario, llamar a la función `login` del contexto de autenticación.
 * - Mostrar mensajes de error si el inicio de sesión falla.
 * - Redirigir al usuario a la página principal si el inicio de sesión es exitoso.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook para redirigir al usuario a otras páginas.
import { useAuth } from '../context/AuthContext'; // Hook para acceder a la función de login.
import Button from '../components/common/Button';
import { Mail, Lock, Award } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Columna Izquierda - Branding */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-center items-center text-white text-center">
            <Award size={80} className="text-yellow-300 animate-fade-in" />
            <h1 className="text-4xl font-bold mt-6 animate-slide-up" style={{animationDelay: '100ms'}}>Plataforma Milla Extra</h1>
            <p className="mt-4 text-primary-200 animate-slide-up" style={{animationDelay: '200ms'}}>
                Donde el reconocimiento impulsa la grandeza.
            </p>
        </div>

        {/* Columna Derecha - Formulario de Login */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido de Vuelta</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Inicia sesión para reconocer y ser reconocido.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="password" className="sr-only">Contraseña</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            
            {error && <p className="text-sm text-red-500 text-center animate-fade-in">{error}</p>}
            
            <div>
              <Button type="submit" className="w-full justify-center py-3" disabled={loading}>
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;