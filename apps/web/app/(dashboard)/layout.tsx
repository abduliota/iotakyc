'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [backend, setBackend] = useState<'checking' | 'live' | 'offline'>('checking')
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-SA', { hour12: false }) + ' AST')
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('http://localhost:8000/ping', { signal: AbortSignal.timeout(3000) })
        setBackend(r.ok ? 'live' : 'offline')
      } catch { setBackend('offline') }
    }
    check(); const t = setInterval(check, 30000); return () => clearInterval(t)
  }, [])

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  const backendColor = backend === 'live' ? 'var(--green)' : backend === 'offline' ? 'var(--gold)' : 'var(--muted)'
  const backendLabel = backend === 'live' ? 'Connected ✓' : backend === 'offline' ? 'Offline (mock)' : 'Checking...'

  const navLinks = [
    { href: '/',            icon: '⬛', label: 'Dashboard' },
    { href: '/api-tester',  icon: '🔬', label: 'API Tester' },
    { href: '/onboarding',  icon: '📋', label: 'KYC Wizard (Preview)' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy)', color: 'var(--text)' }}>
      <aside style={{ width: 220, minHeight: '100vh', background: 'var(--navy2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 20 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent)' }}>IOTA Technologies</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginTop: 2 }}>KYC Portal</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Agent Dashboard v1.0</div>
        </div>
        <nav style={{ padding: '16px 0', flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 20px 4px' }}>Main</div>
          {navLinks.slice(0, 2).map(link => (
            <a key={link.href} href={link.href} className={`nav-item${isActive(link.href) ? ' active' : ''}`}
              onClick={e => { e.preventDefault(); router.push(link.href) }}>
              <span style={{ fontSize: 14 }}>{link.icon}</span> {link.label}
            </a>
          ))}
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', padding: '16px 20px 4px' }}>Customer Flow</div>
          <a href="/onboarding" className={`nav-item${isActive('/onboarding') ? ' active' : ''}`}
            onClick={e => { e.preventDefault(); router.push('/onboarding') }}>
            <span style={{ fontSize: 14 }}>📋</span> KYC Wizard
          </a>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', padding: '16px 20px 4px' }}>System</div>
          <div className="nav-item" style={{ opacity: 0.5 }}><span style={{ fontSize: 14 }}>⚙</span> Settings</div>
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--blue)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'white' }}>AS</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 12 }}>Agent — Dev</div>
              <div style={{ color: 'var(--muted)', fontSize: 10 }}>Reviewer</div>
            </div>
          </div>
        </div>
      </aside>
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ height: 56, background: 'var(--navy2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'white' }}>
            {isActive('/api-tester') ? 'Government API Tester' : isActive('/onboarding') ? 'KYC Wizard — Customer Flow' : 'KYC Dashboard'}
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 0 3px rgba(0,204,136,0.2)', animation: 'pulse 2s infinite' }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--muted)' }}>{time}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Backend: <span style={{ color: backendColor }}>{backendLabel}</span></div>
        </div>
        <div style={{ padding: isActive('/onboarding') ? 0 : 28, flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
