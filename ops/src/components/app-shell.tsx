"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAVIGATION = [
  { href: "/", label: "Today", eyebrow: "01" },
  { href: "/channels/x", label: "X studio", eyebrow: "02" },
  { href: "/library", label: "Library", eyebrow: "03" },
  { href: "/ledger", label: "Ledger", eyebrow: "04" },
  { href: "/review", label: "Review", eyebrow: "05" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="DateXray operations home">
          <span className="brand-mark" aria-hidden="true">DX</span>
          <span><strong>DATEXRAY</strong><small>OPERATIONS</small></span>
        </Link>

        <nav aria-label="Primary navigation" className="primary-nav">
          {NAVIGATION.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
                <small>{item.eyebrow}</small><span>{item.label}</span><b aria-hidden="true">↗</b>
              </Link>
            );
          })}
        </nav>

        <div className="channel-rail">
          <p>CHANNELS</p>
          <Link href="/channels/x"><span className="channel-dot x" />X <b>LIVE</b></Link>
          <Link href="/channels/tiktok"><span className="channel-dot" />TikTok <b>SOON</b></Link>
          <Link href="/channels/reddit"><span className="channel-dot" />Reddit <b>SOON</b></Link>
        </div>

        <div className="local-badge"><span />Local only · :3100</div>
      </aside>
      <div className="workspace">
        <header className="mobile-header">
          <Link href="/" className="brand-lockup"><span className="brand-mark">DX</span><strong>OPS</strong></Link>
          <Link href="/channels/x" className="mobile-action">New draft</Link>
        </header>
        {children}
      </div>
    </div>
  );
}
