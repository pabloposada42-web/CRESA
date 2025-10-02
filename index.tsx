/**
 * index.tsx
 * 
 * ¡Este es el punto de partida de toda la aplicación!
 * Es como el "motor de arranque" de un coche. Su única misión es
 * encontrar el lugar en el HTML donde debe vivir nuestra app y decirle a React:
 * "¡Oye, empieza a dibujar la aplicación aquí!".
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importamos el componente principal de nuestra aplicación.

// 1. Buscamos en el archivo index.html un elemento con el id 'root'.
//    Este es el contenedor principal donde se renderizará toda la aplicación.
const rootElement = document.getElementById('root');

// 2. Si por alguna razón no encontramos ese elemento, lanzamos un error
//    porque la aplicación no tendría dónde mostrarse.
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 3. Usamos la nueva forma de React para crear la "raíz" de la aplicación en el elemento que encontramos.
const root = ReactDOM.createRoot(rootElement);

// 4. Finalmente, le decimos a React que renderice (dibuje) nuestro componente principal <App />
//    dentro de esa raíz. El <React.StrictMode> es una herramienta de ayuda que detecta
//    posibles problemas en el código durante el desarrollo.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);