import { View, Text, StyleSheet } from 'react-native'
import { Slot, usePathname } from 'expo-router'

const STEPS = [
  'Iqama', 'Personal', 'Address',
  'Employment', 'Financial', 'Contact', 'FATCA/PEP'
]

function getStepFromPath(path: string): number {
  const match = path.match(/step(\d)/)
  if (match) return parseInt(match[1])
  if (path.includes('review')) return 8
  return 1
}

export default function KYCLayout() {
  const pathname = usePathname()
  const currentStep = getStepFromPath(pathname)
  const isReview = pathname.includes('review')

  return (
    <View style={s.container}>
      {/* Progress bar */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {isReview ? 'Review & Submit' : `Step ${currentStep} of 7`}
        </Text>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(currentStep / 7) * 100}%` }]} />
        </View>
        {!isReview && (
          <Text style={s.stepLabel}>{STEPS[currentStep - 1]}</Text>
        )}
      </View>

      {/* Step content */}
      <Slot />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#0D1B2A', padding: 20, paddingTop: 56 },
  headerTitle: { color: '#A8C4E0', fontSize: 13, marginBottom: 10 },
  progressTrack: { height: 4, backgroundColor: '#1F3A5F', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#2E86DE', borderRadius: 2 },
  stepLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },
})
