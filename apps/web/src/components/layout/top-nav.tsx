import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-void-border bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-semibold"
        >
          <Sparkles className="h-5 w-5 text-amber" />
          <span>Future Folklore</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="text-ash hover:text-white transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
