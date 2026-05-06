import { z } from 'zod'

// Step 5 — Financial Information
export const Step5Schema = z.object({
  income_range: z.string().min(1, 'Income range is required'),
  additional_income: z.boolean().optional(),
  additional_income_source: z.string().optional(),
  purpose_of_account: z.string().min(1, 'Purpose of account is required'),
  account_currency: z.string().min(1, 'Account currency is required'),
  expected_monthly_deposit_amount: z.string().min(1, 'Expected deposit amount is required'),
  expected_monthly_withdrawal_amount: z.string().min(1, 'Expected withdrawal amount is required'),
  expected_monthly_deposit_count: z.string().min(1, 'Expected deposit count is required'),
  expected_monthly_withdrawal_count: z.string().min(1, 'Expected withdrawal count is required'),
  primary_source_of_income: z.string().min(1, 'Primary source of income is required'),
  other_source_of_income: z.string().optional(),
})
.refine(data => {
  if (data.additional_income === true) {
    return !!data.additional_income_source
  }
  return true
}, { message: 'Please specify the additional income source', path: ['additional_income_source'] })

export type Step5Input = z.infer<typeof Step5Schema>
