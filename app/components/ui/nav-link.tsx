'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link 
      href={href}
      className={`
        text-xs font-semibold transition tracking-wider uppercase whitespace-nowrap
        ${isActive 
          ? 'bg-ink text-paper px-4 py-2 rounded-full' 
          : 'text-ink hover:text-coral'
        }
        ${className}
      `}
    >
      {children}
    </Link>
  );
}
