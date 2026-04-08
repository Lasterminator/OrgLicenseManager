import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import { useAuth } from '../contexts/AuthContext'

type SystemRole = 'User' | 'Admin'

interface LoginPreset {
  label: string
  description: string
  userId: string
  email: string
  role: SystemRole
}

const presets: LoginPreset[] = [
  {
    label: 'Org Owner',
    description: 'Best for exploring the member and invitation workflow.',
    userId: 'owner-demo',
    email: 'owner@acme.io',
    role: 'User',
  },
  {
    label: 'System Admin',
    description: 'Use the platform-wide license control panel and settings.',
    userId: 'admin-demo',
    email: 'admin@orglicense.dev',
    role: 'Admin',
  },
  {
    label: 'Regular Member',
    description: 'See the read-only org view and invitation acceptance flow.',
    userId: 'member-demo',
    email: 'member@acme.io',
    role: 'User',
  },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<SystemRole>('User')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectState = (location.state as {
    from?: { pathname: string; search?: string; hash?: string }
  })?.from
  const from = `${redirectState?.pathname ?? '/organizations'}${redirectState?.search ?? ''}${redirectState?.hash ?? ''}`
  const isInvitationHandoff = redirectState?.pathname === '/invitations/accept'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ userId: userId.trim(), email: email.trim(), role })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const applyPreset = (preset: LoginPreset) => {
    setUserId(preset.userId)
    setEmail(preset.email)
    setRole(preset.role)
    setError('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[rgba(24,79,191,0.14)] blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-96 w-96 rounded-full bg-[rgba(179,106,18,0.16)] blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--muted-strong)]">
            Demo Access
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-[color:var(--text-strong)] sm:text-6xl">
            License ops for multi-tenant teams without the messy spreadsheets.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
            This workspace is built as a portfolio-quality admin surface for organizations,
            memberships, invitations, and license lifecycle management. Use a preset below or
            sign in with your own demo identity.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--border-strong)]"
              >
                <p className="text-sm font-semibold text-[color:var(--text-strong)]">{preset.label}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                  {preset.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
                  {preset.role}
                </p>
              </button>
            ))}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-lg bg-[rgba(255,250,242,0.92)]">
          <div className="rounded-[24px] border border-[rgba(24,79,191,0.12)] bg-[rgba(24,79,191,0.06)] px-4 py-3 text-sm text-[color:var(--accent)]">
            {isInvitationHandoff
              ? 'Sign in first and the invitation will continue automatically.'
              : 'Use any unique user ID to create or update a demo identity.'}
          </div>

          <div className="mt-6">
            <h2 className="text-2xl font-semibold text-[color:var(--text-strong)]">Enter the workspace</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              Demo auth is still enabled on purpose so this project is easy to review and explore.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-2xl border border-[rgba(170,63,51,0.18)] bg-[rgba(255,247,246,0.92)] p-4 text-sm text-[color:var(--danger)]">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">User ID</span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
                placeholder="e.g. owner-demo"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
                placeholder="owner@acme.io"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">System role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as SystemRole)}
                className="w-full rounded-2xl border border-[color:var(--border)] bg-white/90 px-4 py-3 text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(24,79,191,0.12)]"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </label>

            <Button type="submit" loading={loading} className="w-full">
              {isInvitationHandoff ? 'Sign in and continue' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
