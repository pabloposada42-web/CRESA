/**
 * csvExporter.ts
 * 
 * Esta es una utilidad muy práctica que permite al usuario descargar datos de la aplicación
 * en un archivo CSV (Valores Separados por Comas). Este formato es compatible con
 * programas como Excel o Google Sheets, lo que facilita el análisis de datos fuera de la app.
 * 
 * La función principal toma una lista de datos y un nombre de archivo, y mágicamente
 * genera un archivo CSV que el navegador del usuario descarga.
 */

/**
 * Exporta un array de objetos a un archivo CSV.
 * @param data El array de datos que se va a exportar. Cada objeto del array es una fila.
 * @param filename El nombre que tendrá el archivo descargado (sin la extensión .csv).
 */
export const exportToCSV = <T extends object>(data: T[], filename: string) => {
  // Si no hay datos, no hacemos nada.
  if (data.length === 0) {
    return;
  }

  // 1. Obtenemos los encabezados (nombres de las columnas) a partir de las claves del primer objeto.
  const headers = Object.keys(data[0]);
  // La primera línea de nuestro archivo CSV serán los encabezados, unidos por comas.
  const csvRows = [headers.join(',')];

  // 2. Recorremos cada objeto (fila) en nuestros datos.
  data.forEach(row => {
    // Para cada fila, creamos un array de sus valores en el mismo orden que los encabezados.
    const values = headers.map(header => {
      const value = (row as any)[header];
      const stringValue = value === null || value === undefined ? '' : String(value);
      
      // Caso especial: si un valor contiene una coma, debemos encerrarlo entre comillas dobles
      // para que no se interprete como una nueva columna.
      if (stringValue.includes(',')) {
        return `"${stringValue.replace(/"/g, '""')}"`; // Escapamos también las comillas internas.
      }
      return stringValue;
    });
    // Unimos los valores de la fila con comas y lo añadimos a nuestras filas de CSV.
    csvRows.push(values.join(','));
  });

  // 3. Unimos todas las filas (encabezado + filas de datos) con saltos de línea.
  const csvString = csvRows.join('\n');

  // 4. Usamos la magia del navegador para crear y descargar el archivo.
  // Creamos un "Blob", que es como un objeto de archivo en memoria.
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  // Creamos un elemento de enlace <a> invisible.
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob); // Creamos una URL temporal para nuestro archivo en memoria.
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`); // Le decimos al navegador el nombre del archivo.
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click(); // Simulamos un clic en el enlace, lo que inicia la descarga.
    document.body.removeChild(link); // Limpiamos el enlace invisible.
  }
};