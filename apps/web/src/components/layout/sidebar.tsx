'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  FolderOpen,
  User,
  LayoutDashboard,
  Phone,
  Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/calls', label: 'Calls', icon: Phone },
  { href: '/graph', label: 'Knowledge', icon: Network },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-void-border bg-void lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-muted text-amber'
                  : 'text-ash hover:bg-void-lighter hover:text-white',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
