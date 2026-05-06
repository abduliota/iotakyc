'use client'
import { useState } from 'react'

const API = 'http://localhost:8000'

const MOCK_SPOST = {
  success: true, source: 'mock',
  building_number: '8470', street: 'Ibrahim Al Baqai',
  district: 'Al Shifa Dist.', city: 'Riyadh', postal_code: '47919',
  additional_number: '3337', unit_number: '8', region: 'Riyadh Region',
  latitude: '28.37211195', longitude: '36.48338480',
}

const MOCK_TKML = {
  success: true, source: 'mock',
  establishment_name: 'شركة تالين الطبية المحدودة',
  establishment_status: 'قائمة',
  establishment_status_en: 'Active',
}

function mockELM(id: string) {
  const flagged = id.includes('PEP') || id === 'TEST-PEP'
  return {
    person_id: id, result: !flagged,
    result_code: flagged ? 'YWCH-001' : 'YWCH-000',
    result_desc: flagged ? 'Inaccurate data entry identified' : 'Clear',
    source: 'mock',
  }
}

async function tryLive<T>(fn: () => Promise<T>, fallback: T): Promise<{ data: T; live: boolean }> {
  try { return { data: await fn(), live: true } }
  catch { return { data: fallback, live: false } }
}

function Spinner() {
  return (
    <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  )
}

function StatusPill({ live, loading }: { live: boolean; loading: boolean }) {
  if (loading) return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
      Testing...
    </span>
  )
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: 0.5, background: live ? 'rgba(0,204,136,0.15)' : 'rgba(245,166,35,0.15)', color: live ? 'var(--green)' : 'var(--gold)' }}>
      {live ? 'LIVE' : 'MOCK'}
    </span>
  )
}

function ResultBox({ data, isError }: { data: unknown; isError?: boolean }) {
  if (!data) return null
  return (
    <pre style={{ marginTop: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontSize: 10.5, color: isError ? 'var(--red)' : 'var(--accent)', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.6 }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function ApiCard({ name, platform, loading, live, tested, children }: {
  name: string; platform: string; loading: boolean; live: boolean; tested: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{name}</div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' as const, color: 'var(--muted)', marginTop: 1 }}>{platform}</div>
        </div>
        {tested ? <StatusPill live={live} loading={loading} /> : (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(245,166,35,0.15)', color: 'var(--gold)', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>MOCK</span>
        )}
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  )
}

function TestBtn({ onClick, label, loading }: { onClick: () => void; label: string; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ width: '100%', padding: 9, background: 'var(--blue)', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.75 : 1, transition: 'all 0.15s' }}>
      {loading ? <><Spinner /> Testing...</> : label}
    </button>
  )
}

const ENDPOINTS = [
  { method: 'GET',   endpoint: '/gov/address/{iqama}',        desc: 'SPOST national address lookup',    status: 'Mock' },
  { method: 'GET',   endpoint: '/gov/establishment/{name}',   desc: 'TKML establishment status',        status: 'Mock' },
  { method: 'POST',  endpoint: '/gov/watchlist',              desc: 'ELMNatheer watchlist check',       status: 'Mock' },
  { method: 'POST',  endpoint: '/kyc/session',                desc: 'Create KYC session',               status: 'Live' },
  { method: 'PATCH', endpoint: '/kyc/session/{id}/step/{n}',  desc: 'Save step data + advance',         status: 'Live' },
  { method: 'POST',  endpoint: '/kyc/session/{id}/submit',    desc: 'Final submission + ELM check',     status: 'Live' },
  { method: 'GET',   endpoint: '/admin/submissions',          desc: 'List all submissions',             status: 'Live' },
  { method: 'PATCH', endpoint: '/admin/submissions/{id}',     desc: 'Approve / reject / flag',          status: 'Live' },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--green)', POST: 'var(--blue2)', PATCH: 'var(--orange)'
}

