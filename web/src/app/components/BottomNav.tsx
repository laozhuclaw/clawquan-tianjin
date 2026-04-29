"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: (active: boolean) => JSX.Element;
};

const stroke = (active: boolean) => (active ? "#175938" : "#6B7680");

const NAV_ITEMS: NavItem[] = [
  {
    label: "首页",
    href: "/",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4.5a1 1 0 0 1-1-1v-9.5Z"
          stroke={stroke(active)}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? "#175938" : "none"}
          fillOpacity={active ? "0.08" : "0"}
        />
      </svg>
    ),
  },
  {
    label: "服务",
    href: "/services",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M5 4h14v5H5V4Zm0 8h6v8H5v-8Zm9 0h5v8h-5v-8Z"
          stroke={stroke(active)}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? "#175938" : "none"}
          fillOpacity={active ? "0.08" : "0"}
        />
      </svg>
    ),
  },
  {
    label: "企业",
    href: "/organizations",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M4 10h16v10H4V10Zm2-3 6-3 6 3M8 14h2m4 0h2m-8 4h8"
          stroke={stroke(active)}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill={active ? "#175938" : "none"}
          fillOpacity={active ? "0.08" : "0"}
        />
      </svg>
    ),
  },
  {
    label: "撮合",
    href: "/opportunities",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.4 1.4M7.9 16.1l-1.4 1.4m0-11 1.4 1.4m8.2 8.2 1.4 1.4"
          stroke={stroke(active)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke={stroke(active)}
          strokeWidth="1.8"
          fill={active ? "#D4A24A" : "none"}
          fillOpacity={active ? "0.25" : "0"}
        />
      </svg>
    ),
  },
  {
    label: "我的",
    href: "/me",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle
          cx="12"
          cy="8"
          r="3.5"
          stroke={stroke(active)}
          strokeWidth="1.8"
          fill={active ? "#175938" : "none"}
          fillOpacity={active ? "0.08" : "0"}
        />
        <path
          d="M4.5 20c.7-3.6 3.9-6 7.5-6s6.8 2.4 7.5 6"
          stroke={stroke(active)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden
                 bg-white/95 backdrop-blur
                 border-t border-ink-100
                 shadow-[0_-2px_12px_rgba(16,24,32,0.04)]"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center gap-0.5
                         py-2 min-h-[56px] tap-highlight-transparent
                         transition-colors"
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 bg-brand-700 rounded-b-full" />
              )}
              {item.icon(active)}
              <span
                className={`text-[11px] leading-none font-medium ${
                  active ? "text-brand-700" : "text-ink-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
