/**
 * Button.tsx
 * 
 * Este es un componente de botón reutilizable.
 * En lugar de crear y estilizar botones `<button>` por toda la aplicación, usamos
 * este componente centralizado. Esto nos da varias ventajas:
 * 
 * 1.  Consistencia: Todos los botones se ven y se comportan de la misma manera.
 * 2.  Mantenibilidad: Si queremos cambiar el estilo de todos los botones
 *     principales, solo tenemos que modificarlo en este archivo.
 * 3.  Flexibilidad: Acepta "variantes" (primary, secondary, ghost) para
 *     diferentes estilos visuales según el contexto.
 */

import React from 'react';

// Definimos las propiedades (props) que nuestro componente Button puede aceptar.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // El texto o ícono que va dentro del botón.
  variant?: 'primary' | 'secondary' | 'ghost'; // La variante de estilo. Si no se especifica, es 'primary'.
  className?: string; // Para añadir clases de CSS personalizadas.
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  // Clases de CSS base que se aplican a TODOS los botones, sin importar la variante.
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  // Un objeto que mapea cada variante a sus clases de CSS específicas.
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-400',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-primary-500',
  };

  return (
    // Construimos el string final de clases combinando las clases base, las de la variante seleccionada,
    // y cualquier clase extra que se haya pasado a través de `className`.
    // El `...props` pasa al botón real cualquier otra propiedad (como `onClick`, `disabled`, `type`).
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;