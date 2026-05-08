import Link from 'next/link'

export function generateStaticParams() {
  // Keep this dynamic route export-compatible for static builds.
  return [{ id: 'placeholder' }]
}

export default function SubmissionDetail({ params }: { params: { id: string } }) {
  return (
    <div style={{ padding: 28 }}>
      <Link href="/"
        style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
        ← Back to Dashboard
      </Link>
      <div style={{ color: 'var(--text2)', fontSize: 14 }}>
        Individual submission detail view for <strong>{params.id}</strong> is coming in Phase 2 when Supabase is connected.
      </div>
    </div>
  )
}
