"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, logout as apiLogout } from "@/lib/api";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "首页", href: "/" },
  { label: "产业服务", href: "/services" },
  { label: "企业库", href: "/organizations" },
  { label: "AI 服务专员", href: "/agents" },
  { label: "供需撮合", href: "/opportunities" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setLoggedIn(!!getToken());
    const onStorage = () => setLoggedIn(!!getToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pathname]);

  const handleLogout = () => {
    apiLogout();
    setLoggedIn(false);
    setIsOpen(false);
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="sticky top-0 z-50 gradient-primary
                 border-b border-black/10
                 shadow-[0_2px_8px_rgba(10,46,30,0.12)]"
    >
      <div className="flex justify-between items-center px-4 lg:px-6 py-3.5 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 text-white tap-highlight-transparent"
        >
          <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shadow-sm bg-transparent shrink-0">
            <img
              src="/tianjin/logo-nav.png"
              alt="克劳圈"
              className="w-full h-full object-cover"
            />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-xl lg:text-2xl tracking-wide">
              天津高企协
            </span>
            <span className="hidden sm:inline text-xs lg:text-sm font-medium opacity-75 tracking-[0.2em] uppercase">
              ClawQuan Tianjin
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-base lg:text-lg font-medium transition-colors ${
                    active
                      ? "text-white bg-white/10"
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="w-px h-5 bg-white/20 mx-2" />
          {loggedIn ? (
            <>
              <li>
                <Link
                  href="/me"
                  className="px-4 py-2 rounded-md text-base lg:text-lg font-medium
                             text-white/90 hover:text-white hover:bg-white/5 transition-colors"
                >
                  我的
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md text-base lg:text-lg
                             text-white/80 hover:text-white hover:bg-white/5"
                >
                  退出
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link
                href="/login"
                className="ml-1 px-5 py-2 rounded-md text-base lg:text-lg font-semibold
                           bg-gold-400 text-brand-900
                           shadow-[0_2px_6px_rgba(212,162,74,0.35)]
                           hover:bg-gold-500 hover:text-white transition-colors"
              >
                登录
              </Link>
            </li>
          )}
        </ul>

        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-white p-2 -mr-2 min-h-[44px] min-w-[44px]
                     flex items-center justify-center tap-highlight-transparent"
          aria-label="菜单"
          aria-expanded={isOpen}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          isOpen ? "block" : "hidden"
        } lg:hidden bg-white absolute top-full left-0 right-0
          shadow-[0_8px_24px_rgba(16,24,32,0.08)]
          border-t border-ink-100`}
      >
        <ul className="flex flex-col py-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-5 py-3 min-h-[48px]
                              text-[15px] font-medium border-b border-ink-100/70
                              transition-colors ${
                                active
                                  ? "text-brand-700 bg-brand-50"
                                  : "text-ink-700 hover:bg-ink-50"
                              }`}
                >
                  {active && (
                    <span className="w-1 h-5 mr-3 bg-brand-700 rounded-r" />
                  )}
                  <span className={active ? "" : "ml-4"}>{item.label}</span>
                </Link>
              </li>
            );
          })}
          {loggedIn ? (
            <>
              <li>
                <Link
                  href="/me"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-5 py-3 ml-4 text-[15px] font-medium text-ink-700 border-b border-ink-100/70"
                >
                  我的
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 ml-4 text-[15px] text-rose-600"
                >
                  退出登录
                </button>
              </li>
            </>
          ) : (
            <li className="p-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="btn-primary w-full"
              >
                登录 / 注册
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
