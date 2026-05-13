'use client'
import React, { useState, useRef, useCallback } from 'react'
import './wizard.css'

// ── Types ──────────────────────────────────────────────────────────────────────
type Screen = 'intro' | 'wizard' | 'success'
type Dir = 1 | -1

interface TaxCountry {
  country: string; hasTin: boolean; tinType: string; tin: string; reason: string
}

interface WizData {
  // Step 1
  iqama: string; fullName: string; dob: string; nationality: string
  otherNat: string; cob: string; cityob: string; regionob: string
  gender: string; maritalStatus: string
  // Step 2
  empStatus: string; govtSector: string; employer: string
  profession: string; joinDate: string; education: string
  // Step 3
  incomeSource: string; incomeRange: string; otherSource: string
  addSource: string; addRange: string; purpose: string; currency: string
  depCount: string; depAmount: string; wdwCount: string; wdwAmount: string
  // Step 4
  mobile: string; homePhone: string
  hasResidence: boolean; resCountry: string; resPostal: string
  resStreet: string; resCity: string; resDistrict: string; resUnit: string; resPobox: string
  homeContact: string
  hasVisa: boolean; visaCountry: string; visaType: string; addContact: string
  // Step 5
  taxResident: boolean; taxCountries: TaxCountry[]
  usPerson: boolean; ssn: string
  isPep: boolean; pepRel: string; pepNote: string
  // Step 6
  building: string; street: string; district: string
  city: string; postal: string; addNum: string; unit: string; pobox: string
}

const INITIAL: WizData = {
  iqama: '', fullName: '', dob: '', nationality: '', otherNat: '',
  cob: '', cityob: '', regionob: '',
  gender: '', maritalStatus: '',
  empStatus: '', govtSector: '', employer: '', profession: '', joinDate: '', education: '',
  incomeSource: '', incomeRange: '', otherSource: '', addSource: '', addRange: '',
  purpose: '', currency: '', depCount: '', depAmount: '', wdwCount: '', wdwAmount: '',
  mobile: '', homePhone: '',
  hasResidence: false, resCountry: '', resPostal: '', resStreet: '', resCity: '',
  resDistrict: '', resUnit: '', resPobox: '', homeContact: '',
  hasVisa: false, visaCountry: '', visaType: '', addContact: '',
  taxResident: false, taxCountries: [], usPerson: false, ssn: '',
  isPep: false, pepRel: '', pepNote: '',
  building: '', street: '', district: '', city: '', postal: '', addNum: '', unit: '', pobox: '',
}

const STEPS = [
  'Personal Information', 'Employment Status', 'Financial Information',
  'Contact & Additional', 'FATCA / CRS Declaration', 'National Address',
]

const EMP_OPTIONS = [
  { val: 'private',    label: 'Private Sector',   ar: 'القطاع الخاص' },
  { val: 'government', label: 'Government Sector', ar: 'القطاع الحكومي' },
  { val: 'military',   label: 'Military',          ar: 'عسكري' },
  { val: 'self',       label: 'Self Employed',     ar: 'عمل حر' },
  { val: 'retired',    label: 'Retired',           ar: 'متقاعد' },
  { val: 'student',    label: 'Student',           ar: 'طالب' },
  { val: 'housewife',  label: 'Housewife',         ar: 'ربة منزل' },
  { val: 'unemployed', label: 'Unemployed',        ar: 'غير موظف' },
  { val: 'household',  label: 'Household Labour',  ar: 'عامل منزلي' },
  { val: 'others',     label: 'Others',            ar: 'أخرى' },
]

const GOVT_SECTORS = [
  'Ministry of Health', 'Ministry of Education', 'Ministry of Interior',
  'Ministry of Finance', 'SAMA', 'SEC', 'NEOM', 'Aramco (Government)', 'Other',
]

// ── Small reusable pieces ──────────────────────────────────────────────────────
function WField({ label, note, error, children }: {
  label: string; note?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className={`wf${error ? ' has-error' : ''}`}>
      <label>{label}</label>
      {children}
      {note && <span className="wf-note">{note}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  )
}

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className={`toggle-row${on ? ' on' : ''}`} onClick={onToggle}>
      <span className="toggle-label">{label}</span>
      <div className="toggle-switch" />
    </div>
  )
}

function RightPanel({ apiName, apiState, title, text, items }: {
  apiName?: string
  apiState?: 'idle' | 'fetching' | 'done'
  title: string; text: string
  items: { icon: string; html: string }[]
}) {
  return (
    <>
      {apiName && (
        <div className="panel-api-badge">
          <div className={`panel-api-dot${apiState === 'fetching' ? ' fetching' : apiState === 'done' ? ' done' : ''}`} />
          {apiName} API
        </div>
      )}
      <div>
        <div className="panel-title">{title}</div>
        <div className="panel-text">{text}</div>
      </div>
      <div className="panel-divider" />
      <div className="panel-items">
        {items.map((item, i) => (
          <div key={i} className="panel-item">
            <span className="panel-item-icon">{item.icon}</span>
            <span dangerouslySetInnerHTML={{ __html: item.html }} />
          </div>
        ))}
      </div>
    </>
  )
}

function BtnRow({ onBack, onNext, backLabel, nextLabel, nextLoading, isFirst, isLast }: {
  onBack: () => void; onNext: () => void
  backLabel?: string; nextLabel?: string
  nextLoading?: boolean; isFirst?: boolean; isLast?: boolean
}) {
  return (
    <div className="wiz-btn-row">
      {isFirst ? <div /> : (
        <button className="btn-wiz-back" onClick={onBack}>{backLabel || '← Back'}</button>
      )}
      <button className="btn-wiz-next" onClick={onNext} disabled={nextLoading}>
        {nextLoading ? <><span className="wiz-spinner" /> Submitting...</> : (
          <>{nextLabel || (isLast ? 'Submit KYC Application' : 'Continue')} {!isLast && <span style={{ fontSize: 18 }}>→</span>}</>
        )}
      </button>
    </div>
  )
}


// ── Hijri ↔ Gregorian conversion (no external lib — pure math) ───────────────
// Algorithm: Kuwaiti algorithm (used by Saudi gov systems)
function gregorianToHijri(gDate: string): string {
  if (!gDate) return ''
  const [gy, gm, gd] = gDate.split('-').map(Number)
  const jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4)
    + Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12)
    - Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4)
    + gd - 32075
  let l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  l = l - 10631 * n + 354
  const j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719))
    + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238))
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50))
    - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29
  const hm = Math.floor((24 * l) / 709)
  const hd = l - Math.floor((709 * hm) / 24)
  const hy = 30 * n + j - 30
  return `${hy}/${String(hm).padStart(2,'0')}/${String(hd).padStart(2,'0')}`
}

function hijriToGregorian(hDate: string): string {
  // hDate format: YYYY/MM/DD (Hijri)
  const parts = hDate.replace(/-/g, '/').split('/')
  if (parts.length !== 3) return ''
  const [hy, hm, hd] = parts.map(Number)
  if (isNaN(hy) || isNaN(hm) || isNaN(hd)) return ''
  if (hm < 1 || hm > 12 || hd < 1 || hd > 30) return ''
  const jd = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm
    - Math.floor((hm - 1) / 2) + hd + 1948440 - 385
  const l = jd + 68569
  const n = Math.floor((4 * l) / 146097)
  const l2 = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l2 + 1)) / 1461001)
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l3) / 2447)
  const gd = l3 - Math.floor((2447 * j) / 80)
  const l4 = Math.floor(j / 11)
  const gm = j + 2 - 12 * l4
  const gy = 100 * (n - 49) + i + l4
  return `${gy}-${String(gm).padStart(2,'0')}-${String(gd).padStart(2,'0')}`
}

