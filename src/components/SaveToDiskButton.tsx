import React from 'react';
import { HardDriveDownload, HardDrive, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { cn } from '@/lib/cn';

export function SaveToDiskButton() {
  const supported = useWorkspaceStore((s) => s.diskSupported);
  const connected = useWorkspaceStore((s) => s.diskConnected);
  const dirty = useWorkspaceStore((s) => s.diskDirty);
  const status = useWorkspaceStore((s) => s.diskStatus);
  const saveToDisk = useWorkspaceStore((s) => s.saveToDisk);

  if (!supported) {
    return (
      <button
        disabled
        title="Saving to a folder needs Chrome or Edge"
        className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-surface-border text-xs font-medium text-text-tertiary opacity-60 cursor-not-allowed"
      >
        <HardDrive className="w-3.5 h-3.5" />
        <span>Save to disk</span>
      </button>
    );
  }

  const syncing = status === 'syncing';
  const saved = status === 'saved';
  const failed = status === 'error' || status === 'denied';

  const Icon = syncing ? Loader2 : saved ? Check : failed ? AlertTriangle : HardDriveDownload;
  const label = syncing
    ? 'Saving…'
    : saved
      ? 'Saved'
      : status === 'denied'
        ? 'Allow folder access'
        : status === 'error'
          ? 'Retry save'
          : dirty || !connected
            ? 'Save to disk'
            : 'In sync';

  // Highlight loudly whenever there are unsaved changes.
  const highlighted = dirty && !syncing && !failed;

  return (
    <button
      onClick={() => void saveToDisk()}
      disabled={syncing}
      aria-label={connected ? 'Save workspace to folder' : 'Choose a folder and save workspace'}
      title={
        connected
          ? 'Write the latest workspace to your folder'
          : 'Pick a folder to keep a real, visible copy of your workspace on disk'
      }
      className={cn(
        'flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors',
        highlighted &&
          'bg-accent-soft text-accent-fg border-accent-soft hover:bg-accent-soft-hover',
        !highlighted && !failed &&
          'border-surface-border text-text-secondary hover:bg-surface-hover hover:text-text-primary',
        failed && 'border-red-500/40 text-red-500 hover:bg-red-500/10',
        syncing && 'opacity-80 cursor-wait'
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
      <span>{label}</span>
      {highlighted && (
        <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      )}
    </button>
  );
}
