"use client";

import { useState, useRef, useEffect } from "react";
import { AuthUser } from "@/lib/useAuth";
import { LogIn, LogOut, User, ChevronDown, Sparkles } from "lucide-react";

interface HeaderProps {
  isLoggedIn: boolean;
  authUser: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export default function Header({
  isLoggedIn,
  authUser,
  onLoginClick,
  onLogout,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        height: "57px",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-[var(--accent-2)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
          Archit
        </span>
      </div>

      {/* Auth control */}
      {isLoggedIn && authUser ? (
        <div className="relative" ref={menuRef}>
          <button
            id="header-account-btn"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          >
            {/* Avatar */}
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: "var(--accent-light)",
                color: "var(--accent)",
              }}
            >
              {authUser.name.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[120px] truncate hidden sm:block">{authUser.name}</span>
            <ChevronDown
              size={12}
              className={`text-[var(--text-muted)] transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {/* User info */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {authUser.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                  {authUser.email}
                </p>
              </div>

              {/* Actions */}
              <div className="p-1.5">
                <button
                  id="header-profile-btn"
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] rounded-lg transition-colors cursor-pointer"
                >
                  <User size={13} />
                  Profile
                </button>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-2)] rounded-lg transition-colors cursor-pointer"
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          id="header-signin-btn"
          onClick={onLoginClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer hover:opacity-85"
          style={{
            background: "var(--accent)",
            color: "var(--user-bubble-text)",
          }}
        >
          <LogIn size={13} />
          Sign in
        </button>
      )}
    </header>
  );
}
