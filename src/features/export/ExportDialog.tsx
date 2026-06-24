import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { workspaceStore } from '@/db/workspaceStore.impl';
import { exportToJSON } from './toJSON';
import { triggerPrint } from './printToPDF';
import { FileJson, FileText, Globe, Printer, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ExportFormat = 'json' | 'markdown' | 'html' | 'pdf';

const formats: { value: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'json', label: 'JSON', description: 'Lossless, re-importable', icon: <FileJson className="w-5 h-5" /> },
  { value: 'markdown', label: 'Markdown (.zip)', description: 'Portable with images', icon: <FileText className="w-5 h-5" /> },
  { value: 'html', label: 'HTML', description: 'Self-contained, opens offline', icon: <Globe className="w-5 h-5" /> },
  { value: 'pdf', label: 'PDF', description: 'Print-based, vector text', icon: <Printer className="w-5 h-5" /> },
];

export function ExportDialog() {
  const open = useWorkspaceStore((s) => s.exportDialogOpen);
  const setOpen = useWorkspaceStore((s) => s.setExportDialogOpen);
  const activeDoc = useActiveDoc();
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!activeDoc || !activeDocId) return;

    setExporting(true);
    try {
      const content = await workspaceStore.loadContent(activeDocId);
      if (!content) {
        alert('No content to export');
        return;
      }

      switch (selectedFormat) {
        case 'json':
          exportToJSON(activeDoc, content.state);
          break;
        case 'markdown': {
          // Need editor reference — lazy import to avoid circular deps
          const { exportToMarkdownZip } = await import('./toMarkdown');
          // We'll need to dispatch to get editor — for now use a simplified approach
          window.dispatchEvent(new CustomEvent('obelisk:export-markdown', { detail: { doc: activeDoc } }));
          break;
        }
        case 'html': {
          window.dispatchEvent(new CustomEvent('obelisk:export-html', { detail: { doc: activeDoc } }));
          break;
        }
        case 'pdf':
          triggerPrint();
          break;
      }
      setOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check the console for details.');
    } finally {
      setExporting(false);
    }
  }, [activeDoc, activeDocId, selectedFormat, setOpen]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-overlay-show" />
        <Dialog.Content className="fixed top-[18%] left-1/2 -translate-x-1/2 w-[440px] max-w-[92vw] bg-surface-primary border border-surface-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-scale-fade">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <Dialog.Title className="text-base font-semibold text-text-primary">
              Export Document
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-surface-hover">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5">
            {!activeDoc && (
              <p className="text-sm text-text-tertiary mb-4">No document selected.</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              {formats.map((fmt) => (
                <button
                  key={fmt.value}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors text-center',
                    selectedFormat === fmt.value
                      ? 'border-accent bg-accent-soft'
                      : 'border-surface-border hover:border-accent hover:bg-surface-hover'
                  )}
                  onClick={() => setSelectedFormat(fmt.value)}
                >
                  <span className={selectedFormat === fmt.value ? 'text-accent-fg' : 'text-text-tertiary'}>
                    {fmt.icon}
                  </span>
                  <span className="text-sm font-medium text-text-primary">{fmt.label}</span>
                  <span className="text-xs text-text-tertiary">{fmt.description}</span>
                </button>
              ))}
            </div>

            <button
              className={cn(
                'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeDoc
                  ? 'bg-accent text-white hover:bg-accent-hover'
                  : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
              )}
              onClick={handleExport}
              disabled={!activeDoc || exporting}
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
