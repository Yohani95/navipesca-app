import { z } from 'zod';
export interface Cliente {
  id?: string; // ID generado automáticamente con uuid
  nombre: string; // Nombre del cliente
  esquema: string; // Esquema de la base de datos del cliente
  // Users?: User[]; // Relación con usuarios (opcional)
}
export const ClienteSchema = z.object({
  id: z.string().optional(), // ID generado automáticamente con uuid
  nombre: z.string().optional(),
  esquema: z.string().optional(),

  //   Users: z.array(UserSchema).optional(), // Relación con usuarios
});
