import { useState } from 'react'
import { govApi } from '@iotakyc/core'
import type { NationalAddressResponse, EstablishmentResponse } from '@iotakyc/core'

export function useGovFetch() {
  const [addressLoading, setAddressLoading] = useState(false)
  const [establishmentLoading, setEstablishmentLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAddress = async (iqama: string): Promise<NationalAddressResponse | null> => {
    setAddressLoading(true)
    setError(null)
    const res = await govApi.fetchNationalAddress(iqama)
    setAddressLoading(false)
    if (res.success && res.data) return res.data
    setError(res.error ?? 'Failed to fetch national address')
    return null
  }

  const fetchEstablishment = async (name: string): Promise<EstablishmentResponse | null> => {
    setEstablishmentLoading(true)
    setError(null)
    const res = await govApi.fetchEstablishment(name)
    setEstablishmentLoading(false)
    if (res.success && res.data) return res.data
    setError(res.error ?? 'Failed to fetch establishment')
    return null
  }

  return { fetchAddress, fetchEstablishment, addressLoading, establishmentLoading, error }
}
