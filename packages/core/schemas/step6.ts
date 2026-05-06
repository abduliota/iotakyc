import { z } from 'zod'

// Step 6 — Contact Information
export const Step6Schema = z.object({
  mobile_number: z
    .string()
    .regex(/^(\+966|05)\d{8}$/, 'Enter a valid Saudi mobile number'),
  home_phone: z.string().optional(),
  home_phone_country_code: z.string().optional(),
  additional_contact: z.string().optional(),
  contact_number_home_country: z.string().optional(),
})

export type Step6Input = z.infer<typeof Step6Schema>
