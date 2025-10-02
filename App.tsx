/**
 * App.tsx
 * 
 * Este es el componente "corazón" de la aplicación. Su función principal es organizar
 * la estructura general, como un director de orquesta.
 * 
 * Aquí se definen tres cosas clave:
 * 1.  Los "Proveedores de Contexto" (DataProvider y AuthProvider): Imagínalos como
 *     "contenedores globales" de información.
 *     - DataProvider: Carga y guarda todos los datos de la app (usuarios, aplausos, etc.).
 *     - AuthProvider: Gestiona todo lo relacionado con el inicio de sesión del usuario.
 * 2.  El sistema de "Rutas" (Routing): Decide qué página o componente mostrar
 *     basándose en la URL que el usuario visita (ej. /login, /marketplace).
 * 3.  Las "Rutas Protegidas" (PrivateRoute y AdminRoute): Son como "guardianes" que
 *     verifican si un usuario ha iniciado sesión (o si es admin) antes de dejarle
 *     ver una página.
 */

import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext'; // Importamos el nuevo proveedor de Toasts.
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Marketplace from './pages/Marketplace';
import MyResults from './pages/MyResults';
import Layout from './components/layout/Layout';

/**
 * Un componente "guardián" que protege las páginas.
 * Si el usuario no ha iniciado sesión, lo redirige a la página de login.
 * Si ha iniciado sesión, le muestra el contenido de la página.
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext); // Accedemos al contexto de autenticación.
  if (!auth) return null; // Si el contexto aún no está listo, no mostramos nada.
  return auth.user ? <>{children}</> : <Navigate to="/login" />;
};

/**
 * Un componente "guardián" más estricto, solo para administradores.
 * Si el usuario no es un administrador, lo redirige a la página principal.
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  if (!auth) return null;
  return auth.user && auth.user.rol === 'admin' ? <>{children}</> : <Navigate to="/" />;
};

/**
 * El componente principal que envuelve toda la aplicación con los proveedores de datos.
 * El orden es importante: DataProvider debe envolver a AuthProvider porque AuthProvider
 * necesita los datos de los usuarios para poder hacer el login.
 * ToastProvider envuelve a todos para que cualquier componente pueda mostrar notificaciones.
 */
const App: React.FC = () => {
  return (
    <DataProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </DataProvider>
  );
};

/**
 * Este componente define la lógica de navegación y las páginas de la aplicación.
 * Se separa de App para poder acceder al contexto de autenticación (useAuth).
 */
const MainApp: React.FC = () => {
    const auth = useContext(AuthContext); // Obtenemos la información del usuario logueado.

    return (
        // HashRouter se usa para la navegación, funciona bien en entornos donde no controlamos el servidor.
        <HashRouter>
          {/* El componente Routes actúa como un contenedor para todas las rutas individuales. */}
          <Routes>
            {/* Ruta para la página de inicio de sesión. */}
            <Route path="/login" element={<Login />} />
            
            {/* Definimos un grupo de rutas que estarán protegidas. */}
            <Route
              path="/*" // Esta ruta "comodín" atrapa cualquier otra URL.
              element={
                <PrivateRoute>
                  {/* Todas las páginas privadas usarán el Layout (cabecera y estructura). */}
                  <Layout>
                    <Routes>
                      {/* Lógica condicional: ¿Qué mostramos en la página de inicio? */}
                      {auth?.user?.rol === 'admin' ? (
                        // Si el usuario es 'admin', su página de inicio es el AdminDashboard.
                        <>
                           <Route path="/" element={<AdminDashboard />} />
                           <Route path="/admin" element={<AdminDashboard />} />
                        </>
                      ) : (
                        // Si es un usuario normal, tiene acceso a estas otras páginas.
                        <>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/marketplace" element={<Marketplace />} />
                          <Route path="/my-results" element={<MyResults />} />
                        </>
                      )}
                      {/* Si el usuario intenta ir a una URL que no existe, lo redirigimos a la página principal. */}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </HashRouter>
    );
}

export default App;