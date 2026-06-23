import React from 'react';

export function PrintView() {
  // This component renders during print mode only
  // In v1 we rely on the browser's print CSS to style the editor content
  return (
    <div className="print-view hidden">
      {/* Print-specific header/footer will be injected via CSS @page */}
    </div>
  );
}
