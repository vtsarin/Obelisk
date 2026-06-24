import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

export const TooltipProvider = RadixTooltip.Provider;

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  shortcut?: string;
}

/** Small, themed tooltip. Wrap any focusable trigger. */
export function Tooltip({ content, children, side = 'top', shortcut }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-[60] flex items-center gap-2 rounded-md bg-text-primary px-2 py-1 text-xs font-medium text-surface-primary shadow-md
                     data-[state=delayed-open]:animate-scale-fade select-none"
        >
          {content}
          {shortcut && (
            <span className="rounded bg-white/20 px-1 py-0.5 text-[10px] tracking-wide">
              {shortcut}
            </span>
          )}
          <RadixTooltip.Arrow className="fill-text-primary" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
