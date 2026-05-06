import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useKYCSession } from '../../hooks/useKYCSession'
import { Step1Schema } from '@iotakyc/core'

export default function Step1() {
  const [iqama, setIqama] = useState('')
  const [error, setError] = useState('')
  const { createSession, saveStep, isLoading } = useKYCSession()
  const router = useRouter()

  const handleNext = async () => {
    const parsed = Step1Schema.safeParse({ iqama })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }
    setError('')

    // Create a new KYC session with this Iqama
    const res = await createSession(iqama)
    if (!res?.success) { setError('Failed to start session'); return }

    // Save step 1 data
    await saveStep(1, { iqama })
    router.push('/(kyc)/step2')
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Enter your Iqama Number</Text>
      <Text style={s.sub}>We'll use this to fetch your information from government systems</Text>

      <TextInput
        style={s.input}
        placeholder="10-digit Iqama number"
        keyboardType="number-pad"
        maxLength={10}
        value={iqama}
        onChangeText={setIqama}
        autoFocus
      />
      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.btn} onPress={handleNext} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue →</Text>}
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#0D1B2A', marginTop: 20, marginBottom: 8 },
  sub: { fontSize: 14, color: '#4A5568', marginBottom: 32, lineHeight: 20 },
  input: { borderWidth: 1.5, borderColor: '#C8D8EE', borderRadius: 10, padding: 16,
           fontSize: 22, letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  error: { color: '#E53E3E', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#1B4F8A', borderRadius: 10, padding: 16,
         alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
