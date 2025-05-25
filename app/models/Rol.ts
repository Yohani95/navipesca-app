// filepath: c:\Users\KPaz\Desktop\proyectos\navipesca-app\app\models\Rol.ts
import { z } from 'zod';
import { Funcionalidad, FuncionalidadSchema } from './Funcionalidad';
// Asegúrate que la ruta sea correcta

export interface Rol {
  id?: number;
  nombre: string;
  funcionalidades?: Funcionalidad[]; // Lista de funcionalidades asociadas al rol
}
export const RolSchema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, 'El nombre del rol es requerido'),
  funcionalidades: z.array(FuncionalidadSchema).optional(), // Para la lista de funcionalidades asociadas
  // Si en la app móvil solo necesitas los IDs para alguna operación específica,
  // podrías mantener funcionalidadIds, pero usualmente se trabaja con los objetos completos.
  // funcionalidadIds: z.array(z.number()).optional(),
});

export type RolData = z.infer<typeof RolSchema>;
