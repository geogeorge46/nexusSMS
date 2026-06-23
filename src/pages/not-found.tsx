import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The requested Nexus route does not exist.</p>
        <Button asChild className="mt-6">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}
