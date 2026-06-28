import { ReceiptText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { displayRef, getFeeErrorMessage, useStudentPortalReceipts } from '@/hooks/use-fees'

export function MyReceiptsPage() {
  const { data, error, isError, isLoading } = useStudentPortalReceipts()

  if (isError) return <Message title="Receipts unavailable" message={getFeeErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">My Receipts</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Payment Receipts</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Receipts generated after fee payments are recorded by finance.</p>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, index) => <Skeleton className="h-20" key={index} />)}</div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-bold">{item.receiptNumber}</td>
                    <td className="px-5 py-4">{displayRef(item.studentId)}</td>
                    <td className="px-5 py-4">{currency(item.amount)}</td>
                    <td className="px-5 py-4">{displayRef(item.paymentId, 'method')}</td>
                    <td className="px-5 py-4">{new Date(item.issuedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Message compact title="No receipts yet" message="Receipts will appear here after payments are recorded." />
        )}
      </GlassCard>
    </div>
  )
}

function Message({ title, message, compact = false }: { title: string; message: string; compact?: boolean }) {
  return (
    <div className={compact ? 'p-8 text-center' : 'rounded-[18px] border border-border/70 bg-background/70 p-8 text-center'}>
      <ReceiptText className="mx-auto mb-3 size-8 text-primary" />
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}
