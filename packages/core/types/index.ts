// ─────────────────────────────────────────────────────────────────────────────
// @iotakyc/core — Shared Types
// Used by both apps/mobile and apps/web
// ─────────────────────────────────────────────────────────────────────────────

export type KYCStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type SessionStatus =
  | 'in_progress' | 'submitted' | 'under_review'
  | 'approved' | 'rejected' | 'flagged'

export interface KYCSession {
  id: string
  user_id: string
  current_step: KYCStep
  status: SessionStatus
  started_at: string
  submitted_at?: string
  updated_at: string
}

export type EmploymentStatus =
  | 'government' | 'private' | 'military' | 'self_employed'
  | 'unemployed' | 'retired' | 'student' | 'housewife'
  | 'household_labour' | 'others'

export type TINType = 'SSN' | 'ITIN' | 'ATIN' | 'TIN'

export interface TaxCountry {
  country: string
  has_tin: boolean
  tin_type?: TINType
  tin_value?: string
  tin_reason?: string
}

export type PEPRelationship =
  | 'self' | 'spouse' | 'child' | 'parent'
  | 'sibling' | 'close_associate' | 'other'

export interface Step1Data { iqama: string }

export interface Step2Data {
  full_name: string
  date_of_birth: string
  nationality: string
  country_of_birth: string
  city_of_birth: string
  region_of_birth: string
  other_nationality?: string
}

export interface Step3Data {
  national_address_registered: boolean
  building_number: string
  street: string
  district: string
  city: string
  postal_code: string
  additional_number?: string
  unit_number?: string
  po_box?: string
}

export interface Step4Data {
  employment_status: EmploymentStatus
  employer_name?: string
  government_sector?: string
  profession?: string
  joining_date?: string
  education?: string
}

export interface Step5Data {
  income_range: string
  additional_income?: boolean
  additional_income_source?: string
  purpose_of_account: string
  account_currency: string
  expected_monthly_deposit_amount: string
  expected_monthly_withdrawal_amount: string
  expected_monthly_deposit_count: string
  expected_monthly_withdrawal_count: string
}

export interface Step6Data {
  mobile_number: string
  home_phone?: string
  home_phone_country_code?: string
  additional_contact?: string
  contact_number_home_country?: string
}

export interface Step7Data {
  tax_resident_outside_ksa: boolean
  tax_countries?: TaxCountry[]
  us_person?: boolean
  ssn_itin_atin?: string
  immigrant_visa_outside_ksa?: boolean
  residence_outside_ksa?: boolean
  is_pep: boolean
  pep_relationship?: PEPRelationship
  pep_declaration_note?: string
}

export interface KYCData extends
  Partial<Step1Data>, Partial<Step2Data>, Partial<Step3Data>,
  Partial<Step4Data>, Partial<Step5Data>, Partial<Step6Data>,
  Partial<Step7Data> {
  session_id: string
  elm_result?: boolean
  elm_result_code?: string
  elm_checked_at?: string
}

export interface NationalAddressResponse {
  success: boolean
  building_number: string
  street: string
  district: string
  city: string
  postal_code: string
  additional_number?: string
  unit_number?: string
  region: string
}

export interface EstablishmentResponse {
  success: boolean
  establishment_name: string
  establishment_status: string
}

export interface WatchlistResponse {
  person_id: string
  result: boolean
  result_code: string
  result_desc: string
}

export type AgentRole = 'reviewer' | 'manager' | 'admin'

export interface AgentAction {
  id: string
  session_id: string
  agent_id: string
  action: 'approved' | 'rejected' | 'flagged' | 'requested_info' | 'reviewed'
  notes?: string
  created_at: string
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
