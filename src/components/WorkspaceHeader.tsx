"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      <header className="bg-background border-b border-on-surface flex justify-between items-center w-full px-4 md:px-container-padding h-16 fixed top-0 z-50 select-none">
        {/* Logo/Brand */}
        <div className="font-headline-sm text-xs min-[380px]:text-sm sm:text-headline-sm font-bold text-on-surface tracking-widest uppercase truncate max-w-[200px] min-[360px]:max-w-[240px] sm:max-w-none">
          <Link href="/">{logo}</Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-4 lg:gap-6 font-body-md text-body-md uppercase tracking-tighter items-center h-full">
          {navLinks.map(link => {
            const isActive = pathname === link.path || (link.path === "/workspace/image" && pathname.startsWith("/workspace/image"));
            return (
              <Link
                key={link.path}
                href={link.path}
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
        <div className="hidden md:flex gap-4">
          <Link href="/billing">
            <button className="px-4 py-2 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer">
              Upgrade
            </button>
          </Link>
          <Link href="/settings">
            <button className="px-4 py-2 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer">
              Settings
            </button>
          </Link>
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
          className="md:hidden fixed top-16 left-0 w-full bg-background border-b border-carbon z-40 p-6 flex flex-col gap-6 shadow-lg select-none"
        >
          <nav className="flex flex-col gap-4 font-body-md text-body-md uppercase">
            {navLinks.map(link => {
              const isActive = pathname === link.path || (link.path === "/workspace/image" && pathname.startsWith("/workspace/image"));
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-4 px-4 border-l-4 transition-all min-h-[44px] flex items-center ${
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
            <Link href="/billing" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <button className="w-full py-4 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white cursor-pointer text-center min-h-[44px]">
                Upgrade
              </button>
            </Link>
            <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <button className="w-full py-4 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full cursor-pointer text-center min-h-[44px]">
                Settings
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
