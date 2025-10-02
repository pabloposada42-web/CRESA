/**
 * DataTable.tsx
 * 
 * Este es un componente avanzado y reutilizable diseñado para el dashboard de administrador.
 * Su propósito es mostrar grandes conjuntos de datos en una tabla interactiva y fácil de usar.
 * 
 * Es "genérico" (usa `<T extends object>`), lo que significa que puede mostrar cualquier
 * tipo de datos (usuarios, aplausos, canjes, etc.) sin necesidad de cambiar su código.
 * 
 * Funcionalidades clave:
 * - Búsqueda en tiempo real: Filtra los datos de la tabla a medida que el administrador escribe.
 * - Paginación: Divide los datos en páginas para no mostrar cientos de filas a la vez.
 * - Exportación a CSV: Permite al administrador descargar los datos filtrados con un solo clic.
 */

import React, { useState, useMemo } from 'react';
import { exportToCSV } from '../../utils/csvExporter'; // La utilidad para exportar a CSV.
import Button from '../common/Button';
import { Download, Search } from 'lucide-react';

// Definimos las propiedades genéricas que necesita el componente.
interface DataTableProps<T extends object> {
  data: T[];       // El array de datos a mostrar.
  title: string;   // El título que aparecerá sobre la tabla.
  filename: string;// El nombre de archivo para la exportación CSV.
}

const DataTable = <T extends object>({ data, title, filename }: DataTableProps<T>) => {
  // Estado para el término de búsqueda introducido por el usuario.
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para la página actual que se está mostrando.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mostramos 10 elementos por página.

  // `useMemo` para filtrar los datos según la búsqueda.
  // Solo se recalcula si los `data` o el `searchTerm` cambian.
  const filteredData = useMemo(() => {
    if (!searchTerm) return data; // Si no hay búsqueda, devolvemos todos los datos.
    return data.filter(item =>
      // `Object.values` convierte un objeto en un array de sus valores.
      // `some` verifica si al menos uno de los valores del objeto incluye el término de búsqueda.
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);
  
  // `useMemo` para obtener solo la porción de datos para la página actual.
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Calculamos el número total de páginas.
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Obtenemos los encabezados de la tabla del primer elemento de datos.
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  if (data.length === 0) {
    return <div>No hay datos para mostrar.</div>;
  }

  return (
    <div>
      {/* Cabecera de la tabla con el título, buscador y botón de exportar */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="flex items-center space-x-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <Button variant="ghost" onClick={() => exportToCSV(filteredData, filename)}>
                <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
        </div>
      </div>
      {/* Tabla de datos */}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {headers.map(header => (
                <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(item as any)[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Controles de paginación */}
      <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {paginatedData.length} de {filteredData.length} resultados
          </span>
          <div className="flex space-x-1">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Anterior</Button>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Siguiente</Button>
          </div>
      </div>
    </div>
  );
};

export default DataTable;