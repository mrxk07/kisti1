import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-lg font-semibold mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
