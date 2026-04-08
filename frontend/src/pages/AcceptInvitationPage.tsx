import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Card from '../components/Card'
import LoadingState from '../components/LoadingState'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../contexts/AuthContext'
import { acceptInvitation } from '../api/memberships'

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { token: authToken, isLoading } = useAuth()
  const invitationToken = searchParams.get('token')
  const attemptedTokenRef = useRef<string | null>(null)

  const acceptInvitationMutation = useMutation({
    mutationFn: acceptInvitation,
  })

  useEffect(() => {
    if (!invitationToken || !authToken || isLoading) return
    if (attemptedTokenRef.current === invitationToken) return

    attemptedTokenRef.current = invitationToken
    acceptInvitationMutation.mutate({ token: invitationToken })
  }, [acceptInvitationMutation, authToken, invitationToken, isLoading])

  if (!invitationToken) {
    return (
      <InvitationShell>
        <Card className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(170,63,51,0.12)] text-3xl text-[color:var(--danger)]">
            !
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[color:var(--text-strong)]">
            Invitation link is incomplete
          </h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
            This page needs a valid invitation token in the URL before it can continue.
          </p>
          <div className="mt-8">
            <Button onClick={() => navigate('/organizations', { replace: true })}>
              Back to organizations
            </Button>
          </div>
        </Card>
      </InvitationShell>
    )
  }

  if (isLoading) {
    return (
      <InvitationShell>
        <LoadingState label="Checking your session…" />
      </InvitationShell>
    )
  }

  if (!authToken) {
    return (
      <InvitationShell>
        <Card className="mx-auto max-w-xl">
          <StatusBadge tone="info">Invitation handoff</StatusBadge>
          <h1 className="mt-5 text-3xl font-semibold text-[color:var(--text-strong)]">
            Sign in to continue this invitation
          </h1>
          <p className="mt-4 text-sm leading-6 text-[color:var(--text-muted)]">
            Once you sign in, this page will resume automatically and try to join the organization
            with the email tied to your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate('/login', { state: { from: location } })}>
              Sign in and continue
            </Button>
            <Button variant="secondary" onClick={() => navigate('/login', { replace: true })}>
              Go to demo login
            </Button>
          </div>
        </Card>
      </InvitationShell>
    )
  }

  if (acceptInvitationMutation.isPending) {
    return (
      <InvitationShell>
        <LoadingState label="Accepting invitation…" />
      </InvitationShell>
    )
  }

  if (acceptInvitationMutation.isSuccess) {
    const membership = acceptInvitationMutation.data

    return (
      <InvitationShell>
        <Card className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(29,107,79,0.12)] text-3xl text-[color:var(--success)]">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-[color:var(--text-strong)]">You’re in</h1>
          <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
            You successfully joined <span className="font-semibold text-[color:var(--text-strong)]">{membership.name}</span>.
          </p>
          <div className="mt-6 flex justify-center">
            <StatusBadge tone="success">{membership.role}</StatusBadge>
          </div>
          <div className="mt-8">
            <Button onClick={() => navigate(`/organizations/${membership.id}`, { replace: true })}>
              Open organization
            </Button>
          </div>
        </Card>
      </InvitationShell>
    )
  }

  const errorMessage =
    acceptInvitationMutation.error instanceof Error
      ? acceptInvitationMutation.error.message
      : 'Failed to accept invitation.'

  return (
    <InvitationShell>
      <Card className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(170,63,51,0.12)] text-3xl text-[color:var(--danger)]">
          ✕
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-[color:var(--text-strong)]">
          Couldn’t accept this invitation
        </h1>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">{errorMessage}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => navigate('/organizations', { replace: true })}>
            Back to organizations
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              attemptedTokenRef.current = null
              acceptInvitationMutation.reset()
            }}
          >
            Try again
          </Button>
        </div>
      </Card>
    </InvitationShell>
  )
}

function InvitationShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-4rem] top-12 h-64 w-64 rounded-full bg-[rgba(24,79,191,0.12)] blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[rgba(179,106,18,0.14)] blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
