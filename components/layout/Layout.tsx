/**
 * Layout.tsx
 * 
 * Este componente actúa como la "plantilla" o "estructura" principal para todas las
 * páginas de la aplicación que requieren la cabecera y un área de contenido.
 * 
 * Su propósito es:
 * 1.  Renderizar siempre el componente `Header` en la parte superior.
 * 2.  Proveer un contenedor principal (`<main>`) donde se mostrará el contenido
 *     específico de cada página (el `children`).
 * 3.  Centralizar la lógica de "carga" y "error" de datos. Utiliza el `useData`
 *     hook para saber si los datos de la aplicación aún se están cargando.
 *     - Si `loading` es true, muestra el componente `Spinner`.
 *     - Si hay un `error`, muestra un mensaje de error.
 *     - Si los datos ya se cargaron sin errores, muestra el contenido de la página.
 */

import React from 'react';
import Header from './Header';
import { useData } from '../../context/DataContext';
import Spinner from '../common/Spinner';

// Define las propiedades que acepta el componente.
interface LayoutProps {
  children: React.ReactNode; // `children` será el contenido de la página actual (ej. el Dashboard, Marketplace, etc.).
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Obtenemos los estados de carga y error desde nuestro contexto de datos global.
  const { loading, error } = useData();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* 1. La cabecera siempre se muestra. */}
      <Header />
      {/* 2. El área de contenido principal. */}
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* 3. Lógica condicional para mostrar el contenido. */}
        {loading ? (
          // Si está cargando, mostramos el spinner.
          <div className="flex justify-center items-center h-96">
            <Spinner />
          </div>
        ) : error ? (
          // Si hubo un error, mostramos un mensaje de error.
          <div className="text-center text-red-500">
            <h2>Error al cargar los datos</h2>
            <p>{error.message}</p>
          </div>
        ) : (
          // Si todo está bien, mostramos el contenido de la página con una animación de entrada.
          <div className="animate-fade-in">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;