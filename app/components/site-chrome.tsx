'use client';

import Link from 'next/link';
import { Menu, X, LogIn, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Button from './Button';
import { NavLink } from './ui/nav-link';
import { supabase } from '@/lib/supabase';

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [policiesCount, setPoliciesCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const primaryNavLinks = [
    { href: '/', label: 'Overview' },
    { href: '/search', label: 'Database' },
    { href: '/countries', label: 'Countries' },
    { href: '/about', label: 'About' },
  ];

  const isActivePath = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    checkUser();
    fetchPoliciesCount();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const fetchPoliciesCount = async () => {
    try {
      const response = await fetch('/api/policies');
      if (response.ok) {
        const data = await response.json();
        setPoliciesCount(data.data?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching policies count:', err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  const getRoleName = (roleId: number) => {
    const roles: { [key: number]: string } = {
      1: 'admin',
      2: 'moderator',
      3: 'expert',
      4: 'user',
      5: 'guest'
    };
    return roles[roleId] || 'user';
  };

  const loadProfile = async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, avatar_url, role_id')
      .eq('id', userId)
      .single();
    if (profile) setUserProfile(profile);
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      loadProfile(session.user.id);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setDropdownOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-rule">
      {/* Top Navigation Bar - All on one line */}
      <nav className="mx-auto max-w-350 px-4 py-3 md:px-6 flex items-center justify-between gap-4 md:gap-8">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group hover:opacity-85 transition-opacity">
          {/* Wave/Ripple Logo */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M4 16C4 16 8 10 16 10C24 10 28 16 28 16" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 20C2 20 7 12 16 12C25 12 30 20 30 20" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M6 22C6 22 10 18 16 18C22 18 26 22 26 22" stroke="#E88860" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <div className="flex flex-col">
            <div className="hidden md:block font-display font-bold text-2xl text-coral leading-tight whitespace-nowrap">Plastic Policy Database</div>
          </div>
        </Link>

        {/* Center Navigation - Hidden on mobile */}
        <div className="hidden md:flex flex-1 items-center justify-center gap-8">
          {primaryNavLinks.map((link) => (
            <NavLink key={link.href} href={link.href} className={isActivePath(link.href) ? 'text-coral' : ''}>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-3">
            <Button href="/search" className="whitespace-nowrap shrink-0">
              Browse {policiesCount} Policies →
            </Button>
            {user ? (
              // User logged in - show dropdown menu
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 hover:bg-ink/5 rounded-full transition text-ink flex items-center justify-center font-medium"
                >
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-ink/20"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-paper border border-rule rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-rule flex items-center gap-3">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-ink/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-sand border border-ink/20 flex items-center justify-center text-lg">
                          📷
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-ink">{userProfile?.display_name || user.email}</p>
                        <p className="text-xs text-ink/60">{getRoleName(userProfile?.role_id)}</p>
                      </div>
                    </div>
                    {userProfile?.role_id === 1 && (
                      <Link
                        href="/admin"
                        className="px-4 py-2 text-sm text-coral hover:bg-sand transition flex items-center gap-2 border-b border-rule font-medium"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2 border-t border-rule font-medium"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      My Dashboard
                    </Link>
                    <Link
                      href={`/profile/${user?.id}`}
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      href={`/profile/${user?.id}/followers`}
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👥 Network
                    </Link>
                    <Link
                      href={`/profile/${user?.id}/bookmarks`}
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      📌 Bookmarks
                    </Link>
                    <Link
                      href="/settings"
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <Link
                      href={`/profile/${user?.id}/edit`}
                      className="px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ✏️ Edit Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-sand transition flex items-center gap-2 border-t border-rule"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // User not logged in - show login button
              <Link
                href="/auth/login"
                className="p-2 hover:bg-ink/5 rounded-lg transition text-ink"
                title="Login"
              >
                <LogIn className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden items-center gap-2 rounded-full border border-ink/20 px-3 py-2 hover:bg-ink/5 transition shrink-0"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <>
                <X className="w-4 h-4 text-ink" />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4 text-ink" />
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">Menu</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rule bg-paper/95 backdrop-blur">
          <div className="mx-auto max-w-350 px-4 py-4 md:px-6 flex flex-col gap-3">
            <div className="px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Navigate</div>
            {primaryNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-4 py-2 transition font-fraunces text-lg ${isActivePath(link.href) ? 'bg-sand text-coral' : 'hover:bg-sand text-ink'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-rule flex flex-col gap-2">
              <Button href="/search" className="flex-1 justify-center" onClick={() => setMobileMenuOpen(false)}>
                Browse {policiesCount} Policies →
              </Button>
              {user ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Edit Profile
                  </Link>
                  {userProfile?.role_id === 1 && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 rounded-lg hover:bg-sand transition text-ink text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg hover:bg-sand transition text-ink text-center flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="p-3 hover:bg-ink/5 rounded-lg transition text-ink flex items-center justify-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-5 h-5" />
                  Login
                </Link>
              )}
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
        <div className="grid grid-cols-1 gap-8 mb-12 sm:grid-cols-2 lg:grid-cols-4">
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
