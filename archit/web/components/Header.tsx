"use client";

import { useState, useRef, useEffect } from "react";
import { AuthUser } from "@/lib/useAuth";
import { LogIn, LogOut, User, ChevronDown, Sparkles } from "lucide-react";

interface HeaderProps {
  isLoggedIn: boolean;
  authUser: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
  chatTitle?: string;
}

export default function Header({
  isLoggedIn,
  authUser,
  onLoginClick,
  onLogout,
  chatTitle,
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
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3" style={chatTitle ? { borderRight: "1px solid var(--border)" } : {}}>
          <img src="/favicon/favicon.svg" alt="Logo" width={15} height={15} />
          <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
            Archit
          </span>
        </div>
        {chatTitle && (
          <span className="text-sm text-[var(--text-muted)] font-medium truncate max-w-[200px] sm:max-w-[400px]">
            {chatTitle}
          </span>
        )}
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
            <span className="max-w-[150px] truncate">{authUser.name}</span>
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
