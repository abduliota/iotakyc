import { z } from 'zod'

export const Step1Schema = z.object({
  iqama: z
    .string()
    .min(10, 'ID must be exactly 10 digits')
    .max(10, 'ID must be exactly 10 digits')
    .regex(/^\d{10}$/, 'ID must contain only numbers — no letters or spaces')
    .refine(
      val => val.startsWith('1') || val.startsWith('2'),
      val => ({
        message: val.startsWith('1') || val.startsWith('2')
          ? ''
          : `ID must start with 1 (Saudi National ID) or 2 (Iqama/Resident ID) — got "${val[0]}"`
      })
    ),
})

export type Step1Input = z.infer<typeof Step1Schema>

// ── Helper: detect ID type from first digit ───────────────────────────────────
export function getIDType(iqama: string): 'NIN' | 'Iqama' | null {
  if (!iqama || iqama.length === 0) return null
  if (iqama[0] === '1') return 'NIN'
  if (iqama[0] === '2') return 'Iqama'
  return null
}