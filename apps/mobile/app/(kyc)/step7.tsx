import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useKYCSession } from '../../hooks/useKYCSession'
import { Step7Schema } from '@iotakyc/core'
import type { TaxCountry, TINType } from '@iotakyc/core'

const TIN_TYPES: TINType[] = ['SSN', 'ITIN', 'ATIN', 'TIN']

const PEP_RELATIONSHIPS = [
  { value: 'self',            label: 'Self' },
  { value: 'spouse',          label: 'Spouse' },
  { value: 'child',           label: 'Child' },
  { value: 'parent',          label: 'Parent' },
  { value: 'sibling',         label: 'Sibling' },
  { value: 'close_associate', label: 'Close Associate' },
  { value: 'other',           label: 'Other' },
]

export default function Step7() {
  // FATCA / CRS state
  const [taxResident, setTaxResident] = useState(false)
  const [taxCountries, setTaxCountries] = useState<TaxCountry[]>([])
  const [usPerson, setUsPerson] = useState(false)
  const [ssnItin, setSsnItin] = useState('')
  const [immigrantVisa, setImmigrantVisa] = useState(false)
  const [residenceOutside, setResidenceOutside] = useState(false)

  // PEP state (set by ELM result — in real flow this comes from session)
  const [isPEP, setIsPEP] = useState(false)
  const [pepRelationship, setPepRelationship] = useState('')
  const [pepNote, setPepNote] = useState('')
  const [error, setError] = useState('')

  const { saveStep, isLoading } = useKYCSession()
  const router = useRouter()

  const addCountry = () => {
    if (taxCountries.length >= 3) return
    setTaxCountries(prev => [...prev, { country: '', has_tin: false }])
  }

  const updateCountry = (idx: number, updates: Partial<TaxCountry>) => {
    setTaxCountries(prev => prev.map((c, i) => i === idx ? { ...c, ...updates } : c))
  }

  const handleNext = async () => {
    const data = {
      tax_resident_outside_ksa: taxResident,
      tax_countries: taxResident ? taxCountries : undefined,
      us_person: usPerson,
      ssn_itin_atin: usPerson ? ssnItin : undefined,
      immigrant_visa_outside_ksa: immigrantVisa,
      residence_outside_ksa: residenceOutside,
      is_pep: isPEP,
      pep_relationship: isPEP ? (pepRelationship as any) : undefined,
      pep_declaration_note: isPEP ? pepNote : undefined,
    }
    const parsed = Step7Schema.safeParse(data)
    if (!parsed.success) { setError(parsed.error.errors[0].message); return }
    setError('')
    await saveStep(7, data)
    router.push('/(kyc)/review')
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.section}>FATCA / CRS Declaration</Text>

      {/* Tax residency outside KSA */}
      <View style={s.row}>
        <Text style={s.label}>Are you a tax resident of any country outside KSA?</Text>
        <Switch value={taxResident} onValueChange={setTaxResident} />
      </View>

      {taxResident && (
        <View style={s.subSection}>
          {taxCountries.map((tc, idx) => (
            <View key={idx} style={s.countryBlock}>
              <Text style={s.countryTitle}>Country {idx + 1}</Text>
              <TextInput
                style={s.input}
                placeholder="Enter country"
                value={tc.country}
                onChangeText={v => updateCountry(idx, { country: v })}
              />
              <View style={s.tinRow}>
                <Text style={s.label}>Do you have a TIN?</Text>
                <Switch value={tc.has_tin} onValueChange={v => updateCountry(idx, { has_tin: v })} />
              </View>
              {tc.has_tin ? (
                <>
                  <Text style={s.label}>TIN Type</Text>
                  <View style={s.chipRow}>
                    {TIN_TYPES.map(t => (
                      <TouchableOpacity
                        key={t}
                        style={[s.chip, tc.tin_type === t && s.chipSelected]}
                        onPress={() => updateCountry(idx, { tin_type: t })}
                      >
                        <Text style={[s.chipText, tc.tin_type === t && s.chipTextSelected]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={s.input}
                    placeholder="TIN (9 digits)"
                    keyboardType="number-pad"
                    maxLength={9}
                    value={tc.tin_value}
                    onChangeText={v => updateCountry(idx, { tin_value: v })}
                  />
                </>
              ) : (
                <TextInput
                  style={s.input}
                  placeholder="Reason for not having TIN"
                  value={tc.tin_reason}
                  onChangeText={v => updateCountry(idx, { tin_reason: v })}
                />
              )}
            </View>
          ))}
          {taxCountries.length < 3 && (
            <TouchableOpacity style={s.addBtn} onPress={addCountry}>
              <Text style={s.addBtnText}>+ Add country (up to 3)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* USA person check */}
      <View style={s.row}>
        <Text style={s.label}>Are you a US person?</Text>
        <Switch value={usPerson} onValueChange={setUsPerson} />
      </View>
      {usPerson && (
        <TextInput
          style={s.input}
          placeholder="SSN / ITIN / ATIN"
          value={ssnItin}
          onChangeText={setSsnItin}
        />
      )}

      <View style={s.row}>
        <Text style={s.label}>Do you have immigrant visa or permanent resident status outside KSA?</Text>
        <Switch value={immigrantVisa} onValueChange={setImmigrantVisa} />
      </View>

      <View style={s.row}>
        <Text style={s.label}>Do you have residence outside KSA?</Text>
        <Switch value={residenceOutside} onValueChange={setResidenceOutside} />
      </View>

      {/* PEP section — shown if ELMNatheer flagged (or test mode) */}
      <Text style={[s.section, { marginTop: 24 }]}>PEP Declaration</Text>
      <View style={s.row}>
        <Text style={s.label}>Are you (or related to) a Politically Exposed Person?</Text>
        <Switch value={isPEP} onValueChange={setIsPEP} />
      </View>

      {isPEP && (
        <View style={s.subSection}>
          <Text style={s.label}>Relationship with PEP</Text>
          <View style={s.chipRow}>
            {PEP_RELATIONSHIPS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[s.chip, pepRelationship === r.value && s.chipSelected]}
                onPress={() => setPepRelationship(r.value)}
              >
                <Text style={[s.chipText, pepRelationship === r.value && s.chipTextSelected]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Declaration Note</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Add a declaration note..."
            multiline
            numberOfLines={4}
            value={pepNote}
            onChangeText={setPepNote}
          />
        </View>
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={s.btn} onPress={handleNext} disabled={isLoading}>
        <Text style={s.btnText}>Review & Submit →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 48 },
  section: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
         marginBottom: 16, gap: 12 },
  tinRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 14, color: '#1A1A2E', flex: 1, lineHeight: 20 },
  subSection: { backgroundColor: '#F0F4FA', borderRadius: 12, padding: 16, marginBottom: 16 },
  countryBlock: { marginBottom: 16, borderBottomWidth: 1, borderColor: '#C8D8EE', paddingBottom: 16 },
  countryTitle: { fontWeight: '700', color: '#1B4F8A', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#C8D8EE', borderRadius: 10,
           padding: 14, fontSize: 15, backgroundColor: '#fff', marginBottom: 8 },
  textarea: { height: 96, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1.5, borderColor: '#C8D8EE', borderRadius: 8, padding: 8 },
  chipSelected: { borderColor: '#1B4F8A', backgroundColor: '#EBF4FF' },
  chipText: { fontSize: 13, color: '#1A1A2E' },
  chipTextSelected: { color: '#1B4F8A', fontWeight: '700' },
  addBtn: { borderWidth: 1.5, borderColor: '#1B4F8A', borderRadius: 10,
            padding: 12, alignItems: 'center', borderStyle: 'dashed' },
  addBtnText: { color: '#1B4F8A', fontWeight: '600', fontSize: 14 },
  error: { color: '#E53E3E', fontSize: 13, marginBottom: 12 },
  btn: { backgroundColor: '#1B4F8A', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
