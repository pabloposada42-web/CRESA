/**
 * Header.tsx
 * 
 * Este componente representa la barra de navegación superior (la cabecera) de la aplicación.
 * Es una parte fundamental del "Layout" (diseño/estructura) de la página.
 * 
 * Responsabilidades:
 * - Mostrar el logo o nombre de la aplicación.
 * - Mostrar los enlaces de navegación principales (ej. Dashboard, Marketplace).
 * - La navegación cambia dependiendo si el usuario es un administrador o un usuario normal.
 * - Incluir controles interactivos como el botón para cambiar el tema (modo oscuro/claro).
 * - Mostrar un menú de usuario con su nombre, email y la opción de cerrar sesión.
 * - Implementar un sistema de notificaciones funcional.
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom'; // Componentes para la navegación.
import { useAuth } from '../../context/AuthContext'; // Hook para obtener datos del usuario logueado.
import { useData } from '../../context/DataContext'; // Hook para refrescar datos.
import { useToast } from '../../context/ToastContext'; // Hook para mostrar notificaciones.
import { useDarkMode } from '../../hooks/useDarkMode'; // Hook para gestionar el modo oscuro.
import { Sun, Moon, Bell, LogOut, Award, BarChart2, ShoppingCart, CheckCheck, RefreshCw } from 'lucide-react'; // Iconos.

const Header: React.FC = () => {
  const { user, logout, notifications, unreadCount, markNotificationsAsRead } = useAuth();
  const { isRefreshing, refreshData } = useData();
  const { addToast } = useToast();
  const [theme, toggleTheme] = useDarkMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Hook para cerrar los menús si se hace clic fuera de ellos.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen && unreadCount > 0) {
      // Marcar como leídas cuando se abre el panel
      setTimeout(() => markNotificationsAsRead(), 500);
    }
  };

  const handleRefresh = async () => {
    try {
        await refreshData();
        addToast('Datos actualizados correctamente.', 'success');
    } catch (error) {
        addToast('Error al actualizar los datos.', 'error');
    }
  }

  const navItems = user?.rol === 'admin' ? [
    { name: 'Dashboard Admin', href: '/', icon: BarChart2 }
  ] : [
    { name: 'Mi Dashboard', href: '/', icon: BarChart2 },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
    { name: 'Mis Resultados', href: '/my-results', icon: Award }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">Milla Extra</span>
            </Link>
            <nav className="hidden md:ml-10 md:block md:space-x-8">
              {navItems.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-primary-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Actualizar datos"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Panel de Notificaciones */}
            <div className="ml-2 relative" ref={notificationsRef}>
              <button onClick={handleNotificationsToggle} className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"></span>
                )}
              </button>
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="p-2 border-b dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Notificaciones</h3>
                    <button onClick={markNotificationsAsRead} className="text-xs text-primary-600 hover:underline">Marcar todas como leídas</button>
                  </div>
                  <ul className="py-1 max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                      <li key={n.id} className={`px-4 py-3 border-b dark:border-gray-700/50 ${!n.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 pt-1">
                            {n.type === 'applause' ? <Award className="h-5 w-5 text-secondary-500" /> : <CheckCheck className="h-5 w-5 text-primary-500" />}
                          </div>
                          <div>
                            <p className="text-sm">{n.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(n.date).toLocaleString()}</p>
                          </div>
                        </div>
                      </li>
                    )) : (
                      <li className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">No hay notificaciones nuevas.</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="ml-3 relative" ref={menuRef}>
              <div>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="h-8 w-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                    {user?.nombre.charAt(0).toUpperCase()}
                  </div>
                </button>
              </div>
              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">
                    <p className="font-semibold truncate">{user?.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;