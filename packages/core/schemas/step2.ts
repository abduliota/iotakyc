import { z } from 'zod'

// Step 2 — Personal Info (auto-fetched from NIC/Absher, customer confirms)
export const Step2Schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  country_of_birth: z.string().min(1, 'Country of birth is required'),
  city_of_birth: z.string().min(1, 'City of birth is required'),
  region_of_birth: z.string().min(1, 'Region of birth is required'),
  other_nationality: z.string().optional(),
})

export type Step2Input = z.infer<typeof Step2Schema>
