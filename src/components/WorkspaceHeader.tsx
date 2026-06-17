"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export interface NavLinkItem {
  label: string;
  path: string;
}

export interface WorkspaceHeaderProps {
  logo: string;
  navLinks: NavLinkItem[];
}

export default function WorkspaceHeader({ logo, navLinks }: WorkspaceHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = React.useState<{
    authenticated: boolean;
    role: string;
    credits: number;
    identifier?: string;
  } | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  React.useEffect(() => {
    fetchSession();
    window.addEventListener("morpee_credits_changed", fetchSession);
    return () => {
      window.removeEventListener("morpee_credits_changed", fetchSession);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  React.useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const renderSessionBadge = (isMobile = false) => {
    if (!session || !session.authenticated) return null;

    let label = "";
    if (session.role === "guest") {
      label = `Guest: ${session.credits} Credits`;
    } else if (session.role === "candidate") {
      label = `Candidate Pass: ${session.credits} Credits`;
    } else if (session.role === "operator") {
      label = `Operator Pass: ${session.credits} Credits`;
    } else if (session.role === "enterprise") {
      label = `Enterprise: Unlimited`;
    } else {
      label = `Standard: ${session.credits} Credits`;
    }

    return (
      <div className={`flex items-center px-4 py-1.5 border rounded-full font-metadata text-[11px] tracking-wide select-none transition-all duration-300 ${
        isMobile ? "w-full justify-center mb-2" : ""
      } bg-muted-teal/10 border-muted-teal/20 text-muted-teal font-medium`}>
        <span className="w-1.5 h-1.5 rounded-full bg-muted-teal mr-2"></span>
        {label}
      </div>
    );
  };

  const getIsActive = (linkPath: string) => {
    if (linkPath.includes("?")) {
      const parts = linkPath.split("?");
      const base = parts[0];
      const query = parts[1] || "";
      const queryParts = query.split("=");
      const key = queryParts[0];
      const val = queryParts[1];
      return pathname === base && searchParams.get(key) === val;
    }
    return pathname === linkPath;
  };

  return (
    <>
      <header className="bg-background border-b border-on-surface flex justify-between items-center w-full px-4 md:px-container-padding h-16 fixed top-0 z-50 select-none">
        {/* Logo/Brand */}
        <div className="font-headline-sm text-xs min-[380px]:text-sm sm:text-headline-sm font-bold text-on-surface tracking-widest uppercase truncate max-w-[200px] min-[360px]:max-w-[240px] sm:max-w-none">
          <Link href={session?.authenticated ? "/workspace" : "/"}>{logo}</Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 lg:gap-6 font-body-md text-body-md uppercase tracking-tighter items-center h-full">
          {navLinks.map(link => {
            const isActive = getIsActive(link.path);
            const protectedPaths = ["/workspace", "/ops", "/settings", "/billing"];
            const isProtectedPath = protectedPaths.some(p => link.path === p || link.path.startsWith(p + "/"));
            const destination = (session?.authenticated || !isProtectedPath)
              ? link.path
              : `/auth/sign-in?redirect=${encodeURIComponent(link.path)}`;
            return (
              <Link
                key={link.path}
                href={destination}
                prefetch={session?.authenticated ? undefined : false}
                className={`transition-colors py-1 px-2 border-b-2 flex h-full items-center ${
                  isActive
                    ? "text-on-surface border-primary font-bold"
                    : "text-secondary border-transparent hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Utility Controls */}
        <div className="hidden md:flex gap-4 items-center">
          {session?.authenticated ? (
            <>
              {renderSessionBadge(false)}
              <Link href="/billing" className="px-4 py-2 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer">
                Upgrade
              </Link>
              <Link href="/settings" className="px-4 py-2 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-error text-error rounded-full font-label-bold text-[10px] tracking-wider uppercase transition-colors hover:bg-error hover:text-white cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : session !== null ? (
            <>
              <Link href="/auth/sign-in" className="px-4 py-2 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="px-4 py-2 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="h-10 w-24 bg-surface-container-high animate-pulse rounded-full"></div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="md:hidden flex items-center justify-center p-2 border border-carbon rounded-full hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? "Close main navigation menu" : "Open main navigation menu"}
        >
          <span className="material-symbols-outlined text-[24px]">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Mobile Navigation Dropdown Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="md:hidden fixed top-16 left-0 w-full bg-background border-b border-carbon z-40 p-6 flex flex-col gap-6 shadow-lg select-none max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          <nav className="flex flex-col gap-2 font-body-md text-body-md uppercase">
            <div className="px-4 py-2 text-[9px] text-secondary font-metadata tracking-wider uppercase border-b border-carbon/10 opacity-60">
              Navigation Menu
            </div>
            {navLinks.map(link => {
              const isActive = getIsActive(link.path);
              const protectedPaths = ["/workspace", "/ops", "/settings", "/billing"];
              const isProtectedPath = protectedPaths.some(p => link.path === p || link.path.startsWith(p + "/"));
              const destination = (session?.authenticated || !isProtectedPath)
                ? link.path
                : `/auth/sign-in?redirect=${encodeURIComponent(link.path)}`;
              return (
                <Link
                  key={link.path}
                  href={destination}
                  prefetch={session?.authenticated ? undefined : false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 px-6 border-l-4 transition-all min-h-[44px] flex items-center text-xs font-label-bold ${
                    isActive
                      ? "text-on-surface border-primary bg-surface-container-low font-bold"
                      : "text-secondary border-transparent hover:text-on-surface hover:bg-surface-container-low"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <hr className="border-outline-variant" />

          {/* Mobile Utility Actions */}
          <div className="flex flex-col gap-3">
            {session?.authenticated ? (
              <>
                {renderSessionBadge(true)}
                <Link href="/billing" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer text-center min-h-[44px] flex items-center justify-center">
                  Upgrade
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer text-center min-h-[44px] flex items-center justify-center">
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-4 border border-error text-error font-label-bold text-label-bold uppercase transition-colors hover:bg-error hover:text-white rounded-full cursor-pointer text-center min-h-[44px]"
                >
                  Logout
                </button>
              </>
            ) : session !== null ? (
              <>
                <Link href="/auth/sign-in" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer text-center min-h-[44px] flex items-center justify-center">
                  Sign In
                </Link>
                <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer text-center min-h-[44px] flex items-center justify-center">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="h-12 w-full bg-surface-container-high animate-pulse rounded-full"></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

