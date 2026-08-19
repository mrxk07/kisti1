'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { DEMO_BANNER_TEXT } from '@/lib/constants';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-xs sm:text-sm text-amber-800 font-medium flex-1">
          {DEMO_BANNER_TEXT}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-600 hover:text-amber-900 transition-colors p-1 rounded-md hover:bg-amber-100"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
