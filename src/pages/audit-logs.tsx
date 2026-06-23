import { ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/molecules/page-header'
import { AuditLogWorkspace } from '@/components/organisms/audit-log-workspace'
import { Badge } from '@/components/ui/badge'

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        description="Admin-only operational history for authentication, CRUD events, settings changes, exports, notifications, and document actions."
        actions={
          <Badge className="bg-primary/10 text-primary">
            <ShieldCheck className="mr-1 size-3" aria-hidden="true" />
            Admin Only
          </Badge>
        }
      />

      <AuditLogWorkspace />
    </div>
  )
}
