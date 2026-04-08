import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import OrgDetailPage from './OrgDetailPage'
import { renderWithProviders } from '../test/renderWithProviders'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'member@acme.io',
    },
  }),
}))

vi.mock('../api/organizations', () => ({
  deleteOrganization: vi.fn(),
  getOrgLicenses: vi.fn().mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  }),
  getOrganization: vi.fn().mockResolvedValue({
    id: 'org-1',
    name: 'Acme',
    description: 'Workspace',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    memberCount: 3,
  }),
}))

vi.mock('../api/memberships', () => ({
  getMyOrganization: vi.fn().mockResolvedValue({
    id: 'org-1',
    name: 'Acme',
    description: 'Workspace',
    role: 'Member',
    joinedAt: '2026-01-03T00:00:00Z',
  }),
}))

describe('OrgDetailPage', () => {
  it('hides manager-only tabs for regular members', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/organizations/:orgId" element={<OrgDetailPage />} />
      </Routes>,
      ['/organizations/org-1'],
    )

    expect(await screen.findByRole('heading', { name: 'Acme', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /licenses/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /members/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /invitations/i })).not.toBeInTheDocument()
  })
})
