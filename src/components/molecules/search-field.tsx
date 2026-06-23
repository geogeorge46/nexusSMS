import { Search } from 'lucide-react'

export function SearchField() {
  return (
    <label className="relative hidden w-full max-w-md items-center md:flex">
      <span className="sr-only">Search Nexus</span>
      <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" aria-hidden="true" />
      <input
        className="h-11 w-full rounded-[18px] border border-border/70 bg-background/70 pl-11 pr-4 text-sm font-medium text-foreground shadow-inner outline-none backdrop-blur-xl transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        placeholder="Search students, classes, records..."
        type="search"
      />
    </label>
  )
}
