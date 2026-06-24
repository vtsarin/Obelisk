import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ACCENTS } from '@/lib/accents';
import { cn } from '@/lib/cn';

export function AccentPicker() {
  const accent = useWorkspaceStore((s) => s.accent);
  const setAccent = useWorkspaceStore((s) => s.setAccent);
  const current = ACCENTS.find((a) => a.name === accent) ?? ACCENTS[0];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label="Accent color"
          title="Accent color"
          className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:bg-surface-hover transition-colors"
        >
          <span
            className="w-4 h-4 rounded-full ring-1 ring-black/10"
            style={{ background: current.swatch }}
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-[60] rounded-xl border border-surface-border bg-surface-primary p-2.5 shadow-lg data-[state=open]:animate-scale-fade"
        >
          <div className="px-0.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Accent color
          </div>
          <div className="flex items-center gap-2">
            {ACCENTS.map((a) => {
              const active = a.name === accent;
              return (
                <button
                  key={a.name}
                  onClick={() => setAccent(a.name)}
                  title={a.label}
                  aria-label={a.label}
                  aria-pressed={active}
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110'
                  )}
                  style={{
                    background: a.swatch,
                    boxShadow: active
                      ? `0 0 0 2px var(--surface-primary), 0 0 0 4px ${a.swatch}`
                      : undefined,
                  }}
                >
                  {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
