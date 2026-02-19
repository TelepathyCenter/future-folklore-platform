import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/actions';

export async function TopNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/directory"
                className="text-ash hover:text-white transition-colors"
              >
                Directory
              </Link>
              <Link
                href="/profile"
                className="text-ash hover:text-white transition-colors"
              >
                Profile
              </Link>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Join</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
