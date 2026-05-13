'use client'
import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged'

interface AuditEntry { action: string; notes?: string; created_at: string }

interface Submission {
  id: string
  iqama: string
  full_name: string
  nationality: string
  employment_status: string
  employer_name?: string
  government_sector?: string
  profession?: string
  joining_date?: string
  income_range: string
  purpose_of_account: string
  account_currency?: string
  expected_monthly_deposit_amount: string
  expected_monthly_withdrawal_amount: string
  mobile_number: string
  tax_resident_outside_ksa: boolean
  us_person?: boolean
  ssn_itin_atin?: string
  is_pep: boolean
  pep_relationship?: string
  pep_declaration_note?: string
  building_number: string
  street: string
  district: string
  city: string
  postal_code: string
  elm_result?: boolean
  elm_result_code?: string
  status: Status
  submitted_at: string
  audit: AuditEntry[]
}

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO: Submission[] = [
  {
    id: 'demo-001', iqama: '1060197926', full_name: 'Ahmed Al-Rashidi',
    nationality: 'Saudi', employment_status: 'private', employer_name: 'شركة تالين الطبية',
    profession: 'Pharmacist', income_range: 'SAR 10,000–20,000',
    purpose_of_account: 'Salary deposit', account_currency: 'SAR',
    expected_monthly_deposit_amount: 'SAR 15,000', expected_monthly_withdrawal_amount: 'SAR 8,000',
    mobile_number: '+966501234567', tax_resident_outside_ksa: false, is_pep: false,
    building_number: '8470', street: 'Ibrahim Al Baqai', district: 'Al Shifa', city: 'Riyadh', postal_code: '12345',
    elm_result: true, elm_result_code: 'YWCH-000',
    status: 'submitted', submitted_at: new Date(Date.now() - 3600000).toISOString(), audit: [],
  },
  {
    id: 'demo-002', iqama: '2090445821', full_name: 'Sara Al-Ghamdi',
    nationality: 'Saudi', employment_status: 'government',
    government_sector: 'Ministry of Health', profession: 'Doctor',
    income_range: 'SAR 20,000–35,000', purpose_of_account: 'General banking', account_currency: 'SAR',
    expected_monthly_deposit_amount: 'SAR 22,000', expected_monthly_withdrawal_amount: 'SAR 12,000',
    mobile_number: '+966509876543', tax_resident_outside_ksa: true, us_person: false, is_pep: false,
    building_number: '1220', street: 'King Fahd Road', district: 'Al Olaya', city: 'Riyadh', postal_code: '11564',
    elm_result: true, elm_result_code: 'YWCH-000',
    status: 'under_review', submitted_at: new Date(Date.now() - 86400000).toISOString(),
    audit: [{ action: 'reviewed', notes: 'Pending FATCA verification', created_at: new Date(Date.now() - 3600000).toISOString() }],
  },
  {
    id: 'demo-003', iqama: 'TEST-PEP', full_name: 'Mohammed Al-Otaibi',
    nationality: 'Saudi', employment_status: 'self_employed', profession: 'Consultant',
    income_range: 'SAR 50,000+', purpose_of_account: 'Business transactions', account_currency: 'SAR',
    expected_monthly_deposit_amount: 'SAR 80,000', expected_monthly_withdrawal_amount: 'SAR 60,000',
    mobile_number: '+966554321098', tax_resident_outside_ksa: true, us_person: true, ssn_itin_atin: '123456789',
    is_pep: true, pep_relationship: 'close_associate', pep_declaration_note: 'Business partner of former official',
    building_number: '4521', street: 'Prince Sultan Road', district: 'Al Hamra', city: 'Jeddah', postal_code: '21462',
    elm_result: false, elm_result_code: 'YWCH-001',
    status: 'flagged', submitted_at: new Date(Date.now() - 172800000).toISOString(),
    audit: [
      { action: 'reviewed', notes: 'ELM flagged — PEP check required', created_at: new Date(Date.now() - 7200000).toISOString() },
      { action: 'flagged', notes: 'Escalated to compliance team', created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
  },
  {
    id: 'demo-004', iqama: '1098234567', full_name: 'Fatima Al-Zahrani',
    nationality: 'Saudi', employment_status: 'housewife',
    income_range: 'SAR 0–5,000', purpose_of_account: 'Personal savings', account_currency: 'SAR',
    expected_monthly_deposit_amount: 'SAR 3,000', expected_monthly_withdrawal_amount: 'SAR 2,000',
    mobile_number: '+966561234567', tax_resident_outside_ksa: false, is_pep: false,
    building_number: '3301', street: 'Al Madinah Road', district: 'Al Rawdah', city: 'Jeddah', postal_code: '21589',
    elm_result: true, elm_result_code: 'YWCH-000',
    status: 'approved', submitted_at: new Date(Date.now() - 259200000).toISOString(),
    audit: [{ action: 'approved', notes: 'All checks passed', created_at: new Date(Date.now() - 86400000).toISOString() }],
  },
  {
    id: 'demo-005', iqama: '2034521890', full_name: 'Khalid Al-Harbi',
    nationality: 'Saudi', employment_status: 'private', employer_name: 'Tech Corp Ltd',
    profession: 'Software Engineer', income_range: 'SAR 15,000–25,000',
    purpose_of_account: 'Salary + investments', account_currency: 'SAR',
    expected_monthly_deposit_amount: 'SAR 18,000', expected_monthly_withdrawal_amount: 'SAR 9,000',
    mobile_number: '+966503456789', tax_resident_outside_ksa: false, is_pep: false,
    building_number: '7723', street: 'Tahlia Street', district: 'Al Sulimaniyah', city: 'Riyadh', postal_code: '12244',
    elm_result: true, elm_result_code: 'YWCH-000',
    status: 'rejected', submitted_at: new Date(Date.now() - 345600000).toISOString(),
    audit: [{ action: 'rejected', notes: 'Document mismatch — re-submit required', created_at: new Date(Date.now() - 172800000).toISOString() }],
  },
]

const STATUS_LABEL: Record<Status, string> = {
  submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', flagged: 'Flagged',
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
}

function WLBadge({ result }: { result?: boolean }) {
  if (result === undefined) return <span style={{ color: 'var(--muted)' }}>—</span>
  return result
    ? <span className="badge badge-approved">✓ Clear</span>
    : <span className="badge badge-rejected">⚠ Flagged</span>
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ sub, onClose, onAction }: {
  sub: Submission
  onClose: () => void
  onAction: (id: string, action: string, notes: string) => void
}) {
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)

  // Always allow action — either first time (submitted/under_review) or re-edit
  const isDecided = ['approved','rejected','flagged'].includes(sub.status)

  const ACTION_CONFIG = [
    { action: 'approved',     color: 'var(--green)',  label: '✓ Approve' },
    { action: 'rejected',     color: 'var(--red)',    label: '✗ Reject' },
    { action: 'flagged',      color: 'var(--orange)', label: '⚠ Flag' },
    { action: 'under_review', color: 'var(--blue2)',  label: '👁 Mark Under Review' },
  ] as const

  const STATUS_COLORS: Record<string, string> = {
    approved:     'var(--green)',
    rejected:     'var(--red)',
    flagged:      'var(--orange)',
    under_review: 'var(--gold)',
    submitted:    'var(--blue2)',
  }

  function DataRow({ label, value }: { label: string; value?: string | boolean | null }) {
    if (value === undefined || value === null || value === '') return null
    return (
      <div style={{ display: 'flex', padding: '9px 14px', borderBottom: '1px solid var(--border)', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', width: 170, flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
        </span>
      </div>
    )
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--muted)' }}>
          {title}
        </div>
        {children}
      </div>
    )
  }

  const handleAction = (action: string) => {
    onAction(sub.id, action, notes)
    setNotes('')
    setEditing(false)
  }

  const showActionPanel = !isDecided || editing

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: 'var(--navy2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, width: 760, maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{sub.full_name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>Iqama: {sub.iqama}</span>
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', padding: '6px 12px', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflow: 'auto', flex: 1, padding: 20, display: 'grid', gridTemplateColumns: '1fr 230px', gap: 16 }}>

          {/* Left — KYC data */}
          <div>
            <Section title="Personal Information">
              <DataRow label="Full Name" value={sub.full_name} />
              <DataRow label="Nationality" value={sub.nationality} />
              <DataRow label="Gender" value={sub.kyc_data?.gender} />
              <DataRow label="Marital Status" value={sub.kyc_data?.marital_status} />
              <DataRow label="Date of Birth" value={sub.kyc_data?.date_of_birth} />
              <DataRow label="Mobile Number" value={sub.mobile_number} />
            </Section>
            <Section title="National Address">
              <DataRow label="Building Number" value={sub.building_number} />
              <DataRow label="Street" value={sub.street} />
              <DataRow label="District" value={sub.district} />
              <DataRow label="City" value={sub.city} />
              <DataRow label="Postal Code" value={sub.postal_code} />
            </Section>
            <Section title="Employment">
              <DataRow label="Status" value={sub.employment_status?.replace(/_/g, ' ')} />
              <DataRow label="Employer" value={sub.employer_name} />
              <DataRow label="Gov. Sector" value={sub.government_sector} />
              <DataRow label="Profession" value={sub.profession} />
              <DataRow label="Joining Date" value={sub.joining_date} />
            </Section>
            <Section title="Financial Information">
              <DataRow label="Income Range" value={sub.income_range} />
              <DataRow label="Purpose of Account" value={sub.purpose_of_account} />
              <DataRow label="Account Currency" value={sub.account_currency} />
              <DataRow label="Monthly Deposits" value={sub.expected_monthly_deposit_amount} />
              <DataRow label="Monthly Withdrawals" value={sub.expected_monthly_withdrawal_amount} />
            </Section>
            <Section title="FATCA / CRS">
              <DataRow label="Tax Resident Outside KSA" value={sub.tax_resident_outside_ksa} />
              <DataRow label="US Person" value={sub.us_person} />
              <DataRow label="SSN / ITIN / ATIN" value={sub.ssn_itin_atin} />
            </Section>
            {sub.is_pep && (
              <Section title="⚠ PEP Declaration">
                <DataRow label="PEP Flagged" value={true} />
                <DataRow label="Relationship" value={sub.pep_relationship} />
                <DataRow label="Declaration Note" value={sub.pep_declaration_note} />
              </Section>
            )}
          </div>

          {/* Right — actions + audit */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

            {/* Watchlist result */}
            <div style={{
              border: `1px solid ${sub.elm_result === false ? 'rgba(255,68,85,0.3)' : 'rgba(0,204,136,0.3)'}`,
              background: sub.elm_result === false ? 'rgba(255,68,85,0.05)' : 'rgba(0,204,136,0.05)',
              borderRadius: 10, padding: 14, textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{sub.elm_result === false ? '⚠' : '✓'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>ELMNatheer Watchlist</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3, color: sub.elm_result === false ? 'var(--red)' : 'var(--green)' }}>
                {sub.elm_result === false ? `Flagged — ${sub.elm_result_code}` : 'Clear'}
              </div>
            </div>

            {/* Current status banner (only when decided and not editing) */}
            {isDecided && !editing && (
              <div style={{ background: 'var(--card)', border: `1px solid ${STATUS_COLORS[sub.status]}44`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 8 }}>Current Status</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLORS[sub.status], textTransform: 'capitalize' as const }}>
                    {sub.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => { setEditing(true); setNotes('') }}
                    style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text2)', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                    ✏ Edit
                  </button>
                </div>
              </div>
            )}

            {/* Action panel */}
            {showActionPanel && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--muted)' }}>
                    {editing ? 'Change Decision' : 'Take Action'}
                  </div>
                  {editing && (
                    <button onClick={() => { setEditing(false); setNotes('') }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                      Cancel
                    </button>
                  )}
                </div>
                {editing && (
                  <div style={{ fontSize: 11, color: 'var(--gold)', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>
                    ⚠ Changing a decided submission will be recorded in the audit log
                  </div>
                )}
                <textarea
                  rows={3} placeholder={editing ? 'Reason for change (required)...' : 'Notes (optional)...'}
                  value={notes} onChange={e => setNotes(e.target.value)}
                  style={{ resize: 'none', marginBottom: 10, fontFamily: 'inherit', fontSize: 12, height: 72 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {ACTION_CONFIG.map(({ action, color, label }) => (
                    <button key={action}
                      onClick={() => handleAction(action)}
                      disabled={editing && !notes.trim()}
                      style={{
                        padding: 9, borderRadius: 8, border: 'none', cursor: editing && !notes.trim() ? 'not-allowed' : 'pointer',
                        background: `${color}22`, color, fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                        transition: 'all 0.15s', opacity: editing && !notes.trim() ? 0.5 : 1,
                      }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audit log — full history */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 10 }}>
                Audit Log ({sub.audit?.length || 0})
              </div>
              {!sub.audit?.length
                ? <div style={{ fontSize: 12, color: 'var(--muted)' }}>No actions yet</div>
                : [...sub.audit].reverse().map((log, i) => {
                    const isLatest = i === 0
                    const actionColor = STATUS_COLORS[log.action] || 'var(--text2)'
                    return (
                      <div key={i} style={{
                        borderLeft: `2px solid ${isLatest ? actionColor : 'var(--border)'}`,
                        paddingLeft: 10, marginBottom: 12,
                        opacity: isLatest ? 1 : 0.7,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: actionColor, textTransform: 'capitalize' as const }}>
                            {log.action.replace('_', ' ')}
                          </span>
                          {isLatest && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: `${actionColor}22`, color: actionColor }}>
                              LATEST
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2, fontStyle: 'italic' }}>"{log.notes}"</div>
                        )}
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                          {new Date(log.created_at).toLocaleString('en-SA')}
                        </div>
                      </div>
                    )
                  })
              }
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function DashboardPage() {
  const [subs, setSubs] = useState<Submission[]>([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(false)

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Auto-fetch from backend on mount + every 10s
  useEffect(() => {
    fetchFromBackend()
    // Poll every 5 seconds for new submissions
    const t = setInterval(fetchFromBackend, 5000)
    return () => clearInterval(t)
  }, [])

  const fetchFromBackend = async () => {
    try {
      const res = await fetch(`${API}/admin/submissions`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        // Backend returns { items, total } — map to our Submission shape
        const items: Submission[] = (data.items || []).map((item: any) => ({
          id: item.id,
          iqama: item.iqama || item.kyc_data?.iqama || item.kyc_data?.session_id?.slice(0,8) || '—',
          full_name: item.full_name || item.kyc_data?.full_name || item.kyc_data?.iqama || 'Unknown',
          nationality: item.kyc_data?.nationality || '—',
          employment_status: item.kyc_data?.employment_status || '—',
          employer_name: item.kyc_data?.employer_name,
          government_sector: item.kyc_data?.government_sector,
          profession: item.kyc_data?.profession,
          income_range: item.kyc_data?.income_range || '—',
          purpose_of_account: item.kyc_data?.purpose_of_account || '—',
          account_currency: item.kyc_data?.account_currency,
          expected_monthly_deposit_amount: item.kyc_data?.expected_monthly_deposit_amount || '—',
          expected_monthly_withdrawal_amount: item.kyc_data?.expected_monthly_withdrawal_amount || '—',
          mobile_number: item.kyc_data?.mobile_number || '—',
          tax_resident_outside_ksa: item.kyc_data?.tax_resident_outside_ksa || false,
          us_person: item.kyc_data?.us_person,
          ssn_itin_atin: item.kyc_data?.ssn_itin_atin,
          is_pep: item.kyc_data?.is_pep || false,
          pep_relationship: item.kyc_data?.pep_relationship,
          pep_declaration_note: item.kyc_data?.pep_declaration_note,
          building_number: item.kyc_data?.building_number || '—',
          street: item.kyc_data?.street || '—',
          district: item.kyc_data?.district || '—',
          city: item.kyc_data?.city || '—',
          postal_code: item.kyc_data?.postal_code || '—',
          elm_result: item.elm_result,
          elm_result_code: item.elm_result_code,
          status: item.status,
          submitted_at: item.submitted_at || item.updated_at,
          audit: item.audit || [],
        }))
        setSubs(items)
        setBackendAvailable(true)
      }
    } catch {
      setBackendAvailable(false)
    }
  }

  const injectDemo = () => {
    if (backendAvailable) {
      fetchFromBackend()
      showToast('✓ Refreshed from backend')
    } else {
      setSubs(JSON.parse(JSON.stringify(DEMO)))
      showToast('✓ 5 demo submissions loaded (backend offline)')
    }
  }

  const takeAction = (id: string, action: string, notes: string) => {
    setSubs(prev => prev.map(s => {
      if (s.id !== id) return s
      const prevStatus = s.status
      const auditNote = prevStatus !== action
        ? `[Changed from: ${prevStatus.replace('_',' ')}] ${notes}`.trim()
        : notes
      return {
        ...s,
        status: action as Status,
        audit: [...(s.audit || []), {
          action,
          notes: auditNote,
          created_at: new Date().toISOString(),
        }],
      }
    }))

    // Also persist to backend
    fetch(`http://localhost:8000/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    }).catch(err => console.warn('Failed to persist action to backend:', err))

    showToast(`✓ Submission ${action.replace('_',' ')}`)
  }

  const filtered = filter ? subs.filter(s => s.status === filter) : subs

  const kpis = {
    total: subs.length,
    pending: subs.filter(s => s.status === 'submitted').length,
    approved: subs.filter(s => s.status === 'approved').length,
    flagged: subs.filter(s => s.status === 'flagged').length,
  }

  const KPI_CONFIG = [
    { label: 'Total Submitted',  value: kpis.total,    color: 'var(--blue2)', accent: 'var(--blue)',  icon: '📋' },
    { label: 'Pending Review',   value: kpis.pending,  color: 'var(--gold)',  accent: 'var(--gold)',  icon: '⏳' },
    { label: 'Approved',         value: kpis.approved, color: 'var(--green)', accent: 'var(--green)', icon: '✓' },
    { label: 'Flagged (PEP/WL)', value: kpis.flagged,  color: 'var(--red)',   accent: 'var(--red)',   icon: '⚠' },
  ]

  const FILTERS = ['', 'submitted', 'under_review', 'approved', 'rejected', 'flagged']

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {KPI_CONFIG.map(k => (
          <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: k.accent }} />
            <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 28, opacity: 0.1 }}>{k.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{k.label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, margin: '6px 0 4px', color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>KYC Submissions</div>
        <button onClick={injectDemo}
          style={{ padding: '7px 16px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
          + Inject Demo Submissions
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', border: `1px solid ${filter === f ? 'var(--blue)' : 'var(--border)'}`, background: filter === f ? 'var(--blue)' : 'transparent', color: filter === f ? 'white' : 'var(--muted)' }}>
            {f === '' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Nationality</th>
              <th>Employment</th>
              <th>Status</th>
              <th>Watchlist</th>
              <th>Submitted</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
                  {subs.length === 0
                    ? backendAvailable
                    ? 'No submissions yet — submit a KYC application from the wizard to see it here'
                    : 'No submissions yet — click "Load Demo Submissions" to test'
                    : `No ${filter.replace('_', ' ')} submissions`}
                </td>
              </tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'white' }}>{s.full_name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.iqama}</div>
                </td>
                <td style={{ color: 'var(--muted)' }}>{s.nationality}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{s.employment_status?.replace(/_/g, ' ')}</td>
                <td><StatusBadge status={s.status} /></td>
                <td><WLBadge result={s.elm_result} /></td>
                <td style={{ color: 'var(--muted)', fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                  {new Date(s.submitted_at).toLocaleDateString('en-SA')}
                </td>
                <td>
                  <button onClick={() => setSelected(s)}
                    style={{ padding: '5px 12px', background: 'rgba(26,92,255,0.15)', border: '1px solid rgba(26,92,255,0.3)', color: 'var(--blue2)', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    Review →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selected && (
        <Modal
          sub={selected}
          onClose={() => setSelected(null)}
          onAction={(id, action, notes) => {
            takeAction(id, action, notes)
            setSelected(null)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--navy3)', border: `1px solid ${toast.type === 'success' ? 'rgba(0,204,136,0.4)' : 'rgba(255,68,85,0.4)'}`, borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 500, zIndex: 200, animation: 'fadeUp 0.3s ease both' }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}