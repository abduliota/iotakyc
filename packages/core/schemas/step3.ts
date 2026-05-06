import { z } from 'zod'

// Step 3 — National Address (auto-fetched from SPOST API, customer confirms)
export const Step3Schema = z.object({
  national_address_registered: z.boolean(),
  building_number: z.string().min(1, 'Building number is required'),
  street: z.string().min(1, 'Street is required'),
  district: z.string().min(1, 'District is required'),
  city: z.string().min(1, 'City is required'),
  postal_code: z.string().min(5, 'Postal code is required'),
  additional_number: z.string().optional(),
  unit_number: z.string().optional(),
  po_box: z.string().optional(),
})

export type Step3Input = z.infer<typeof Step3Schema>
