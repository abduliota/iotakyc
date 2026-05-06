// ─────────────────────────────────────────────────────────────────────────────
// @iotakyc/core — API Client
// Single source for all backend calls — imported by mobile + web
// ─────────────────────────────────────────────────────────────────────────────

import type {
  APIResponse, KYCSession, KYCData,
  NationalAddressResponse, EstablishmentResponse, WatchlistResponse
} from './types'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? 'http://localhost:8000'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
    const json = await res.json()
    if (!res.ok) return { success: false, error: json.detail ?? 'Request failed' }
    return { success: true, data: json }
  } catch (e) {
    return { success: false, error: 'Network error — please check your connection' }
  }
}

const get  = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

// ── KYC Session ───────────────────────────────────────────────────────────────

export const kycApi = {
  // Create a new session after OTP verified
  createSession: (iqama: string) =>
    post<KYCSession>('/kyc/session', { iqama }),

  // Get current session state (used on app resume)
  getSession: (sessionId: string) =>
    get<KYCSession>(`/kyc/session/${sessionId}`),

  // Save step data and advance to next step
  saveStep: (sessionId: string, step: number, data: unknown) =>
    patch<KYCSession>(`/kyc/session/${sessionId}/step/${step}`, data),

  // Get all collected data for review screen
  getKYCData: (sessionId: string) =>
    get<KYCData>(`/kyc/session/${sessionId}/data`),

  // Final submission — triggers ELMNatheer check server-side
  submit: (sessionId: string) =>
    post<KYCSession>(`/kyc/session/${sessionId}/submit`, {}),
}

// ── Government APIs (proxied through backend) ─────────────────────────────────

export const govApi = {
  // SPOST — National Address by Iqama
  fetchNationalAddress: (iqama: string) =>
    get<NationalAddressResponse>(`/gov/address/${iqama}`),

  // TKML — Establishment status by name
  fetchEstablishment: (name: string) =>
    get<EstablishmentResponse>(`/gov/establishment/${encodeURIComponent(name)}`),

  // ELMNatheer — Watchlist check (called server-side on submit, exposed for dev)
  checkWatchlist: (personId: string, idType: string, dob: string) =>
    post<WatchlistResponse>('/gov/watchlist', { person_id: personId, id_type: idType, dob }),
}

// ── Admin / Agent (web portal only) ──────────────────────────────────────────

export const adminApi = {
  listSubmissions: (params?: { status?: string; page?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return get<{ items: KYCData[]; total: number }>(`/admin/submissions?${qs}`)
  },

  getSubmission: (sessionId: string) =>
    get<KYCData>(`/admin/submissions/${sessionId}`),

  updateStatus: (sessionId: string, action: string, notes?: string) =>
    patch(`/admin/submissions/${sessionId}`, { action, notes }),
}
