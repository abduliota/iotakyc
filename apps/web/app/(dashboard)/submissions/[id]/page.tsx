'use client'
import { useRouter } from 'next/navigation'

export default function SubmissionDetail() {
  const router = useRouter()
  return (
    <div style={{ padding: 28 }}>
      <button onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, marginBottom: 20, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back to Dashboard
      </button>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>
        Individual submission detail view — coming in Phase 2 when Supabase is connected.
      </div>
    </div>
  )
}
