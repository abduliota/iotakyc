import { z } from 'zod'

export const Step1Schema = z.object({
  iqama: z
    .string()
    .min(10, 'Iqama must be 10 digits')
    .max(10, 'Iqama must be 10 digits')
    .regex(/^\d{10}$/, 'Iqama must contain only numbers'),
})

export type Step1Input = z.infer<typeof Step1Schema>
