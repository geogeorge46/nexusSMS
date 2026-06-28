import { WalletCards } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { displayRef, getFeeErrorMessage, useStudentPortalFees } from '@/hooks/use-fees'

export function MyFeesPage() {
  const { data, error, isError, isLoading } = useStudentPortalFees()

  if (isError) return <Message title="Fees unavailable" message={getFeeErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Fees</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Fee Summary</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your assigned fee records, payment status, and due dates.</p>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-20" key={index} />)}</div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3">Due</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-bold">{displayRef(item.feeStructureId)}</td>
                    <td className="px-5 py-4">{currency(item.totalAmount)}</td>
                    <td className="px-5 py-4">{currency(item.paidAmount)}</td>
                    <td className="px-5 py-4">{currency(item.dueAmount)}</td>
                    <td className="px-5 py-4">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><Badge>{item.isOverdue && item.status !== 'Paid' ? 'Overdue' : item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Message compact title="No fees assigned" message="Your fee details will appear here after finance assigns your semester fees." />
        )}
      </GlassCard>
    </div>
  )
}

function Message({ title, message, compact = false }: { title: string; message: string; compact?: boolean }) {
  return (
    <div className={compact ? 'p-8 text-center' : 'rounded-[18px] border border-border/70 bg-background/70 p-8 text-center'}>
      <WalletCards className="mx-auto mb-3 size-8 text-primary" />
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