const HIJRI_MONTHS = [
  'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
  'Jumada al-Awwal','Jumada al-Thani','Rajab','Shaaban',
  'Ramadan','Shawwal','Dhul Qadah','Dhul Hijjah',
]

// ── DateOfBirthField — Gregorian input with Hijri calendar picker ────────────
function HijriCalendar({ selected, onSelect, maxToday = true }: {
  selected: { hy: number; hm: number; hd: number } | null
  onSelect: (hy: number, hm: number, hd: number) => void
  maxToday?: boolean
}) {
  const currentHijri = gregorianToHijri(new Date().toISOString().split('T')[0])
  const [cy, cm] = currentHijri.split('/').map(Number)

  const [viewYear, setViewYear]   = React.useState(selected?.hy ?? cy)
  const [viewMonth, setViewMonth] = React.useState(selected?.hm ?? cm)

  const daysInMonth = (hy: number, hm: number) => (hm % 2 === 1 || hm === 12) ? 30 : 29
  const totalDays = daysInMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Year range: 1350–current Hijri year
  const years = Array.from({ length: cy - 1350 + 1 }, (_, i) => 1350 + i).reverse()

  return (
    <div style={{
      background: 'var(--navy2)', border: '1.5px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: 16, marginTop: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Month / Year navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <select
            value={viewMonth}
            onChange={e => setViewMonth(Number(e.target.value))}
            style={{ flex: 1, padding: '5px 8px', fontSize: 12, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', appearance: 'none' as const }}
          >
            {HIJRI_MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={viewYear}
            onChange={e => setViewYear(Number(e.target.value))}
            style={{ width: 72, padding: '5px 8px', fontSize: 12, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', cursor: 'pointer', appearance: 'none' as const }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>

      {/* Day-of-week headers (Sun–Sat, Hijri weeks start Sunday) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--muted)', padding: '2px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {/* Leading empty cells — calculate weekday of 1st */}
        {(() => {
          const gregFirst = hijriToGregorian(`${viewYear}/${String(viewMonth).padStart(2,'0')}/01`)
          const startDay = gregFirst ? new Date(gregFirst + 'T00:00:00').getDay() : 0
          return Array.from({ length: startDay }, (_, i) => (
            <div key={`e${i}`} />
          ))
        })()}
        {/* Day buttons */}
        {Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1
          const isSelected = selected?.hy === viewYear && selected?.hm === viewMonth && selected?.hd === d
          // Disable future dates
          const greg = hijriToGregorian(`${viewYear}/${String(viewMonth).padStart(2,'0')}/${String(d).padStart(2,'0')}`)
          const isFuture = (maxToday && greg) ? new Date(greg + 'T00:00:00') > new Date() : false
          return (
            <button
              key={d}
              disabled={isFuture}
              onClick={() => onSelect(viewYear, viewMonth, d)}
              style={{
                padding: '6px 2px', borderRadius: 7, border: 'none', cursor: isFuture ? 'not-allowed' : 'pointer',
                background: isSelected ? 'var(--blue)' : 'rgba(255,255,255,0.04)',
                color: isSelected ? 'white' : isFuture ? 'var(--muted)' : 'var(--text)',
                fontSize: 12, fontWeight: isSelected ? 700 : 400,
                transition: 'all 0.1s',
                outline: 'none',
                opacity: isFuture ? 0.35 : 1,
              }}
              onMouseEnter={e => { if (!isSelected && !isFuture) (e.target as HTMLElement).style.background = 'rgba(26,92,255,0.2)' }}
              onMouseLeave={e => { if (!isSelected && !isFuture) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
            >
              {d}
            </button>
          )
        })}
      </div>

      {/* Today shortcut */}
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <button
          onClick={() => { setViewYear(cy); setViewMonth(cm) }}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          Today: {currentHijri}
        </button>
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
  color: 'var(--text)', fontSize: 18, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, fontFamily: 'inherit',
}

function DateOfBirthField({ value, onChange, error, label = 'Date of Birth', maxToday = true, note }: {
  value: string; onChange: (v: string) => void; error?: string
  label?: string; maxToday?: boolean; note?: string
}) {
  const [useHijri, setUseHijri]       = React.useState(false)
  const [showCalendar, setShowCalendar] = React.useState(false)

  // Parse currently selected date into Hijri parts
  const selectedHijri = React.useMemo(() => {
    if (!value) return null
    const h = gregorianToHijri(value)
    if (!h) return null
    const [hy, hm, hd] = h.split('/').map(Number)
    return { hy, hm, hd }
  }, [value])

  const hijriDisplay = selectedHijri
    ? `${selectedHijri.hy}/${String(selectedHijri.hm).padStart(2,'0')}/${String(selectedHijri.hd).padStart(2,'0')}`
    : ''

  const handleHijriSelect = (hy: number, hm: number, hd: number) => {
    const greg = hijriToGregorian(`${hy}/${String(hm).padStart(2,'0')}/${String(hd).padStart(2,'0')}`)
    if (greg) { onChange(greg); setShowCalendar(false) }
  }

  const handleToggle = () => {
    setUseHijri(h => !h)
    setShowCalendar(false)
  }

  // Validation
  const gregError = React.useMemo(() => {
    if (!value) return ''
    const d = new Date(value)
    const now = new Date()
    if (d > now) return 'Date of birth cannot be in the future'
    const age = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (age > 120) return 'Please enter a valid date of birth'
    return ''
  }, [value])

  const displayError = error || gregError

  return (
    <div className={`wf${displayError ? ' has-error' : ''}`}>
      {/* Label + toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
          {label}
        </label>
        <button
          type="button"
          onClick={handleToggle}
          style={{
            background: useHijri ? 'rgba(0,200,255,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${useHijri ? 'rgba(0,200,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 99, padding: '3px 10px', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
            color: useHijri ? 'var(--accent)' : 'var(--muted)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <span style={{ fontSize: 13 }}>🌙</span>
          {useHijri ? 'Hijri' : 'Gregorian'}
        </button>
      </div>

      {/* ── Gregorian mode ── */}
      {!useHijri && (
        <div>
          <input
            type="date"
            value={value}
            max={maxToday ? new Date().toISOString().split('T')[0] : '2100-12-31'}
            min="1900-01-01"
            onChange={e => onChange(e.target.value)}
          />
          {value && hijriDisplay && !gregError && (
            <div style={{
              marginTop: 6, padding: '5px 10px', borderRadius: 8,
              background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.1)',
              fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center',
            }}>
              <span>🌙</span>
              <span>
                {selectedHijri
                  ? `${selectedHijri.hd} ${HIJRI_MONTHS[selectedHijri.hm - 1]} ${selectedHijri.hy} AH`
                  : hijriDisplay}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Hijri mode ── */}
      {useHijri && (
        <div>
          {/* Trigger button — shows selected date or placeholder */}
          <button
            type="button"
            onClick={() => setShowCalendar(c => !c)}
            style={{
              width: '100%', textAlign: 'left', padding: '13px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${showCalendar ? 'var(--blue2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 10, color: value ? 'var(--text)' : 'var(--muted)',
              fontFamily: "'DM Mono', monospace", fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: showCalendar ? '0 0 0 3px rgba(26,92,255,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <span>
              {value && hijriDisplay
                ? `${hijriDisplay}  —  ${selectedHijri ? HIJRI_MONTHS[selectedHijri.hm - 1] : ''} ${selectedHijri?.hy ?? ''} AH`
                : 'Select Hijri date'}
            </span>
            <span style={{ fontSize: 16, color: 'var(--muted)' }}>{showCalendar ? '▲' : '▼'}</span>
          </button>

          {/* Calendar dropdown */}
          {showCalendar && (
            <HijriCalendar
              selected={selectedHijri}
              onSelect={handleHijriSelect}
              maxToday={maxToday}
            />
          )}

          {/* Gregorian equivalent */}
          {value && hijriDisplay && !gregError && (
            <div style={{
              marginTop: 6, padding: '5px 10px', borderRadius: 8,
              background: 'rgba(0,204,136,0.05)', border: '1px solid rgba(0,204,136,0.15)',
              fontSize: 11, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'center',
            }}>
              <span>📅</span>
              <span>
                {new Date(value + 'T00:00:00').toLocaleDateString('en-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      )}

      {displayError && <span className="err">{displayError}</span>}
      {note && !displayError && <span className="wf-note">{note}</span>}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<Dir>(1)
  const [data, setData] = useState<WizData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof WizData, string>>>({})
  const [animKey, setAnimKey] = useState(0)
  const [refNum] = useState(() => 'KYC-2025-' + Math.floor(Math.random() * 900000 + 100000))

  // Step-specific states
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [addressState, setAddressState] = useState<'idle' | 'fetching' | 'done'>('idle')
  const [submitting, setSubmitting] = useState(false)

  const set = (field: keyof WizData) => (val: string | boolean) =>
    setData(prev => ({ ...prev, [field]: val }))

  // Clear a specific field error when user changes the value
  const clearError = (field: keyof WizData) =>
    setErrors(prev => { const e = { ...prev }; delete e[field]; return e })

  const setTaxCountries = (fn: (prev: TaxCountry[]) => TaxCountry[]) =>
    setData(prev => ({ ...prev, taxCountries: fn(prev.taxCountries) }))

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  // ── Validation ──
  function validate(): boolean {
    const e: Partial<Record<keyof WizData, string>> = {}

    if (step === 0) {
      // Saudi ID standard format validation
      // NIN (Saudi citizens): starts with 1
      // Iqama (Residents):    starts with 2
      if (!data.iqama) {
        e.iqama = 'ID number is required'
      } else if (!/^\d{10}$/.test(data.iqama)) {
        e.iqama = 'ID must be exactly 10 digits — numbers only'
      } else if (!['1','2'].includes(data.iqama[0])) {
        e.iqama = `ID must start with 1 (Saudi NIN) or 2 (Iqama/Resident) — got "${data.iqama[0]}"`
      }
      if (!data.fullName) e.fullName = 'Full name is required'
      // DOB validation — must be provided, in the past, age 18–120
      if (!data.dob) {
        e.dob = 'Date of birth is required'
      } else {
        const dob = new Date(data.dob)
        const now = new Date()
        if (dob > now) {
          e.dob = 'Date of birth cannot be in the future'
        } else {
          const age = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          if (age < 18) e.dob = 'Applicant must be at least 18 years old'
          else if (age > 120) e.dob = 'Please enter a valid date of birth'
        }
      }
      if (!data.gender) e.gender = 'Gender is required'
      if (!data.maritalStatus) e.maritalStatus = 'Marital status is required'
      if (!data.nationality) e.nationality = 'Nationality is required'
      if (!data.cob) e.cob = 'Country of birth is required'
      if (!data.cityob) e.cityob = 'City of birth is required'
      if (!data.regionob) e.regionob = 'Region of birth is required'
    }
    if (step === 1) {
      if (!data.empStatus) e.empStatus = 'Please select your employment status'
      if (data.empStatus === 'private' && !data.employer) e.employer = 'Employer name is required'
      if (data.empStatus === 'military' && !data.employer) e.employer = 'Organisation name is required'
      if (data.empStatus === 'government' && !data.govtSector) e.govtSector = 'Government sector is required'
      if (['private', 'government', 'military', 'self'].includes(data.empStatus) && !data.profession) e.profession = 'Profession is required'
      // Joining date: must be after DOB and not equal to DOB
      if (['private', 'government', 'military'].includes(data.empStatus) && data.joinDate) {
        const jd = new Date(data.joinDate)
        if (isNaN(jd.getTime())) {
          e.joinDate = 'Please enter a valid joining date'
        } else if (data.dob) {
          const dob = new Date(data.dob)
          if (jd <= dob) e.joinDate = 'Joining date must be after your date of birth'
          else if (jd > new Date()) e.joinDate = 'Joining date cannot be in the future'
        }
      }
      // education only required for employed/professional statuses
      const educationRequired = ['private', 'government', 'military', 'self'].includes(data.empStatus)
      if (educationRequired && !data.education) e.education = 'Education level is required'
    }
    if (step === 2) {
      // Housewife/Student/Unemployed must have 'Others' as income source
      const nonSalariedStatuses = ['housewife', 'student', 'unemployed']
      if (nonSalariedStatuses.includes(data.empStatus)) {
        if (data.incomeSource !== 'Other') e.incomeSource = 'Must be "Other" for your employment status'
      } else {
        if (!data.incomeSource) e.incomeSource = 'Required'
      }
      // Income range cap: Housewife/Student/Unemployed cannot exceed 10K SAR
      const cappedRanges = ['10,000 – 20,000','20,000 – 35,000','35,000 – 50,000','More than 50,000']
      if (nonSalariedStatuses.includes(data.empStatus) && cappedRanges.includes(data.incomeRange)) {
        e.incomeRange = 'Income range cannot exceed SAR 10,000 for your employment status'
      } else if (!data.incomeRange) {
        e.incomeRange = 'Required'
      }
      if (!data.purpose) e.purpose = 'Required'
      if (!data.currency) e.currency = 'Required'
      if (!data.depCount) e.depCount = 'Required'
      if (!data.depAmount) e.depAmount = 'Required'
      if (!data.wdwCount) e.wdwCount = 'Required'
      if (!data.wdwAmount) e.wdwAmount = 'Required'
    }
    if (step === 3) {
      // Saudi mobile validation: +966 5X XXX XXXX
      // Accept: 05XXXXXXXX (10 digits) or +9665XXXXXXXX or 9665XXXXXXXX
      const rawMobile = data.mobile.replace(/\s/g, '')
      if (!rawMobile) {
        e.mobile = 'Mobile number is required'
      } else {
        // Normalise to digits only then check
        const digitsOnly = rawMobile.replace(/[^\d]/g, '')
        const localPattern  = /^05\d{8}$/          // 05XXXXXXXX
        const fullPattern   = /^9665\d{8}$/         // 9665XXXXXXXX
        const plusPattern   = /^\+9665\d{8}$/       // +9665XXXXXXXX
        if (!localPattern.test(rawMobile) && !fullPattern.test(digitsOnly) && !plusPattern.test(rawMobile)) {
          e.mobile = 'Enter a valid Saudi mobile: 05XXXXXXXX or +9665XXXXXXXX'
        }
      }
    }
    if (step === 5) {
      if (addressState !== 'done') {
        e.building = 'Please click "Fetch My National Address" before continuing'
      } else {
        if (!data.building) e.building = 'Building number is required'
        if (!data.street) e.street = 'Street is required'
        if (!data.district) e.district = 'District is required'
        if (!data.city) e.city = 'City is required'
        if (!data.postal) e.postal = 'Postal code is required'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Navigation ──
  const goNext = async () => {
    if (!validate()) return
    if (step === STEPS.length - 1) {
      setSubmitting(true)
      try {
        const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://iotakyc.onrender.com'

        // 1. Create session
        const sessionRes = await fetch(`${API}/kyc/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ iqama: data.iqama, user_id: `user-${data.iqama}` }),
        })
        if (!sessionRes.ok) {
          const err = await sessionRes.text()
          throw new Error(`Session creation failed (${sessionRes.status}): ${err}`)
        }
        const session = await sessionRes.json()
        const sid = session.id
        if (!sid) throw new Error('Backend returned no session ID — check backend logs')

        // 2. Save step 1 — Personal Info
        await fetch(`${API}/kyc/session/${sid}/step/1`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            iqama: data.iqama,
            full_name: data.fullName,
            date_of_birth: data.dob,
            nationality: data.nationality,
            other_nationality: data.otherNat,
            country_of_birth: data.cob,
            city_of_birth: data.cityob,
            region_of_birth: data.regionob,
            gender: data.gender,
            marital_status: data.maritalStatus,
          }),
        })

        // 3. Save step 2 — Employment
        await fetch(`${API}/kyc/session/${sid}/step/2`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employment_status: data.empStatus,
            employer_name: data.employer,
            government_sector: data.govtSector,
            profession: data.profession,
            joining_date: data.joinDate,
            education: data.education,
          }),
        })

        // 4. Save step 3 — Financial
        await fetch(`${API}/kyc/session/${sid}/step/3`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primary_source_of_income: data.incomeSource,
            income_range: data.incomeRange,
            other_source_of_income: data.otherSource,
            additional_income_source: data.addSource,
            additional_monthly_income_range: data.addRange,
            purpose_of_account: data.purpose,
            account_currency: data.currency,
            expected_monthly_deposit_count: data.depCount,
            expected_monthly_deposit_amount: data.depAmount,
            expected_monthly_withdrawal_count: data.wdwCount,
            expected_monthly_withdrawal_amount: data.wdwAmount,
          }),
        })

        // 5. Save step 4 — Contact & Additional
        await fetch(`${API}/kyc/session/${sid}/step/4`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mobile_number: data.mobile,
            home_phone: data.homePhone,
            has_residence_outside_ksa: data.hasResidence,
            residence_country: data.resCountry,
            residence_postal: data.resPostal,
            residence_street: data.resStreet,
            residence_city: data.resCity,
            residence_district: data.resDistrict,
            residence_unit: data.resUnit,
            residence_po_box: data.resPobox,
            home_contact: data.homeContact,
            has_immigrant_visa: data.hasVisa,
            visa_country: data.visaCountry,
            visa_type: data.visaType,
            additional_contact: data.addContact,
          }),
        })

        // 6. Save step 5 — FATCA / CRS
        await fetch(`${API}/kyc/session/${sid}/step/5`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tax_resident_outside_ksa: data.taxResident,
            tax_countries: data.taxCountries,
            us_person: data.usPerson,
            ssn_itin_atin: data.ssn,
            is_pep: data.isPep,
            pep_relationship: data.pepRel,
            pep_declaration_note: data.pepNote,
          }),
        })

        // 7. Save step 6 — National Address
        await fetch(`${API}/kyc/session/${sid}/step/6`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            building_number: data.building,
            street: data.street,
            district: data.district,
            city: data.city,
            postal_code: data.postal,
            additional_number: data.addNum,
            unit_number: data.unit,
            po_box: data.pobox,
          }),
        })

        // 8. Final submit — triggers ELMNatheer watchlist check server-side
        const submitRes = await fetch(`${API}/kyc/session/${sid}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!submitRes.ok) {
          const err = await submitRes.text()
          throw new Error(`Final submit failed (${submitRes.status}): ${err}`)
        }

      } catch (err: any) {
        console.error('KYC submit failed:', err)
        setSubmitting(false)
        setErrors({ iqama: `Submission failed: ${err.message ?? 'Cannot reach backend. Is it running?'}` })
        setStep(0) // Send back to step 1 to show the error visibly
        return
      }
      setSubmitting(false)
      setScreen('success')
      return
    }
    setDir(1)
    setAnimKey(k => k + 1)
    setErrors({})
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (step === 0) return
    setDir(-1)
    setAnimKey(k => k + 1)
    setErrors({})
    setStep(s => s - 1)
  }

  // ── Employer verify (mock TKML) ──
  const verifyEmployer = async () => {
    if (!data.employer) return
    setVerifying(true)
    await sleep(1300)
    setVerified(true)
    setVerifying(false)
  }

  // ── Address fetch (mock SPOST) ──
  const fetchAddress = async () => {
    setAddressState('fetching')
    await sleep(1700)
    const mock = { building: '8470', street: 'Ibrahim Al Baqai', district: 'Al Shifa', city: 'Riyadh', postal: '47919', addNum: '3337', unit: '8' }
    setData(prev => ({ ...prev, ...mock }))
    setAddressState('done')
    setErrors(e => ({ ...e, building: undefined }))
  }

  const animClass = dir === 1 ? 'slide-in-right' : 'slide-in-left'

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="wizard-screen">
        <div className="wiz-topbar">
          <div className="wiz-brand"><div className="wiz-brand-dot" />IOTA KYC</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Customer Onboarding</div>
        </div>
        <div className="intro-wrap">
          <div className="intro-card">
            <div className="intro-logo">🏦</div>
            <h1 className="intro-title">Begin Your KYC<br />Application</h1>
            <p className="intro-sub">Complete your identity verification in about 10 minutes. We'll automatically fetch most of your details from government systems.</p>
            <div className="intro-features">
              <div className="intro-feature">
                <div className="intro-feature-icon" style={{ background: 'rgba(0,204,136,0.1)', color: 'var(--green)' }}>🔒</div>
                <div className="intro-feature-text">
                  <strong>Bank-grade Encryption</strong>
                  <span>All data encrypted in transit and at rest using AES-256</span>
                </div>
              </div>
              <div className="intro-feature">
                <div className="intro-feature-icon" style={{ background: 'rgba(0,200,255,0.1)', color: 'var(--accent)' }}>🏛️</div>
                <div className="intro-feature-text">
                  <strong>Government Verified</strong>
                  <span>Connected to SPOST, TKML, and ELMNatheer APIs</span>
                </div>
              </div>
              <div className="intro-feature">
                <div className="intro-feature-icon" style={{ background: 'rgba(26,92,255,0.1)', color: 'var(--blue2)' }}>⚡</div>
                <div className="intro-feature-text">
                  <strong>Auto-filled Where Possible</strong>
                  <span>Address and employer details fetched automatically</span>
                </div>
              </div>
            </div>
            <button className="btn-start" onClick={() => setScreen('wizard')}>Start Application →</button>
            <p className="intro-note">Your progress is saved automatically at every step.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (screen === 'success') {
    return (
      <div className="wizard-screen">
        <div className="wiz-topbar">
          <div className="wiz-brand"><div className="wiz-brand-dot" />IOTA KYC</div>
        </div>
        <div className="success-wrap">
          <div className="success-card">
            <div className="success-icon">
              <svg viewBox="0 0 90 90" fill="none">
                <circle className="s-circle" cx="45" cy="45" r="40" stroke="#00CC88" strokeWidth="3" strokeLinecap="round" />
                <path className="s-check" d="M27 45 L39 57 L63 33" stroke="#00CC88" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="success-title">Application Submitted</h2>
            <p className="success-sub">Your KYC application has been received. Our compliance team will review it within <strong style={{ color: 'var(--text)' }}>2 business days</strong>.</p>
            <div className="success-ref">
              <div className="success-ref-label">Reference Number</div>
              <div className="success-ref-num">{refNum}</div>
            </div>
            <button className="btn-new-app" onClick={() => { setScreen('intro'); setStep(0); setData(INITIAL); setVerified(false); setAddressState('idle') }}>
              Start New Application
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── WIZARD SHELL ───────────────────────────────────────────────────────────
  const pct = ((step + 1) / STEPS.length) * 100

  return (
    <div className="wizard-screen">
      {/* Topbar */}
      <div className="wiz-topbar">
        <div className="wiz-brand"><div className="wiz-brand-dot" />IOTA KYC</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Step {step + 1} of {STEPS.length}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
          Auto-saved
        </div>
      </div>

      {/* Progress */}
      <div className="wiz-progress-wrap">
        <div className="wiz-progress-bar">
          <div className="wiz-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="wiz-step-info">
          <div className="wiz-step-label">{STEPS[step]}</div>
          <div className="wiz-step-count">{step + 1} / {STEPS.length}</div>
        </div>
      </div>

      {/* Step content */}
      <div className="wiz-body">
        <div key={animKey} className={animClass} style={{ display: 'contents' }}>
          {step === 0 && <Step1 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} clearError={clearError} />}
          {step === 1 && <Step2 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} verifying={verifying} verified={verified} onVerify={verifyEmployer} clearError={clearError} />}
          {step === 2 && <Step3 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} />}
          {step === 3 && <Step4 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} />}
          {step === 4 && <Step5 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} setTaxCountries={setTaxCountries} />}
          {step === 5 && <Step6 data={data} set={set} errors={errors} onBack={goBack} onNext={goNext} addressState={addressState} onFetch={fetchAddress} submitting={submitting} />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — PERSONAL INFO
// ═══════════════════════════════════════════════════════════════════════════════
function Step1({ data, set, errors, onBack, onNext, clearError }: any) {
  return (
    <>
      <div className="wiz-left">
        <h2 className="wiz-title">Personal Information</h2>
        <p className="wiz-sub">Enter your Iqama number and verify your identity details. Fields will be auto-filled where possible.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          <WField
            label="Iqama / National ID Number"
            error={errors.iqama}
            note={
              data.iqama.startsWith('1') && data.iqama.length === 10
                ? '🟢 Saudi National ID (NIN) — starts with 1'
                : data.iqama.startsWith('2') && data.iqama.length === 10
                ? '🟡 Iqama / Resident ID — starts with 2'
                : data.iqama.length > 0 && !['1','2'].includes(data.iqama[0])
                ? '🔴 Invalid — must start with 1 (NIN) or 2 (Iqama)'
                : 'Saudi NIN starts with 1 · Iqama starts with 2 · 10 digits'
            }
          >
            <input type="text" inputMode="numeric" maxLength={10}
              placeholder="10-digit ID number (1xxxxxxxxx or 2xxxxxxxxx)"
              value={data.iqama} onChange={e => { set('iqama')(e.target.value); clearError('iqama') }} />
          </WField>
          <div className="wf-row">
            <WField label="Full Name (as on ID)" error={errors.fullName}>
              <input type="text" placeholder="Full legal name" value={data.fullName} onChange={e => { set('fullName')(e.target.value); clearError('fullName') }} />
            </WField>
            <DateOfBirthField
              value={data.dob}
              onChange={v => { set('dob')(v); clearError('dob') }}
              error={errors.dob}
            />
          </div>
          <div className="wf-row">
            <WField label="Gender" error={errors.gender}>
              <select value={data.gender} onChange={e => {
                set('gender')(e.target.value)
                // If gender changes to Male and empStatus is housewife, clear it
                if (e.target.value === 'male' && data.empStatus === 'housewife') {
                  set('empStatus')(''); set('incomeSource')('')
                }
              }}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </WField>
            <WField label="Marital Status" error={errors.maritalStatus}>
              <select value={data.maritalStatus} onChange={e => { set('maritalStatus')(e.target.value); clearError('maritalStatus') }}>
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </WField>
          </div>
          <div className="wf-row">
            <WField label="Nationality" error={errors.nationality}>
              <select value={data.nationality} onChange={e => {
                set('nationality')(e.target.value)
                // Clear other nationality when Saudi is selected
                if (e.target.value === 'sa') set('otherNat')('')
              }}>
                <option value="">Select nationality</option>
                <option value="sa">Saudi Arabian</option>
                <option value="other">Other</option>
              </select>
            </WField>
            <WField
              label="Other Nationality (if any)"
              note={data.nationality === 'sa' ? 'Not applicable for Saudi nationals' : undefined}
            >
              <select
                value={data.nationality === 'sa' ? '' : data.otherNat}
                onChange={e => set('otherNat')(e.target.value)}
                disabled={data.nationality === 'sa'}
                style={{ opacity: data.nationality === 'sa' ? 0.4 : 1, cursor: data.nationality === 'sa' ? 'not-allowed' : 'auto' }}
              >
                <option value="">None</option>
                <option>American</option><option>British</option><option>Egyptian</option>
                <option>Indian</option><option>Pakistani</option><option>Other</option>
              </select>
            </WField>
          </div>
          <div className="wf-row">
            <WField label="Country of Birth" error={errors.cob}>
              <input type="text" placeholder="e.g. Saudi Arabia" value={data.cob} onChange={e => set('cob')(e.target.value)} />
            </WField>
            <WField label="City of Birth" error={errors.cityob}>
              <input type="text" placeholder="e.g. Riyadh" value={data.cityob} onChange={e => set('cityob')(e.target.value)} />
            </WField>
          </div>
          <WField label="Region of Birth" error={errors.regionob}>
            <select value={data.regionob} onChange={e => set('regionob')(e.target.value)}>
              <option value="">Select region</option>
              {['Riyadh Region','Makkah Region','Madinah Region','Eastern Province','Asir Region','Tabuk Region','Hail Region','Northern Borders','Jazan Region','Najran Region','Al-Baha Region','Al-Jawf Region','Qassim Region','Outside KSA'].map(r => <option key={r}>{r}</option>)}
            </select>
          </WField>
        </div>
        <BtnRow onBack={onBack} onNext={onNext} isFirst />
      </div>
      <div className="wiz-right">
        <RightPanel title="About this step" text="We collect basic identity information verified against government records. Your full name and date of birth are matched against your Iqama." items={[
          { icon: '🪪', html: '<strong>Iqama / NIN</strong> — your 10-digit national identity number' },
          { icon: '🌍', html: '<strong>Country & city of birth</strong> — used for identity matching' },
          { icon: '🛡️', html: 'All fields are encrypted and never shared without your consent' },
        ]} />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — EMPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════════
function Step2({ data, set, errors, onBack, onNext, verifying, verified, onVerify, clearError }: any) {
  const showEmployer   = ['private', 'military'].includes(data.empStatus)
  const showGovSector  = data.empStatus === 'government'
  const showProfession = ['private', 'government', 'military', 'self'].includes(data.empStatus)
  const showJoinDate   = ['private', 'government', 'military'].includes(data.empStatus)
  const showEducation  = ['private', 'government', 'military', 'self'].includes(data.empStatus)
  const hasStatus = !!data.empStatus

  return (
    <>
      <div className="wiz-left" style={{ overflowY: 'auto' }}>
        <h2 className="wiz-title">Employment Status</h2>
        <p className="wiz-sub">Select your current employment status. Additional fields appear based on your selection.</p>

        <div className="emp-grid">
          {EMP_OPTIONS.filter(opt => !(opt.val === 'housewife' && data.gender === 'male')).map(opt => (
            <div key={opt.val}
              className={`emp-card${data.empStatus === opt.val ? ' selected' : ''}`}
              onClick={() => {
                set('empStatus')(opt.val)
                set('employer')('')
                set('govtSector')('')
                set('education')('')
                // Auto-default Primary Source of Income based on employment
                const salariedStatuses = ['private', 'government', 'military', 'self', 'household']
                const nonSalariedStatuses = ['housewife', 'student', 'unemployed']
                if (salariedStatuses.includes(opt.val)) {
                  set('incomeSource')('Salary')
                  set('incomeRange')('')
                } else if (nonSalariedStatuses.includes(opt.val)) {
                  set('incomeSource')('Other')
                  set('incomeRange')('')
                } else {
                  set('incomeSource')('')
                  set('incomeRange')('')
                }
              }}>
              <div className="emp-card-label">{opt.label}</div>
              <div className="emp-card-ar">{opt.ar}</div>
            </div>
          ))}
        </div>
        {errors.empStatus && <p style={{ color: 'var(--red)', fontSize: 12, margin: '8px 0' }}>{errors.empStatus}</p>}

        {/* Extra fields — rendered directly, no CSS transition hiding them */}
        {hasStatus && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20, paddingBottom: 8 }}>
            {showGovSector && (
              <WField label="Government Sector / Ministry" error={errors.govtSector}>
                <select value={data.govtSector} onChange={e => set('govtSector')(e.target.value)}>
                  <option value="">Select sector</option>
                  {GOVT_SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </WField>
            )}
            {showEmployer && (
              <WField label="Employer Name" error={errors.employer}>
                <div className="verify-row">
                  <input type="text" placeholder="Type employer name"
                    value={data.employer} onChange={e => set('employer')(e.target.value)} />
                  <button className="btn-verify" onClick={onVerify} disabled={verifying}>
                    {verifying ? '...' : verified ? 'Verified ✓' : 'Verify'}
                  </button>
                </div>
                {verified && (
                  <div className="verify-ok">✓ Establishment verified and active (Mock: قائمة)</div>
                )}
              </WField>
            )}
            {showProfession && (
              <div className="wf-row">
                <WField label="Profession" error={errors.profession}>
                  <input type="text" placeholder="Your profession"
                    value={data.profession} onChange={e => set('profession')(e.target.value)} />
                </WField>
                {showJoinDate && (
                  <DateOfBirthField
                    label="Joining Date"
                    value={data.joinDate}
                    onChange={v => { set('joinDate')(v); clearError('joinDate') }}
                    maxToday={false}
                    note="Date you joined your current employer"
                  />
                )}
              </div>
            )}
            {showEducation && (
              <WField label="Education Level" error={errors.education}>
                <select value={data.education} onChange={e => set('education')(e.target.value)}>
                  <option value="">Select education level</option>
                  {['Below Secondary','Secondary (High School)','Diploma',"Bachelor's Degree","Master's Degree",'PhD / Doctorate'].map(l => <option key={l}>{l}</option>)}
                </select>
              </WField>
            )}
          </div>
        )}

        <BtnRow onBack={onBack} onNext={onNext} backLabel="← Personal Info" />
      </div>
      <div className="wiz-right">
        <RightPanel apiName="TKML" apiState={verified ? 'done' : verifying ? 'fetching' : 'idle'}
          title="Employer Verification"
          text="If employed, your employer's establishment status is verified via the TKML government API, confirming it is an active registered entity."
          items={[
            { icon: '🏢', html: '<strong>Private / Government / Military</strong> — each has specific required fields' },
            { icon: '✅', html: 'Employer name verified against Ministry of HR database' },
            { icon: '⏱️', html: 'Verification takes 2–3 seconds automatically' },
          ]} />
      </div>
    </>
  )
}

function Step3({ data, set, errors, onBack, onNext }: any) {
  return (
    <>
      <div className="wiz-left">
        <h2 className="wiz-title">Financial Information</h2>
        <p className="wiz-sub">Required by SAMA regulations. Helps configure your account correctly and monitor for unusual activity.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <div className="wf-row">
            <WField
              label="Primary Source of Income"
              error={errors.incomeSource}
              note={['housewife','student','unemployed'].includes(data.empStatus) ? 'Fixed as "Other" for your employment status' : undefined}
            >
              <select
                value={data.incomeSource}
                onChange={e => set('incomeSource')(e.target.value)}
                disabled={['housewife','student','unemployed'].includes(data.empStatus)}
                style={{ opacity: ['housewife','student','unemployed'].includes(data.empStatus) ? 0.6 : 1 }}
              >
                <option value="">Select source</option>
                {['Salary','Business','Investments','Pension / Retirement','Inheritance','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </WField>
            <WField
              label="Income Range (SAR / month)"
              error={errors.incomeRange}
              note={['housewife','student','unemployed'].includes(data.empStatus) ? 'Capped at SAR 10,000 for your employment status' : undefined}
            >
              <select value={data.incomeRange} onChange={e => set('incomeRange')(e.target.value)}>
                <option value="">Select range</option>
                {(['Less than 5,000','5,000 – 10,000','10,000 – 20,000','20,000 – 35,000','35,000 – 50,000','More than 50,000'] as const)
                  .filter(r => !(['housewife','student','unemployed'].includes(data.empStatus)) || ['Less than 5,000','5,000 – 10,000'].includes(r))
                  .map(r => <option key={r}>{r}</option>)}
              </select>
            </WField>
          </div>
          <WField label="Other Source of Income (if any)">
            <select value={data.otherSource} onChange={e => set('otherSource')(e.target.value)}>
              <option value="">None</option>
              {['Rental Income','Freelancing','Investment Returns','Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </WField>
          {data.otherSource && data.otherSource !== 'None' && (
            <div className="wf-row extra-block">
              <WField label="Additional Source Description">
                <input type="text" placeholder="Describe source" value={data.addSource} onChange={e => set('addSource')(e.target.value)} />
              </WField>
              <WField label="Additional Monthly Range">
                <select value={data.addRange} onChange={e => set('addRange')(e.target.value)}>
                  <option value="">Select range</option>
                  {['Less than 2,000','2,000 – 5,000','5,000 – 10,000','More than 10,000'].map(r => <option key={r}>{r}</option>)}
                </select>
              </WField>
            </div>
          )}
          <div className="wf-row">
            <WField label="Purpose of Account" error={errors.purpose}>
              <select value={data.purpose} onChange={e => set('purpose')(e.target.value)}>
                <option value="">Select purpose</option>
                {['Salary Deposit','Savings','Business Transactions','Investments','Personal Use','Other'].map(p => <option key={p}>{p}</option>)}
              </select>
            </WField>
            <WField label="Account Currency" error={errors.currency}>
              <select value={data.currency} onChange={e => set('currency')(e.target.value)}>
                <option value="">Select currency</option>
                <option value="SAR">SAR — Saudi Riyal</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </WField>
          </div>
          <div className="wf-row">
            <WField label="Expected Monthly Deposits" error={errors.depCount}>
              <select value={data.depCount} onChange={e => set('depCount')(e.target.value)}>
                <option value="">Number of deposits</option>
                {['1 – 3','4 – 10','11 – 20','More than 20'].map(c => <option key={c}>{c}</option>)}
              </select>
            </WField>
            <WField label="Expected Deposit Amount (SAR)" error={errors.depAmount}>
              <select value={data.depAmount} onChange={e => set('depAmount')(e.target.value)}>
                <option value="">Amount range</option>
                {['Less than 10,000','10,000 – 50,000','50,000 – 200,000','More than 200,000'].map(a => <option key={a}>{a}</option>)}
              </select>
            </WField>
          </div>
          <div className="wf-row">
            <WField label="Expected Monthly Withdrawals" error={errors.wdwCount}>
              <select value={data.wdwCount} onChange={e => set('wdwCount')(e.target.value)}>
                <option value="">Number of withdrawals</option>
                {['1 – 3','4 – 10','11 – 20','More than 20'].map(c => <option key={c}>{c}</option>)}
              </select>
            </WField>
            <WField label="Expected Withdrawal Amount (SAR)" error={errors.wdwAmount}>
              <select value={data.wdwAmount} onChange={e => set('wdwAmount')(e.target.value)}>
                <option value="">Amount range</option>
                {['Less than 10,000','10,000 – 50,000','50,000 – 200,000','More than 200,000'].map(a => <option key={a}>{a}</option>)}
              </select>
            </WField>
          </div>
        </div>
        <BtnRow onBack={onBack} onNext={onNext} backLabel="← Employment" />
      </div>
      <div className="wiz-right">
        <RightPanel title="Why we need this" text="Financial profiling is required by SAMA regulations for all new bank accounts. This classifies your account type and applies correct transaction limits."
          items={[
            { icon: '💰', html: '<strong>Income range</strong> — determines account tier and limits' },
            { icon: '📊', html: '<strong>Monthly estimates</strong> help detect unusual activity' },
            { icon: '🏦', html: 'This data is used solely for compliance — not credit scoring' },
          ]} />
      </div>
    </>
  )
}

// ── SaudiMobileField — +966 prefix + validated remaining digits ───────────────
function SaudiMobileField({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  // Convert stored value (+9665XXXXXXXX) → local display (05XXXXXXXX)
  const toLocal = (v: string) => {
    const s = v.replace(/\s/g, '')
    if (s.startsWith('+9665')) return '0' + s.slice(4)   // +9665X → 05X
    if (s.startsWith('9665'))  return '0' + s.slice(3)   // 9665X  → 05X
    if (s.startsWith('+966'))  return s.slice(4)          // +966 with no 5 yet
    if (s.startsWith('966'))   return s.slice(3)
    return s
  }

  const [local, setLocal] = React.useState(() => toLocal(value))

  React.useEffect(() => { setLocal(toLocal(value)) }, [value])

  const handleChange = (raw: string) => {
    let digits = raw.replace(/[^\d]/g, '')
    // Handle paste of full international number
    if (digits.startsWith('00966')) digits = '0' + digits.slice(5)
    else if (digits.startsWith('9665')) digits = '0' + digits.slice(3)
    else if (digits.startsWith('966')) digits = digits.slice(3)
    // Cap at 10 digits (05XXXXXXXX)
    digits = digits.slice(0, 10)
    setLocal(digits)
    // Store as +966 international — keep leading 0 stripped for intl format
    if (digits.startsWith('05') && digits.length > 1) {
      onChange('+966' + digits.slice(1))  // 05XXXXXXXX → +9665XXXXXXXX
    } else if (digits === '0') {
      onChange('')  // just a leading zero — not complete yet, store empty
    } else if (digits) {
      onChange('+966' + digits)
    } else {
      onChange('')
    }
  }

  const isComplete = /^05\d{8}$/.test(local)
  const isStartWrong = local.length > 1 && !local.startsWith('05')

  const note = isComplete
    ? `✓ +966 ${local.slice(1,3)} ${local.slice(3,6)} ${local.slice(6,9)} ${local.slice(9)}`
    : isStartWrong
    ? '🔴 Saudi mobiles start with 05'
    : local.length > 0
    ? `${local.length} / 10 digits`
    : 'Format: 05XXXXXXXX — stored as +966'

  return (
    <div className={`wf${error ? ' has-error' : ''}`}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.5, textTransform: 'uppercase' as const }}>
        Mobile Number
      </label>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', paddingInline: 12,
          background: 'rgba(26,92,255,0.1)', border: '1.5px solid rgba(26,92,255,0.25)',
          borderRight: 'none', borderRadius: '10px 0 0 10px',
          fontSize: 13, fontWeight: 700, color: 'var(--blue2)',
          fontFamily: "'DM Mono', monospace", flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          🇸🇦 +966
        </div>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="05XXXXXXXX"
          value={local}
          maxLength={10}
          onChange={e => handleChange(e.target.value)}
          style={{ borderRadius: '0 10px 10px 0', flex: 1 }}
        />
      </div>
      <span className="wf-note" style={{ color: isComplete ? 'var(--green)' : isStartWrong ? 'var(--red)' : 'var(--muted)' }}>
        {note}
      </span>
      {error && <span className="err">{error}</span>}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — CONTACT & ADDITIONAL
// ═══════════════════════════════════════════════════════════════════════════════
function Step4({ data, set, errors, onBack, onNext }: any) {
  return (
    <>
      <div className="wiz-left">
        <h2 className="wiz-title">Contact & Additional Info</h2>
        <p className="wiz-sub">Your contact details and any overseas ties. Required for AML/CFT compliance.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <div className="wf-row">
            <SaudiMobileField
              value={data.mobile}
              onChange={v => set('mobile')(v)}
              error={errors.mobile}
            />
            <WField label="Home Phone (optional)">
              <input type="tel" placeholder="Home phone number" value={data.homePhone} onChange={e => set('homePhone')(e.target.value)} />
            </WField>
          </div>

          <Toggle label="Do you have residence outside KSA?" on={data.hasResidence} onToggle={() => set('hasResidence')(!data.hasResidence)} />
          {data.hasResidence && (
            <div className="extra-block" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="wf-row">
                <WField label="Country of Residence"><input type="text" placeholder="e.g. United Kingdom" value={data.resCountry} onChange={e => set('resCountry')(e.target.value)} /></WField>
                <WField label="Postal Code"><input type="text" placeholder="Postal code" value={data.resPostal} onChange={e => set('resPostal')(e.target.value)} /></WField>
              </div>
              <div className="wf-row">
                <WField label="Street"><input type="text" placeholder="Street address" value={data.resStreet} onChange={e => set('resStreet')(e.target.value)} /></WField>
                <WField label="City"><input type="text" placeholder="City" value={data.resCity} onChange={e => set('resCity')(e.target.value)} /></WField>
              </div>
              <div className="wf-row">
                <WField label="Area / District"><input type="text" placeholder="District or area" value={data.resDistrict} onChange={e => set('resDistrict')(e.target.value)} /></WField>
                <WField label="Unit Number (optional)"><input type="text" placeholder="Apartment / unit" value={data.resUnit} onChange={e => set('resUnit')(e.target.value)} /></WField>
              </div>
              <div className="wf-row">
                <WField label="PO Box (optional)"><input type="text" placeholder="PO Box" value={data.resPobox} onChange={e => set('resPobox')(e.target.value)} /></WField>
                <WField label="Contact Number in Home Country"><input type="tel" placeholder="Country code + number" value={data.homeContact} onChange={e => set('homeContact')(e.target.value)} /></WField>
              </div>
            </div>
          )}

          <Toggle label="Do you have an immigrant visa or permanent resident status in a country other than KSA?" on={data.hasVisa} onToggle={() => set('hasVisa')(!data.hasVisa)} />
          {data.hasVisa && (
            <div className="extra-block">
              <div className="wf-row">
                <WField label="Country"><input type="text" placeholder="Country name" value={data.visaCountry} onChange={e => set('visaCountry')(e.target.value)} /></WField>
                <WField label="Visa / Resident Type">
                  <select value={data.visaType} onChange={e => set('visaType')(e.target.value)}>
                    <option value="">Select type</option>
                    {['Immigrant Visa','Permanent Residency (PR)','Green Card','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </WField>
              </div>
            </div>
          )}

          <WField label="Additional Contact Information (optional)">
            <textarea placeholder="Any additional contact details or notes…" value={data.addContact} onChange={e => set('addContact')(e.target.value)} />
          </WField>
        </div>
        <BtnRow onBack={onBack} onNext={onNext} backLabel="← Financial Info" />
      </div>
      <div className="wiz-right">
        <RightPanel title="Additional Information" text="We collect your contact details and check for any overseas ties. Required for AML/CFT compliance under SAMA regulations."
          items={[
            { icon: '📱', html: '<strong>Mobile number</strong> — used for OTP and account alerts' },
            { icon: '🌐', html: '<strong>Overseas residence / visa</strong> — required for AML screening' },
            { icon: '📮', html: 'Home country contact collected if you maintain overseas ties' },
          ]} />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5 — FATCA / CRS
// ═══════════════════════════════════════════════════════════════════════════════
function Step5({ data, set, errors, onBack, onNext, setTaxCountries }: any) {
  const addCountry = () => {
    if (data.taxCountries.length >= 3) return
    setTaxCountries((prev: TaxCountry[]) => [...prev, { country: '', hasTin: false, tinType: '', tin: '', reason: '' }])
  }

  const removeCountry = (i: number) =>
    setTaxCountries((prev: TaxCountry[]) => prev.filter((_: any, idx: number) => idx !== i))

  const updateCountry = (i: number, field: keyof TaxCountry, val: string | boolean) =>
    setTaxCountries((prev: TaxCountry[]) => prev.map((c: TaxCountry, idx: number) => idx === i ? { ...c, [field]: val } : c))

  return (
    <>
      <div className="wiz-left" style={{ overflow: 'auto' }}>
        <h2 className="wiz-title">FATCA / CRS Declaration</h2>
        <p className="wiz-sub">International tax compliance declaration. Required by law for all new accounts.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

          <Toggle label="Are you a registered tax resident of any country outside KSA?" on={data.taxResident}
            onToggle={() => { set('taxResident')(!data.taxResident); if (!data.taxResident && data.taxCountries.length === 0) addCountry() }} />

          {data.taxResident && (
            <div className="extra-block">
              {data.taxCountries.map((tc: TaxCountry, i: number) => (
                <div key={i} className="country-block">
                  <div className="country-block-header">
                    <div className="country-block-title">Tax Country {i + 1}</div>
                    <button className="btn-remove-country" onClick={() => removeCountry(i)}>✕</button>
                  </div>
                  <WField label="Country">
                    <input type="text" placeholder="e.g. United States" value={tc.country} onChange={e => updateCountry(i, 'country', e.target.value)} />
                  </WField>
                  <div style={{ marginTop: 12 }}>
                    <Toggle label="Do you have a Tax Identification Number (TIN)?" on={tc.hasTin} onToggle={() => updateCountry(i, 'hasTin', !tc.hasTin)} />
                  </div>
                  {tc.hasTin ? (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', letterSpacing: 0.5, textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>TIN Type</label>
                        <div className="tin-options">
                          {['SSN', 'ITIN', 'ATIN', 'TIN'].map(t => (
                            <div key={t} className={`tin-option${tc.tinType === t ? ' selected' : ''}`} onClick={() => updateCountry(i, 'tinType', t)}>{t}</div>
                          ))}
                        </div>
                      </div>
                      <WField label="Enter TIN (9 digits)" note="All TINs are 9 digits">
                        <input type="text" placeholder="9-digit TIN" maxLength={9} value={tc.tin} onChange={e => updateCountry(i, 'tin', e.target.value)} />
                      </WField>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12 }}>
                      <WField label="Reason for not having TIN">
                        <textarea placeholder="Enter reason for not having a TIN…" value={tc.reason} onChange={e => updateCountry(i, 'reason', e.target.value)} />
                      </WField>
                    </div>
                  )}
                </div>
              ))}
              {data.taxCountries.length < 3 && (
                <button className="btn-add-country" onClick={addCountry}>+ Add Country (up to 3)</button>
              )}
            </div>
          )}

          <Toggle label="Are you a US person? (citizen, resident, or green card holder)" on={data.usPerson} onToggle={() => set('usPerson')(!data.usPerson)} />
          {data.usPerson && (
            <div className="extra-block">
              <WField label="SSN / ITIN / ATIN" note="Enter your 9-digit US taxpayer identification number">
                <input type="text" placeholder="9-digit US taxpayer ID" maxLength={9} value={data.ssn} onChange={e => set('ssn')(e.target.value)} />
              </WField>
            </div>
          )}

          <Toggle label="Are you, or are you related to, a Politically Exposed Person (PEP)?" on={data.isPep} onToggle={() => set('isPep')(!data.isPep)} />
          {data.isPep && (
            <div className="extra-block" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <WField label="Relationship with PEP">
                <select value={data.pepRel} onChange={e => set('pepRel')(e.target.value)}>
                  <option value="">Select relationship</option>
                  {['Self','Spouse','Child','Parent','Sibling','Close Associate','Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </WField>
              <WField label="Declaration Note">
                <textarea placeholder="Describe your relationship with the PEP and any relevant details…" value={data.pepNote} onChange={e => set('pepNote')(e.target.value)} />
              </WField>
            </div>
          )}
        </div>
        <BtnRow onBack={onBack} onNext={onNext} backLabel="← Additional Info" />
      </div>
      <div className="wiz-right">
        <RightPanel apiName="ELMNatheer" apiState="idle" title="What is FATCA / CRS?" text="FATCA (US) and CRS (global) are international tax compliance frameworks. Banks are legally required to collect tax residency information for all customers."
          items={[
            { icon: '🇺🇸', html: '<strong>US Persons</strong> must provide SSN, ITIN, or ATIN' },
            { icon: '🌎', html: '<strong>Tax residents</strong> of other countries must provide TIN (up to 3 countries)' },
            { icon: '⚠️', html: '<strong>PEP check</strong> runs automatically via ELMNatheer watchlist API on submission' },
          ]} />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6 — NATIONAL ADDRESS
// ═══════════════════════════════════════════════════════════════════════════════
function Step6({ data, set, errors, onBack, onNext, addressState, onFetch, submitting }: any) {
  return (
    <>
      <div className="wiz-left">
        <h2 className="wiz-title">National Address</h2>
        <p className="wiz-sub">We'll fetch your registered address from Saudi Post using your Iqama. Review and confirm the details.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {addressState === 'idle' && (
            <div>
              <button className="address-fetch-btn" onClick={onFetch}>
                <span>📍</span>
                <span>Fetch My National Address from SPOST</span>
              </button>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>
                Uses your Iqama <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--text2)' }}>{data.iqama || '—'}</span> to query the SPOST API
              </p>
              {errors.building && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{errors.building}</p>}
            </div>
          )}

          {addressState === 'fetching' && (
            <button className="address-fetch-btn" disabled>
              <span className="wiz-spinner" />
              <span>Fetching from SPOST...</span>
            </button>
          )}

          {addressState === 'done' && (
            <div>
              <div className="address-status-ok">✓ Address fetched from SPOST National Address database (Mock)</div>
              <div className="address-grid">
                <WField label="Building Number" error={errors.building}>
                  <input type="text" value={data.building} onChange={e => set('building')(e.target.value)} />
                </WField>
                <WField label="Street Name" error={errors.street}>
                  <input type="text" value={data.street} onChange={e => set('street')(e.target.value)} />
                </WField>
                <WField label="District Name" error={errors.district}>
                  <input type="text" value={data.district} onChange={e => set('district')(e.target.value)} />
                </WField>
                <WField label="City" error={errors.city}>
                  <input type="text" value={data.city} onChange={e => set('city')(e.target.value)} />
                </WField>
                <WField label="Postal Code" error={errors.postal}>
                  <input type="text" value={data.postal} onChange={e => set('postal')(e.target.value)} />
                </WField>
                <WField label="Additional Number">
                  <input type="text" value={data.addNum} onChange={e => set('addNum')(e.target.value)} />
                </WField>
                <WField label="Unit No (Optional)">
                  <input type="text" value={data.unit} onChange={e => set('unit')(e.target.value)} />
                </WField>
                <WField label="PO Box (Optional)">
                  <input type="text" value={data.pobox} onChange={e => set('pobox')(e.target.value)} />
                </WField>
              </div>
            </div>
          )}
        </div>
        <BtnRow onBack={onBack} onNext={onNext} backLabel="← FATCA / CRS" nextLabel="Submit KYC Application" nextLoading={submitting} isLast />
      </div>
      <div className="wiz-right">
        <RightPanel apiName="SPOST" apiState={addressState === 'done' ? 'done' : addressState === 'fetching' ? 'fetching' : 'idle'}
          title="SPOST Address Lookup"
          text="Your registered national address is fetched directly from Saudi Post (SPOST) using your Iqama number — no manual entry required."
          items={[
            { icon: '📍', html: 'Address fetched from the <strong>National Address database</strong>' },
            { icon: '✏️', html: 'You can correct any field if your registered address is outdated' },
            { icon: '🔄', html: 'Changes are flagged for manual verification by the bank' },
          ]} />
      </div>
    </>
  )
}