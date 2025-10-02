/**
 * useDarkMode.ts
 * 
 * Este archivo es un "Custom Hook" (un gancho personalizado).
 * 
 * ¿Qué es un hook? Es una función especial de React que te permite "engancharte"
 * a sus características, como el estado o el ciclo de vida.
 * 
 * ¿Qué es un "Custom Hook"? Es una función que nosotros creamos (su nombre siempre
 * empieza con "use") para empaquetar una lógica que queremos reutilizar en varios
 * componentes.
 * 
 * Este hook en particular, `useDarkMode`, se encarga de toda la lógica para
 * cambiar entre el tema claro y oscuro de la aplicación.
 * 
 * Sus responsabilidades son:
 * 1.  Recordar la preferencia del usuario (claro u oscuro) guardándola en el
 *     `localStorage` del navegador.
 * 2.  Detectar la preferencia del sistema operativo del usuario.
 * 3.  Aplicar la clase 'dark' al elemento raíz del HTML para que los estilos de Tailwind CSS funcionen.
 * 4.  Proveer una función para que el usuario pueda cambiar de tema manualmente.
 */

import { useState, useEffect } from 'react';

// El hook devuelve un array con dos elementos: el tema actual y una función para cambiarlo.
export const useDarkMode = (): [string, () => void] => {
  // 1. Creamos un estado para guardar el tema.
  //    Inicialmente, intentamos leer el tema guardado en localStorage.
  //    Si no hay nada guardado, usamos 'system' como valor por defecto.
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  // 2. Esta es la función que los componentes llamarán para cambiar el tema.
  const toggleTheme = () => {
    // Si el tema actual es oscuro, lo cambiamos a claro, y viceversa.
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // 3. `useEffect` se ejecuta cada vez que el valor de `theme` cambia.
  useEffect(() => {
    const root = window.document.documentElement; // El elemento <html> del documento.
    
    // Verificamos si el sistema operativo del usuario prefiere el modo oscuro.
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Lógica para decidir si aplicar el tema oscuro:
    if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
      // Si el tema es 'dark', O si es 'system' y el sistema prefiere oscuro...
      root.classList.add('dark'); // ...añadimos la clase 'dark' al <html>.
      localStorage.setItem('theme', 'dark'); // Guardamos 'dark' para recordarlo.
    } else {
      // En cualquier otro caso, usamos el tema claro.
      root.classList.remove('dark'); // Quitamos la clase 'dark'.
      localStorage.setItem('theme', 'light'); // Guardamos 'light'.
    }
  }, [theme]); // Este efecto se vuelve a ejecutar solo si `theme` cambia.

  // 4. Devolvemos el estado actual del tema y la función para cambiarlo.
  return [theme, toggleTheme];
};