export default function ApiTesterPage() {
  // SPOST
  const [spostIqama, setSpostIqama] = useState('1060197926')
  const [spostResult, setSpostResult] = useState<unknown>(null)
  const [spostLoading, setSpostLoading] = useState(false)
  const [spostLive, setSpostLive] = useState(false)
  const [spostTested, setSpostTested] = useState(false)

  // TKML
  const [tkmlName, setTkmlName] = useState('شركة تالين الطبية')
  const [tkmlResult, setTkmlResult] = useState<unknown>(null)
  const [tkmlLoading, setTkmlLoading] = useState(false)
  const [tkmlLive, setTkmlLive] = useState(false)
  const [tkmlTested, setTkmlTested] = useState(false)

  // ELM
  const [elmId, setElmId] = useState('1060197926')
  const [elmDob, setElmDob] = useState('1975')
  const [elmResult, setElmResult] = useState<unknown>(null)
  const [elmLoading, setElmLoading] = useState(false)
  const [elmLive, setElmLive] = useState(false)
  const [elmTested, setElmTested] = useState(false)
  const [elmFlagged, setElmFlagged] = useState(false)

  // Flow
  const [flowIqama, setFlowIqama] = useState('TEST-PEP')
  const [flowSteps, setFlowSteps] = useState<{ label: string; data: unknown; error: boolean }[]>([])
  const [flowLoading, setFlowLoading] = useState(false)
  const [flowDone, setFlowDone] = useState(false)

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

  const testSPOST = async () => {
    setSpostLoading(true); setSpostTested(true)
    await delay(500)
    const { data, live } = await tryLive(
      async () => { const r = await fetch(`${API}/gov/address/${spostIqama}`, { signal: AbortSignal.timeout(4000) }); return r.json() },
      MOCK_SPOST
    )
    setSpostResult(data); setSpostLive(live); setSpostLoading(false)
  }

  const testTKML = async () => {
    setTkmlLoading(true); setTkmlTested(true)
    await delay(500)
    const { data, live } = await tryLive(
      async () => { const r = await fetch(`${API}/gov/establishment/${encodeURIComponent(tkmlName)}`, { signal: AbortSignal.timeout(4000) }); return r.json() },
      MOCK_TKML
    )
    setTkmlResult(data); setTkmlLive(live); setTkmlLoading(false)
  }

  const testELM = async () => {
    setElmLoading(true); setElmTested(true)
    await delay(500)
    const mock = mockELM(elmId)
    const { data, live } = await tryLive(
      async () => {
        const r = await fetch(`${API}/gov/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person_id: elmId, id_type: 'NIN', dob: elmDob }), signal: AbortSignal.timeout(4000) })
        return r.json()
      },
      mock
    )
    const d = data as { result?: boolean }
    setElmResult(data); setElmLive(live); setElmFlagged(d.result === false); setElmLoading(false)
  }

  const runFullFlow = async () => {
    setFlowLoading(true); setFlowSteps([]); setFlowDone(false)
    const steps = [
      { label: 'STEP 1 — SPOST: National Address', fn: () => tryLive(async () => { const r = await fetch(`${API}/gov/address/${flowIqama}`, { signal: AbortSignal.timeout(4000) }); return r.json() }, MOCK_SPOST) },
      { label: 'STEP 2 — TKML: Establishment Verification', fn: () => tryLive(async () => { const r = await fetch(`${API}/gov/establishment/${encodeURIComponent('شركة تالين الطبية')}`, { signal: AbortSignal.timeout(4000) }); return r.json() }, MOCK_TKML) },
      { label: 'STEP 3 — ELMNatheer: Watchlist Check', fn: () => tryLive(async () => { const r = await fetch(`${API}/gov/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person_id: flowIqama, id_type: 'NIN', dob: '1985' }), signal: AbortSignal.timeout(4000) }); return r.json() }, mockELM(flowIqama)) },
    ]
    const results: { label: string; data: unknown; error: boolean }[] = []
    for (const step of steps) {
      await delay(700)
      const { data } = await step.fn()
      const d = data as { result?: boolean }
      const isError = step.label.includes('ELM') && d.result === false
      results.push({ label: step.label, data, error: isError })
      setFlowSteps([...results])
    }
    setFlowLoading(false); setFlowDone(true)
  }

  const isPEP = flowIqama.includes('PEP')

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Government API Tester</div>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Mock mode — no credentials needed · Add keys to backend/.env to go live</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          Test all 3 Saudi government APIs individually or run the full KYC flow sequence.
          Results show the normalized schema your mobile app and backend actually use.
        </p>
      </div>

      {/* 3 API cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        <ApiCard name="SPOST — National Address" platform="Saudi Post · SPOST API" loading={spostLoading} live={spostLive} tested={spostTested}>
          <input value={spostIqama} onChange={e => setSpostIqama(e.target.value)} placeholder="Iqama number" style={{ marginBottom: 10, fontFamily: "'DM Mono',monospace", fontSize: 12 }} />
          <TestBtn onClick={testSPOST} label="Test Address Lookup" loading={spostLoading} />
          <ResultBox data={spostResult} />
        </ApiCard>

        <ApiCard name="TKML — Establishment" platform="Ministry of HR · TKML" loading={tkmlLoading} live={tkmlLive} tested={tkmlTested}>
          <input value={tkmlName} onChange={e => setTkmlName(e.target.value)} placeholder="Establishment name" style={{ marginBottom: 10, fontSize: 12 }} />
          <TestBtn onClick={testTKML} label="Test Establishment" loading={tkmlLoading} />
          <ResultBox data={tkmlResult} />
        </ApiCard>

        <ApiCard name="ELMNatheer — Watchlist" platform="ELM · National Alert" loading={elmLoading} live={elmLive} tested={elmTested}>
          <input value={elmId} onChange={e => setElmId(e.target.value)} placeholder="Person ID / Iqama" style={{ marginBottom: 8, fontFamily: "'DM Mono',monospace", fontSize: 12 }} />
          <input value={elmDob} onChange={e => setElmDob(e.target.value)} placeholder="Year of birth (e.g. 1975)" style={{ marginBottom: 10, fontSize: 12 }} />
          <TestBtn onClick={testELM} label="Run Watchlist Check" loading={elmLoading} />
          <ResultBox data={elmResult} isError={elmFlagged} />
        </ApiCard>
      </div>

      {/* Full flow */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 6 }}>Full KYC Flow Test</div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
          Runs all 3 APIs in sequence — simulates what happens server-side on submission. Use{' '}
          <code style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 6px', borderRadius: 4, fontFamily: "'DM Mono',monospace", fontSize: 11 }}>TEST-PEP</code>{' '}
          to trigger the watchlist flag and PEP flow.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: flowSteps.length ? 20 : 0 }}>
          <input value={flowIqama} onChange={e => { setFlowIqama(e.target.value); setFlowSteps([]); setFlowDone(false) }}
            placeholder="Iqama number" style={{ width: 220, fontFamily: "'DM Mono',monospace", fontSize: 12 }} />
          <button onClick={runFullFlow} disabled={flowLoading}
            style={{ padding: '9px 20px', background: 'var(--blue)', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, cursor: flowLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', opacity: flowLoading ? 0.75 : 1 }}>
            {flowLoading ? <><Spinner /> Running...</> : '▶ Run Full Flow'}
          </button>
        </div>

        {flowSteps.map((step, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: step.error ? 'var(--red)' : 'var(--accent)', marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>
              {step.label}
            </div>
            <ResultBox data={step.data} isError={step.error} />
          </div>
        ))}

        {flowDone && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: isPEP ? 'rgba(255,68,85,0.1)' : 'rgba(0,204,136,0.1)', border: `1px solid ${isPEP ? 'rgba(255,68,85,0.3)' : 'rgba(0,204,136,0.3)'}`, fontFamily: "'DM Mono',monospace", fontSize: 11, color: isPEP ? 'var(--red)' : 'var(--green)' }}>
            {'// RESULT: KYC flow complete\n// Watchlist: '}
            {isPEP ? '⚠ FLAGGED — PEP flow triggered' : '✓ CLEAR — proceed to submission'}
          </div>
        )}
      </div>

      {/* Endpoint reference */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 15, fontWeight: 600, color: 'white' }}>
          API Endpoint Reference
        </div>
        <table>
          <thead>
            <tr><th>Method</th><th>Endpoint</th><th>Description</th><th>Status</th></tr>
          </thead>
          <tbody>
            {ENDPOINTS.map(ep => (
              <tr key={ep.endpoint}>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${METHOD_COLORS[ep.method]}22`, color: METHOD_COLORS[ep.method] }}>
                    {ep.method}
                  </span>
                </td>
                <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11 }}>{ep.endpoint}</td>
                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{ep.desc}</td>
                <td>
                  <span className={`badge ${ep.status === 'Mock' ? 'badge-under_review' : 'badge-approved'}`} style={{ fontSize: 10 }}>
                    {ep.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
