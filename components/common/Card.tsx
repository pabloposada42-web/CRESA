/**
 * Card.tsx
 * 
 * Este es otro componente "común" y reutilizable.
 * Representa una "Tarjeta", que es un contenedor con un estilo consistente
 * (fondo blanco, bordes redondeados, sombra) para agrupar y mostrar información.
 * 
 * Usar este componente en lugar de estilizar divs individuales cada vez
 * nos asegura que todas las "tarjetas" en la aplicación se vean iguales,
 * manteniendo un diseño coherente.
 */

import React from 'react';

// Definimos las propiedades (props) que puede recibir este componente.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode; // 'children' es una prop especial en React que representa cualquier cosa que se ponga DENTRO de las etiquetas del componente. ej: <Card>AQUÍ</Card>
  className?: string;        // 'className' permite añadir clases de CSS adicionales desde fuera.
}

// El `...props` permite pasar cualquier otro atributo HTML estándar (como `style`, `id`, etc.) al div principal.
const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    // Este es el div principal de la tarjeta.
    // Combinamos las clases base con cualquier clase extra que se le pase.
    // Se ha añadido una transición y efectos de hover para una mejor UX.
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${className}`} 
      {...props}
    >
      {/* El div interior con espaciado (padding) para el contenido ahora es el contenedor principal del contenido. */}
      {children}
    </div>
  );
};

export default Card;