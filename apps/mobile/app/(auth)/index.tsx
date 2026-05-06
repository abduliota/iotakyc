import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

export default function AuthScreen() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'

  const sendOTP = async () => {
    if (!phone.match(/^(\+966|05)\d{8}$/)) {
      setError('Enter a valid Saudi mobile number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      if (res.ok) setStep('otp')
      else setError('Failed to send OTP')
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  const verifyOTP = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, iqama: '' }),
      })
      const json = await res.json()
      if (json.success) {
        router.replace('/(kyc)/step1')
      } else {
        setError('Invalid OTP — please try again')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>IOTA KYC</Text>
      <Text style={s.subtitle}>
        {step === 'phone' ? 'Enter your mobile number to begin' : `Enter the OTP sent to ${phone}`}
      </Text>

      {step === 'phone' ? (
        <TextInput
          style={s.input}
          placeholder="+966 5X XXX XXXX"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />
      ) : (
        <TextInput
          style={s.input}
          placeholder="6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          autoFocus
        />
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity
        style={s.btn}
        onPress={step === 'phone' ? sendOTP : verifyOTP}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={s.btnText}>{step === 'phone' ? 'Send OTP' : 'Verify'}</Text>
        )}
      </TouchableOpacity>

      {step === 'otp' && (
        <TouchableOpacity onPress={() => { setStep('phone'); setOtp('') }}>
          <Text style={s.link}>← Change number</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#0D1B2A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#4A5568', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#C8D8EE', borderRadius: 10, padding: 14,
           fontSize: 18, marginBottom: 12, letterSpacing: 2 },
  error: { color: '#E53E3E', marginBottom: 12, fontSize: 13 },
  btn: { backgroundColor: '#1B4F8A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link: { color: '#1B4F8A', textAlign: 'center', marginTop: 16, fontSize: 14 },
})
