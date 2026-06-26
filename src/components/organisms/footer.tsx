import { Link } from 'react-router-dom'

import { useAuth } from '@/hooks/use-auth'
import { isAdmin } from '@/lib/permissions'

export function Footer() {
  const { user } = useAuth()
  const privacyPath = isAdmin(user) ? '/governance' : '/settings'

  return (
    <footer className="border-t border-border/60 px-4 py-5 text-sm text-muted-foreground sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>(c) 2026 Nexus Student Management System</p>
        <div className="flex items-center gap-4">
          <Link className="font-medium transition hover:text-foreground" to={privacyPath}>
            Privacy
          </Link>
          <Link className="font-medium transition hover:text-foreground" to="/settings">
            Support
          </Link>
        </div>
      </div>
    </footer>
  )
}
