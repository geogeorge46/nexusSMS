import { ShieldCheck } from 'lucide-react'

import { PageHeader } from '@/components/molecules/page-header'
import { AdminManagementWorkspace } from '@/components/organisms/admin-management-workspace'
import { Badge } from '@/components/ui/badge'

export function AdminManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access Control"
        title="Admin Management"
        description="Provision administrators, assign privileged roles, and secure account access."
        actions={<Badge className="bg-violet-500/10 text-violet-700 dark:text-violet-300"><ShieldCheck className="mr-1 size-3" />Super Admin Only</Badge>}
      />
      <AdminManagementWorkspace />
    </div>
  )
}
