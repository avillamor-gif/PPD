'use client';

import Link from 'next/link';
import { Menu, X, LogIn } from 'lucide-react';
import { useState } from 'react';
import Button from './Button';
import { NavLink } from './ui/nav-link';
import { useIsMobile } from '@/lib/hooks';

export function SiteHeader() {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-rule">
      {/* Top Navigation Bar - All on one line */}
      <nav className="mx-auto px-6 py-3 flex items-center justify-between gap-8">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group hover:opacity-85 transition-opacity">
          {/* Wave/Ripple Logo */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M4 16C4 16 8 10 16 10C24 10 28 16 28 16" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 20C2 20 7 12 16 12C25 12 30 20 30 20" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <div className="flex flex-col">
            <div className="font-display font-bold text-2xl text-coral leading-tight whitespace-nowrap">Plastic Policy Database</div>
          </div>
        </Link>

        {/* Center Navigation - Hidden on mobile */}
        {!isMobile && (
          <div className="flex-1 flex items-center justify-center gap-8">
            <NavLink href="/">Overview</NavLink>
            <NavLink href="/search">Database</NavLink>
            <NavLink href="/countries">Countries</NavLink>
            <NavLink href="/about">About</NavLink>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          {!isMobile && (
            <>
              <Button href="/search" className="whitespace-nowrap shrink-0">
                Browse 25+ Policies →
              </Button>
              <Link
                href="/auth/login"
                className="p-2 hover:bg-ink/5 rounded-lg transition text-ink"
                title="Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-ink/5 rounded-lg transition shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-ink" />
              ) : (
                <Menu className="w-6 h-6 text-ink" />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="border-t border-rule bg-paper/95 backdrop-blur">
          <div className="mx-auto px-6 py-4 flex flex-col gap-3">
            <Link href="/" className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink font-fraunces text-lg" onClick={() => setMobileMenuOpen(false)}>
              Overview
            </Link>
            <Link href="/search" className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink font-fraunces text-lg" onClick={() => setMobileMenuOpen(false)}>
              Database
            </Link>
            <Link href="/countries" className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink font-fraunces text-lg" onClick={() => setMobileMenuOpen(false)}>
              Countries
            </Link>
            <Link href="/about" className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink font-fraunces text-lg" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <div className="pt-2 border-t border-rule flex gap-3">
              <Button href="/search" className="flex-1 justify-center" onClick={() => setMobileMenuOpen(false)}>
                Browse 25+ Policies →
              </Button>
              <Link
                href="/auth/login"
                className="p-3 hover:bg-ink/5 rounded-lg transition text-ink shrink-0 flex items-center justify-center"
                title="Login"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-primary text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-display font-semibold mb-4 text-base">Database</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="/search" className="hover:text-white transition">Search Regulations</a></li>
              <li><a href="/countries" className="hover:text-white transition">Browse Countries</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-base">About</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="/about" className="hover:text-white transition">What's Included</a></li>
              <li><a href="/about#scope" className="hover:text-white transition">Methodology</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-base">Contribute</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-white transition">Submit a Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Report an Error</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-semibold mb-4 text-base">Connect</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="/about" className="hover:text-white transition">What's in</a></li>
              <li><a href="/about" className="hover:text-white transition">What's out</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-xs text-primary-foreground/60">
          <p>© 2024 Plastic Policy Project. All rights reserved.</p>
          <p>"Last updated: June 2024"</p>
        </div>
      </div>
    </footer>
  );
}
