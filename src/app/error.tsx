'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
        <p className="text-sm text-muted-foreground mb-8">
          An unexpected error occurred. Please try again or go back to the home page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go Home
          </Button>
          <Button
            onClick={reset}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
