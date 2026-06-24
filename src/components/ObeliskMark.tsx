import React, { useId } from 'react';

/**
 * The Obelisk brand mark — four stacked, tapered blocks in the teal→blue ramp.
 * Brand colors are fixed (independent of the UI accent). `useId` keeps the
 * clip-path id unique so multiple marks can coexist on the page.
 */
export function ObeliskMark({ className = 'w-6 h-6' }: { className?: string }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <path d="M28 8 L36 8 L40 56 L24 56 Z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="22" y="6" width="20" height="6" rx="2" fill="#0EA5A4" />
        <rect x="22" y="13" width="20" height="14" rx="2" fill="#14B8B6" />
        <rect x="22" y="28" width="20" height="16" rx="2" fill="#3B82C4" />
        <rect x="22" y="45" width="20" height="18" rx="2" fill="#2563A8" />
      </g>
      <rect x="26" y="58" width="12" height="3" rx="1.5" fill="#1E4E82" />
    </svg>
  );
}
