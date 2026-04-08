import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AcceptInvitationPage from './AcceptInvitationPage'
import { renderWithProviders } from '../test/renderWithProviders'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: null,
    isLoading: false,
  }),
}))

vi.mock('../api/memberships', () => ({
  acceptInvitation: vi.fn(),
}))

describe('AcceptInvitationPage', () => {
  it('shows a public login handoff when the user is logged out', () => {
    renderWithProviders(<AcceptInvitationPage />, ['/invitations/accept?token=invite-token'])

    expect(screen.getByText(/sign in to continue this invitation/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in and continue/i })).toBeInTheDocument()
  })
})
