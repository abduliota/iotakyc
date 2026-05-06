import { z } from 'zod'

// Step 4 — Employment (conditional fields from diagram)
// Government  → government_sector + profession + joining_date required
// Private     → employer_name (TKML lookup) + profession + joining_date required
// Military    → profession + joining_date required
// Self Employed → profession required
// Others      → no extra fields required

const EMPLOYED_STATUSES = ['government', 'private', 'military', 'self_employed'] as const

export const Step4Schema = z.object({
  employment_status: z.enum([
    'government', 'private', 'military', 'self_employed',
    'unemployed', 'retired', 'student', 'housewife', 'household_labour', 'others'
  ]),
  employer_name: z.string().optional(),
  government_sector: z.string().optional(),
  profession: z.string().optional(),
  joining_date: z.string().optional(),
  education: z.string().optional(),
})
.refine(data => {
  if (data.employment_status === 'private' || data.employment_status === 'government') {
    return !!data.employer_name
  }
  return true
}, { message: 'Employer name is required', path: ['employer_name'] })
.refine(data => {
  if (data.employment_status === 'government') {
    return !!data.government_sector
  }
  return true
}, { message: 'Government sector is required', path: ['government_sector'] })
.refine(data => {
  if ((EMPLOYED_STATUSES as readonly string[]).includes(data.employment_status)) {
    return !!data.profession
  }
  return true
}, { message: 'Profession is required', path: ['profession'] })
.refine(data => {
  if (['government', 'private', 'military'].includes(data.employment_status)) {
    return !!data.joining_date
  }
  return true
}, { message: 'Joining date is required', path: ['joining_date'] })

export type Step4Input = z.infer<typeof Step4Schema>
