import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { acceptInvitation } from '../api/memberships'
import Button from '../components/Button'
import Card from '../components/Card'

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [orgName, setOrgName] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    if (!token || token.trim() === '') {
      setStatus('error')
      setMessage('No invitation token provided.')
      return
    }
    setStatus('loading')
    acceptInvitation({ token })
      .then((membership) => {
        setOrgName(membership.name)
        setRole(membership.role)
        setStatus('success')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Failed to accept invitation.')
      })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            <p className="text-gray-600">Accepting invitation…</p>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <div className="text-5xl text-green-500 mb-4">✓</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-2">
            You have successfully joined <span className="font-semibold text-primary-600">{orgName}</span>.
          </p>
          <p className="text-sm text-gray-500 mb-6">Your role: <span className="font-medium">{role}</span></p>
          <Button onClick={() => navigate('/organizations', { replace: true })}>
            Go to My Organizations
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <div className="text-5xl text-red-500 mb-4">✗</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot accept invitation</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Button onClick={() => navigate('/organizations', { replace: true })}>
          Back to My Organizations
        </Button>
      </Card>
    </div>
  )
}
