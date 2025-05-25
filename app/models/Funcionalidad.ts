// filepath: c:\Users\KPaz\Desktop\proyectos\navipesca-app\app\models\Funcionalidad.ts
import { z } from 'zod';
export interface Funcionalidad {
  id?: number;
  nombre: string;
  descripcion?: string;
  // roles?: Rol[]; // Si necesitas la relación inversa a Roles, puedes incluirla aquí
}
export const FuncionalidadSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'El nombre de la funcionalidad es requerido.'),
  descripcion: z.string().optional(),
  // Considera si necesitas la relación inversa a Roles aquí para la app móvil.
  // Si solo necesitas la lista de funcionalidades para un rol, esta parte podría omitirse
  // en el esquema de Funcionalidad y manejarse solo en RolSchema.
  // roles: z.array(z.lazy(() => RolSchema)).optional(), // Ejemplo si necesitaras referencia circular
});

export type FuncionalidadData = z.infer<typeof FuncionalidadSchema>;
