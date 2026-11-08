"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "@/lib/nav";
import { useSession, type SessionUser } from "@/components/use-session";

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase text-accent-fg"
    >
      {name.charAt(0)}
    </span>
  );
}

function AccountMenu({ user, onSignOut }: { user: SessionUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-2">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm hover:bg-surface-2"
      >
        <Avatar name={user.username} />
        <span className="max-w-28 truncate">{user.username}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{user.username}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <hr className="border-border" />
          <button
            role="menuitem"
            onClick={onSignOut}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { state, signOut } = useSession();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Anime<span className="text-accent">Tracker</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive(l.href)
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            {state.status === "in" ? (
              <AccountMenu user={state.user} onSignOut={signOut} />
            ) : state.status === "out" ? (
              <Link
                href="/login"
                className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
              >
                Iniciar sesión
              </Link>
            ) : (
              <span className="ml-2 block h-8 w-28 animate-pulse rounded-full bg-surface-2" />
            )}
          </li>
        </ul>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-sm md:hidden"
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </nav>

      {open && (
        <ul className="border-t border-border bg-surface px-4 py-2 md:hidden">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm ${
                  isActive(l.href) ? "bg-accent text-accent-fg" : "text-muted"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-1 border-t border-border pt-2">
            {state.status === "in" ? (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <Avatar name={state.user.username} />
                  <span className="truncate">{state.user.username}</span>
                </span>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="rounded-md border border-border px-3 py-1 text-sm"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : state.status === "out" ? (
              <Link href="/login" onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm text-muted">
                Iniciar sesión
              </Link>
            ) : null}
          </li>
        </ul>
      )}
    </header>
  );
}
