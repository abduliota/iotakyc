import { useState } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useKYCSession } from '../../hooks/useKYCSession'
import { useGovFetch } from '../../hooks/useGovFetch'
import { Step4Schema } from '@iotakyc/core'
import type { EmploymentStatus } from '@iotakyc/core'

// Matches diagram employment options exactly
const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string; labelAr: string }[] = [
  { value: 'government',       label: 'Government Sector',   labelAr: 'القطاع الحكومي' },
  { value: 'private',          label: 'Private Sector',      labelAr: 'القطاع الخاص' },
  { value: 'military',         label: 'Military',            labelAr: 'عسكري' },
  { value: 'self_employed',    label: 'Self Employed',       labelAr: 'عمل حر' },
  { value: 'unemployed',       label: 'Unemployed',          labelAr: 'غير موظف' },
  { value: 'retired',          label: 'Retired',             labelAr: 'متقاعد' },
  { value: 'student',          label: 'Student',             labelAr: 'طالب' },
  { value: 'housewife',        label: 'Housewife',           labelAr: 'ربة منزل' },
  { value: 'household_labour', label: 'Household Labour',    labelAr: 'عامل منزلي' },
  { value: 'others',           label: 'Others',              labelAr: 'أخرى' },
]

const GOVT_SECTORS = [
  'Ministry of Health', 'Ministry of Education', 'Ministry of Interior',
  'Ministry of Finance', 'SAMA', 'SEC', 'Other Government Entity',
]

export default function Step4() {
  const [status, setStatus] = useState<EmploymentStatus | ''>('')
  const [employerName, setEmployerName] = useState('')
  const [employerVerified, setEmployerVerified] = useState(false)
  const [govtSector, setGovtSector] = useState('')
  const [profession, setProfession] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [education, setEducation] = useState('')
  const [error, setError] = useState('')

  const { saveStep, session, isLoading } = useKYCSession()
  const { fetchEstablishment, establishmentLoading } = useGovFetch()
  const router = useRouter()

  // Which additional fields to show — from diagram
  const showEmployer   = status === 'private'
  const showGovSector  = status === 'government'
  const showProfession = ['government','private','military','self_employed'].includes(status)
  const showJoinDate   = ['government','private','military'].includes(status)

  const verifyEmployer = async () => {
    if (!employerName) return
    const result = await fetchEstablishment(employerName)
    if (result) setEmployerVerified(true)
  }

  const handleNext = async () => {
    if (!status) { setError('Please select your employment status'); return }
    const data = {
      employment_status: status,
      employer_name: employerName || undefined,
      government_sector: govtSector || undefined,
      profession: profession || undefined,
      joining_date: joiningDate || undefined,
      education: education || undefined,
    }
    const parsed = Step4Schema.safeParse(data)
    if (!parsed.success) { setError(parsed.error.errors[0].message); return }
    setError('')
    await saveStep(4, data)
    router.push('/(kyc)/step5')
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.title}>Employment Status</Text>

      {/* Employment status picker */}
      <View style={s.options}>
        {EMPLOYMENT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.option, status === opt.value && s.optionSelected]}
            onPress={() => { setStatus(opt.value); setError('') }}
          >
            <Text style={[s.optionText, status === opt.value && s.optionTextSelected]}>
              {opt.label}
            </Text>
            <Text style={s.optionAr}>{opt.labelAr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conditional fields from diagram */}
      {showGovSector && (
        <View style={s.field}>
          <Text style={s.label}>Government Sector</Text>
          {GOVT_SECTORS.map(sec => (
            <TouchableOpacity
              key={sec}
              style={[s.chip, govtSector === sec && s.chipSelected]}
              onPress={() => setGovtSector(sec)}
            >
              <Text style={[s.chipText, govtSector === sec && s.chipTextSelected]}>{sec}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {showEmployer && (
        <View style={s.field}>
          <Text style={s.label}>Employer Name</Text>
          <View style={s.row}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Enter employer name"
              value={employerName}
              onChangeText={t => { setEmployerName(t); setEmployerVerified(false) }}
            />
            <TouchableOpacity
              style={s.verifyBtn}
              onPress={verifyEmployer}
              disabled={establishmentLoading}
            >
              <Text style={s.verifyText}>{employerVerified ? '✓' : 'Verify'}</Text>
            </TouchableOpacity>
          </View>
          {employerVerified && (
            <Text style={s.verified}>✓ Establishment verified and active</Text>
          )}
        </View>
      )}

      {showProfession && (
        <View style={s.field}>
          <Text style={s.label}>Profession</Text>
          <TextInput style={s.input} placeholder="Your profession" value={profession} onChangeText={setProfession} />
        </View>
      )}

      {showJoinDate && (
        <View style={s.field}>
          <Text style={s.label}>Joining Date</Text>
          <TextInput style={s.input} placeholder="YYYY-MM-DD" value={joiningDate} onChangeText={setJoiningDate} />
        </View>
      )}

      <View style={s.field}>
        <Text style={s.label}>Education Level</Text>
        <TextInput style={s.input} placeholder="Highest education level" value={education} onChangeText={setEducation} />
      </View>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.btn} onPress={handleNext} disabled={isLoading}>
        <Text style={s.btnText}>Continue →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#0D1B2A', marginBottom: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  option: { borderWidth: 1.5, borderColor: '#C8D8EE', borderRadius: 10,
            padding: 12, minWidth: '45%' },
  optionSelected: { borderColor: '#1B4F8A', backgroundColor: '#EBF4FF' },
  optionText: { fontWeight: '600', fontSize: 13, color: '#1A1A2E' },
  optionTextSelected: { color: '#1B4F8A' },
  optionAr: { fontSize: 11, color: '#4A5568', marginTop: 2 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A2E', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#C8D8EE', borderRadius: 10, padding: 14, fontSize: 15 },
  row: { flexDirection: 'row', gap: 8 },
  verifyBtn: { backgroundColor: '#0D1B2A', borderRadius: 10, padding: 14, justifyContent: 'center' },
  verifyText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  verified: { color: '#27AE60', fontSize: 12, marginTop: 6 },
  chip: { borderWidth: 1, borderColor: '#C8D8EE', borderRadius: 8, padding: 8,
          marginBottom: 6, flexDirection: 'row', alignItems: 'center' },
  chipSelected: { borderColor: '#1B4F8A', backgroundColor: '#EBF4FF' },
  chipText: { fontSize: 13, color: '#1A1A2E' },
  chipTextSelected: { color: '#1B4F8A', fontWeight: '600' },
  error: { color: '#E53E3E', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#1B4F8A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
