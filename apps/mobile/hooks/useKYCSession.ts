import { useState, useEffect, useCallback } from 'react'
import { kycApi } from '@iotakyc/core'
import type { KYCSession, KYCStep } from '@iotakyc/core'
import * as SecureStore from 'expo-secure-store'

const SESSION_KEY = 'kyc_session_id'

export function useKYCSession() {
  const [session, setSession] = useState<KYCSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // On mount — check if there's an existing session to resume
  useEffect(() => {
    resumeSession()
  }, [])

  const resumeSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const storedId = await SecureStore.getItemAsync(SESSION_KEY)
      if (storedId) {
        const res = await kycApi.getSession(storedId)
        if (res.success && res.data) {
          setSession(res.data)
          setIsLoading(false)
          return
        }
      }
      // No valid session — stay at auth screen
      setSession(null)
    } catch {
      setSession(null)
    }
    setIsLoading(false)
  }, [])

  const createSession = useCallback(async (iqama: string) => {
    setIsLoading(true)
    const res = await kycApi.createSession(iqama)
    if (res.success && res.data) {
      await SecureStore.setItemAsync(SESSION_KEY, res.data.id)
      setSession(res.data)
    } else {
      setError(res.error ?? 'Failed to create session')
    }
    setIsLoading(false)
    return res
  }, [])

  const saveStep = useCallback(async (step: KYCStep, data: unknown) => {
    if (!session) return null
    setIsLoading(true)
    const res = await kycApi.saveStep(session.id, step, data)
    if (res.success && res.data) {
      setSession(res.data)
    } else {
      setError(res.error ?? 'Failed to save step')
    }
    setIsLoading(false)
    return res
  }, [session])

  const submitKYC = useCallback(async () => {
    if (!session) return null
    setIsLoading(true)
    const res = await kycApi.submit(session.id)
    if (res.success && res.data) {
      setSession(res.data)
      await SecureStore.deleteItemAsync(SESSION_KEY)
    }
    setIsLoading(false)
    return res
  }, [session])

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY)
    setSession(null)
  }, [])

  return {
    session,
    isLoading,
    error,
    createSession,
    saveStep,
    submitKYC,
    clearSession,
    currentStep: session?.current_step ?? 1,
  }
}
