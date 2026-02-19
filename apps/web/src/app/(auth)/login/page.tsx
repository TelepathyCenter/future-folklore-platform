import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { signIn } from '@/lib/auth/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-void p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your Future Folklore account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params.error && (
            <p className="rounded-md bg-error/10 p-3 text-sm text-error">
              {params.error}
            </p>
          )}
          {params.success && (
            <p className="rounded-md bg-success/10 p-3 text-sm text-success">
              {params.success}
            </p>
          )}
          <OAuthButtons />
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-void-light px-2 text-xs text-ash">
              or
            </span>
          </div>
          <form action={signIn} className="space-y-4">
            <input
              type="hidden"
              name="next"
              value={params.next ?? '/dashboard'}
            />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-electric hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit">
              Sign in
            </Button>
          </form>
          <p className="text-center text-xs text-ash">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-electric hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
