import Link from 'next/link';
import { Sparkles, Users, FlaskConical, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Users,
    title: 'Research Community',
    description:
      'Connect with researchers, investors, and practitioners exploring the frontiers of science.',
  },
  {
    icon: FlaskConical,
    title: 'Project Incubator',
    description:
      'Launch and manage frontier research projects with structured support and peer review.',
  },
  {
    icon: Globe,
    title: 'Open Knowledge',
    description:
      'Share findings, methodologies, and data across disciplines in a collaborative platform.',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-void-border bg-void/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Sparkles className="h-5 w-5 text-amber" />
            <span>Future Folklore</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Join</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="animate-fade-in space-y-6 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Where frontier science{' '}
            <span className="text-amber">takes root</span>
          </h1>
          <p className="text-lg text-ash sm:text-xl">
            Future Folklore is a research incubator for ideas at the edge of
            knowledge. We bring together researchers, practitioners, and
            investors to explore what science hasn&apos;t explained yet.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/directory">
              <Button variant="outline" size="lg">
                Browse community
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-void-border bg-void-light py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-muted">
                  <feature.icon className="h-5 w-5 text-amber" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-ash">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-void-border bg-void py-8 text-center text-xs text-ash-dark">
        <p>Future Folklore Platform &mdash; Exploring the edge of knowledge</p>
      </footer>
    </div>
  );
}
