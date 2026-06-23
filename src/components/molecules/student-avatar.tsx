import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const tones = [
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-amber-500/15 text-amber-800 dark:text-amber-300',
]

export function StudentAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const tone = tones[name.length % tones.length]

  return (
    <Avatar className={cn('size-11', className)}>
      <AvatarFallback className={cn('font-bold', tone)}>{initials}</AvatarFallback>
    </Avatar>
  )
}
