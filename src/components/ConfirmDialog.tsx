import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/cn';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[70] animate-overlay-show" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[92vw] bg-surface-primary border border-surface-border rounded-2xl shadow-xl z-[70] p-5 animate-dialog-show"
          onClick={(e) => e.stopPropagation()}
        >
          <Dialog.Title className="text-base font-semibold text-text-primary">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1.5 text-sm text-text-secondary leading-relaxed">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              autoFocus
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={cn(
                'px-3.5 py-2 rounded-lg text-sm font-medium text-white transition-colors',
                destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent-hover'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
