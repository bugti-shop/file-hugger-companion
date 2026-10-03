import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const FloatingAddButton = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof Button>>(
  ({ className, children, style, ...props }, ref) => (
    <Button
      ref={ref}
      size="icon"
      className={cn('fixed right-4 z-50 h-14 w-14 rounded-[18px] border-b-0 p-0 shadow-lg active:translate-y-0 active:scale-95 md:right-6', className)}
      style={{ bottom: 'calc(4.75rem + var(--safe-bottom, 0px))', ...style }}
      aria-label={typeof children === 'string' ? children : 'Add'}
      title={typeof children === 'string' ? children : 'Add'}
      {...props}
    >
      <Plus className="!h-7 !w-7" strokeWidth={2.7} />
    </Button>
  ),
);
FloatingAddButton.displayName = 'FloatingAddButton';