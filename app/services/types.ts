import { z } from 'zod';

// BinPesaje schema
export const BinPesajeSchema = z.object({
  id: z.number().optional(),
  codigo: z.string().min(1, 'El código es requerido'),
  pesoBruto: z.number().positive('El peso bruto debe ser mayor a 0'),
  pesoTara: z.number().positive('El peso de tara debe ser mayor a 0'),
  pesoNeto: z.number().optional(),
  tipoContenedor: z.enum(['bin', 'chingillo'], {
    required_error: 'El tipo de contenedor es requerido',
  }),
  pesajeId: z.number().optional(),
});

// Pesaje schema
export const PesajeSchema = z.object({
  id: z.number().optional(),
  fecha: z.date({ required_error: 'La fecha es requerida' }).default(new Date()),
  tipoPez: z.string().min(1, 'El tipo de pez es requerido'),
  precioUnitario: z.number().positive('El precio unitario debe ser mayor a 0'),
  totalKilos: z.number().optional(),
  totalSinIVA: z.number().optional(),
  iva: z.number().optional(),
  totalConIVA: z.number().optional(),
  pagado: z.boolean().default(false),
  metodoPago: z.string().optional().nullable(),
  embarcacionId: z.number({ required_error: 'La embarcación es requerida' }),
  trabajadorId: z.number({ required_error: 'El trabajador es requerido' }),
  compradorId: z.number({ required_error: 'El comprador es requerido' }),
  bins: z.array(BinPesajeSchema).optional(),
});

// Tipos inferidos
export type BinPesajeData = z.infer<typeof BinPesajeSchema>;
export type PesajeData = z.infer<typeof PesajeSchema>;
