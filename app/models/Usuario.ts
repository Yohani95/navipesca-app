/**
 * Representa un usuario autenticado en el sistema.
 * Debe coincidir con la estructura de usuario en el backend Next.js
 */
export interface Usuario {
  id: string;
  nombre: string;
  email: string | null;
  token: string;
  personaId: string; // Usando el mismo ID como personaId
  rolId: number;
  image?: string | null;
}
