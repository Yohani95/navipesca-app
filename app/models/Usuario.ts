import { z } from 'zod';
import { Rol, RolSchema } from './Rol';

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
  rol?: Rol | null; // Rol puede ser nulo si no se asigna
  image?: string | null;
}
export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().nullable(),
  token: z.string(),
  personaId: z.string(),
  rolId: z.number(),
  rol: RolSchema.optional(),
  image: z.string().nullable().optional(),
});
