import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-3 left-3 z-50 w-[min(340px,calc(100vw-24px))] rounded-[20px] border border-border bg-card p-3 shadow-glass outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            aria-label="Close navigation"
            className="absolute right-3 top-3"
            size="icon"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description
