import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getStudentPortalErrorMessage, useStudentPortalSupport } from '@/hooks/use-student-portal'

export function HelpSupportPage() {
  const { data, error, isError, isLoading } = useStudentPortalSupport()

  if (isError) return <Message title="Support unavailable" message={getStudentPortalErrorMessage(error)} />

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <Badge className="mb-3 border-primary/20 bg-primary/10 text-primary">Help & Support</Badge>
        <h1 className="text-3xl font-bold tracking-normal text-foreground">Student Support</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">FAQ, office contacts, and placeholders for future support requests.</p>
      </GlassCard>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <GlassCard className="p-5">
          <h2 className="text-lg font-bold text-foreground">FAQs</h2>
          <div className="mt-4 space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton className="h-20" key={index} />)
              : data?.faqs.map((faq) => (
                  <div className="rounded-[16px] border border-border/70 bg-muted/35 p-4" key={faq.question}>
                    <p className="text-sm font-bold text-foreground">{faq.question}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="text-lg font-bold text-foreground">Contacts</h2>
            <div className="mt-4 space-y-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton className="h-12" key={index} />)
                : data?.contacts.map((contact) => (
                    <div className="rounded-[14px] border border-border/70 bg-muted/35 p-3" key={contact.label}>
                      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{contact.label}</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{contact.value}</p>
                    </div>
                  ))}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h2 className="text-lg font-bold text-foreground">Raise Request</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Ticketing is not enabled yet. This placeholder can connect to a support API later.</p>
            <Button className="mt-4" disabled type="button" variant="glass">Support Requests Coming Soon</Button>
          </GlassCard>
        </div>
      </section>
    </div>
  )
}

function Message({ title, message }: { title: string; message: string }) {
  return (
    <GlassCard className="p-8 text-center">
      <p className="text-lg font-bold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </GlassCard>
  )
}
