import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[color:var(--border)] bg-[rgba(250,244,234,0.74)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <Link to="/organizations" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-sm font-bold uppercase tracking-[0.18em] text-white">
                  OL
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted-strong)]">
                    Workspace
                  </p>
                  <p className="text-lg font-semibold text-[color:var(--text-strong)]">OrgLicenseManager</p>
                </div>
              </Link>
              <nav className="hidden gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1 sm:flex">
                <NavLink
                  to="/organizations"
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[color:var(--accent)] text-white'
                        : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]'
                    }`
                  }
                >
                  Organizations
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin/licenses"
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-[color:var(--accent)] text-white'
                          : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]'
                      }`
                    }
                  >
                    Admin Licenses
                  </NavLink>
                )}
              </nav>
            </div>
            <div className="relative self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-medium text-[color:var(--text-strong)] transition hover:border-[color:var(--border-strong)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent)]">
                  {user?.email?.charAt(0).toUpperCase() ?? '?'}
                </span>
                <span className="hidden max-w-[220px] truncate text-left sm:block">
                  <span className="block text-sm">{user?.email}</span>
                  <span className="block text-xs text-[color:var(--text-muted)]">
                    {isAdmin ? 'System Admin' : 'Member Workspace'}
                  </span>
                </span>
                <span className="text-[color:var(--text-muted)]">▼</span>
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2 shadow-[0_24px_48px_rgba(24,22,14,0.18)]">
                    <div className="border-b border-[color:var(--border)] px-4 py-3 text-xs uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">
                      {user?.role}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[color:var(--text-strong)] transition hover:bg-[rgba(28,40,68,0.06)]"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <nav className="flex gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1 sm:hidden">
            <NavLink
              to="/organizations"
              className={({ isActive }) =>
                `flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[color:var(--accent)] text-white'
                    : 'text-[color:var(--text-muted)]'
                }`
              }
            >
              Organizations
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin/licenses"
                className={({ isActive }) =>
                  `flex-1 rounded-full px-3 py-2 text-center text-sm font-semibold transition ${
                    isActive
                      ? 'bg-[color:var(--accent)] text-white'
                      : 'text-[color:var(--text-muted)]'
                  }`
                }
              >
                Licenses
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
