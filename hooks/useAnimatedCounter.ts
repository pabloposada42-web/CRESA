/**
 * useAnimatedCounter.ts
 * 
 * Un "custom hook" que anima un número desde 0 hasta un valor final
 * durante un período de tiempo específico.
 * 
 * Esto crea un efecto visualmente atractivo para mostrar estadísticas y números
 * en los dashboards.
 */
import { useState, useEffect, useRef } from 'react';

export const useAnimatedCounter = (endValue: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = timestamp;
      }
      
      const elapsedTime = timestamp - startTimeRef.current!;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const currentCount = Math.floor(progress * endValue);
      setCount(currentCount);

      if (elapsedTime < duration) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Asegurarse de que el valor final sea exacto.
      }
    };
    
    // Iniciar la animación
    startTimeRef.current = undefined;
    frameRef.current = requestAnimationFrame(animate);
    
    // Limpieza al desmontar el componente
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration]);

  return count;
};