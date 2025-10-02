/**
 * types.ts
 * 
 * Este archivo es como el "diccionario" o "molde" de nuestra aplicación.
 * Aquí definimos la estructura exacta que deben tener nuestros datos.
 * Por ejemplo, decimos que un "User" (usuario) SIEMPRE debe tener un nombre, un email, etc.
 * 
 * Esto ayuda a prevenir errores, ya que si intentamos crear un usuario sin un email,
 * TypeScript (el lenguaje que usamos) nos avisará inmediatamente.
 * Usar 'interface' es como crear un contrato para nuestros objetos.
 */

// Define la estructura de un objeto de Usuario.
export interface User {
  usuario_id: string;   // Identificador único del usuario.
  nombre: string;       // Nombre completo.
  email: string;        // Correo electrónico, usado para el login.
  estado: 'activo' | 'inactivo'; // Si la cuenta está activa o no.
  rol: 'colaborador' | 'otorgador' | 'admin'; // El tipo de permisos que tiene.
  clave_hash: string;   // Un valor que simula la contraseña para el login.
  fecha_creacion: string; // Cuándo se creó el usuario.
}

// Define la estructura de un objeto de Aplauso.
export interface Applause {
  aplauso_id: string;      // Identificador único del aplauso.
  otorgante_id: string;    // ID del usuario que DA el aplauso.
  receptor_id: string;     // ID del usuario que RECIBE el aplauso.
  principio: string;       // El valor o principio que se reconoce (ej. "Liderazgo").
  motivo: string;          // El mensaje de reconocimiento.
  fecha: string;           // Cuándo se dio el aplauso.
}

// Define la estructura de un objeto de Recompensa.
export interface Reward {
  recompensa_id: string;   // Identificador único de la recompensa.
  nombre: string;          // Nombre del premio (ej. "Día Libre Adicional").
  descripcion: string;     // Explicación de qué es la recompensa.
  nivel_requerido: string; // Nivel mínimo que el usuario debe tener para canjearla.
  imagen_url: string;      // URL de la imagen que se muestra en el marketplace.
  stock: string;           // La cantidad inicial de esta recompensa.
  puntos_costo: string;    // El costo en puntos de la recompensa.
}

// Define la estructura de un objeto de Canje (cuando un usuario reclama una recompensa).
export interface Redemption {
  canje_id: string;        // Identificador único del canje.
  usuario_id: string;      // ID del usuario que canjea.
  recompensa_id: string;   // ID de la recompensa canjeada.
  fecha: string;           // Cuándo se realizó el canje.
  // Campos adicionales opcionales para reflejar la estructura completa del Google Sheet.
  nivel_requerido?: string;
  puntos_requeridos?: string;
  puntos_previos?: string;
  puntos_restantes?: string;
  // Estados simplificados para una lógica más clara.
  estado?: 'Aprobado' | 'Pendiente' | 'Rechazado' | string;
  comprobante_pdf_url?: string;
  observaciones?: string;
}

// Define la estructura base de una Insignia (Badge).
export interface Badge {
  name: string;        // Nombre de la insignia (ej. "Maestro de la Innovación").
  principle: string;   // Principio asociado (ej. "Innovacion").
  count: number;       // El número de aplausos de ese principio que se han recibido.
  description: string; // Explicación de lo que significa la insignia.
}

// Extiende la estructura de Badge para incluir si el usuario la ha ganado o no.
export interface EarnedBadge extends Badge {
  earned: boolean;      // Verdadero si el usuario ha ganado esta insignia.
  earnedDate?: string;  // La fecha en que se ganó (opcional).
}

// Define la estructura de una Notificación.
export interface Notification {
  id: string;                  // Identificador único de la notificación.
  type: 'applause' | 'badge';  // Tipo de notificación.
  message: string;             // El texto de la notificación.
  date: string;                // Fecha de la notificación.
  read: boolean;               // Si el usuario ya la leyó o no.
  relatedId: string;           // ID del aplauso o insignia relacionada.
}