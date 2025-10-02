/**
 * Spinner.tsx
 * 
 * Este es un componente de "interfaz de usuario" (UI) muy simple.
 * Su única responsabilidad es mostrar una animación de carga (un círculo que gira).
 * 
 * Se utiliza en lugares de la aplicación donde los datos están siendo cargados,
 * para darle al usuario una retroalimentación visual de que algo está sucediendo.
 * Es un componente "común" porque se puede reutilizar en muchas partes diferentes de la app.
 */
import React from 'react';

const Spinner: React.FC = () => {
  return (
    // Contenedor flexible para centrar el spinner.
    <div className="flex justify-center items-center h-full w-full">
      {/* El div que crea la animación de giro. Se ha mejorado visualmente con un gradiente. */}
      <div 
        className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary-500 border-r-primary-500 border-b-primary-200 border-l-primary-200"
        style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }}
      ></div>
    </div>
  );
};

export default Spinner;