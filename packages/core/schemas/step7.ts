import { z } from 'zod'

// Step 7 — FATCA / CRS + PEP
// Most complex step — follows the exact branching from the diagram

const TaxCountrySchema = z.object({
  country: z.string().min(1, 'Country is required'),
  has_tin: z.boolean(),
  tin_type: z.enum(['SSN', 'ITIN', 'ATIN', 'TIN']).optional(),
  tin_value: z
    .string()
    .regex(/^\d{9}$/, 'TIN must be exactly 9 digits')
    .optional(),
  tin_reason: z.string().optional(),
})
.refine(data => {
  // If has TIN → tin_type and tin_value required
  if (data.has_tin) {
    return !!data.tin_type && !!data.tin_value
  }
  return true
}, { message: 'TIN type and value are required', path: ['tin_value'] })
.refine(data => {
  // If no TIN → reason required
  if (!data.has_tin) {
    return !!data.tin_reason
  }
  return true
}, { message: 'Please provide a reason for not having a TIN', path: ['tin_reason'] })

export const Step7Schema = z.object({
  // ── FATCA / CRS ──────────────────────────────────────────────────────────
  tax_resident_outside_ksa: z.boolean(),

  // Up to 3 tax countries — only required if tax_resident_outside_ksa is true
  tax_countries: z.array(TaxCountrySchema).max(3).optional(),

  // USA-specific questions
  us_person: z.boolean().optional(),
  ssn_itin_atin: z.string().optional(),

  immigrant_visa_outside_ksa: z.boolean(),
  residence_outside_ksa: z.boolean(),

  // ── PEP ──────────────────────────────────────────────────────────────────
  // is_pep is set by ELMNatheer result — not user input
  // but user must confirm relationship if flagged
  is_pep: z.boolean(),
  pep_relationship: z.enum([
    'self', 'spouse', 'child', 'parent',
    'sibling', 'close_associate', 'other'
  ]).optional(),
  pep_declaration_note: z.string().optional(),
})
.refine(data => {
  // If tax resident outside KSA → at least 1 country required
  if (data.tax_resident_outside_ksa) {
    return (data.tax_countries?.length ?? 0) >= 1
  }
  return true
}, { message: 'Please add at least one tax country', path: ['tax_countries'] })
.refine(data => {
  // If US person → SSN/ITIN/ATIN required
  if (data.us_person === true) {
    return !!data.ssn_itin_atin
  }
  return true
}, { message: 'SSN / ITIN / ATIN is required for US persons', path: ['ssn_itin_atin'] })
.refine(data => {
  // If flagged as PEP → relationship required
  if (data.is_pep) {
    return !!data.pep_relationship
  }
  return true
}, { message: 'Please specify your relationship with the PEP', path: ['pep_relationship'] })

export type Step7Input = z.infer<typeof Step7Schema>
