import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { renderWithProviders } from '../test/renderWithProviders'

const loginMock = vi.fn()

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset()
    loginMock.mockResolvedValue(undefined)
  })

  it('preserves invitation search params through login redirect', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invitations/accept" element={<div>Invitation resume</div>} />
      </Routes>,
      [
        {
          pathname: '/login',
          state: {
            from: {
              pathname: '/invitations/accept',
              search: '?token=test-token',
            },
          },
        },
      ],
    )

    await user.type(screen.getByLabelText(/user id/i), 'owner-demo')
    await user.type(screen.getByLabelText(/email/i), 'owner@acme.io')
    await user.click(screen.getByRole('button', { name: /sign in and continue/i }))

    expect(loginMock).toHaveBeenCalledWith({
      userId: 'owner-demo',
      email: 'owner@acme.io',
      role: 'User',
    })
    expect(await screen.findByText('Invitation resume')).toBeInTheDocument()
  })
})
