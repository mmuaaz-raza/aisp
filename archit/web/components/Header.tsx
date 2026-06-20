"use client";



import { useState } from "react";
import { AuthUser } from "@/lib/useAuth";
import { LogIn, LogOut, Sparkles, FileText, Loader2, Menu } from "lucide-react";

interface HeaderProps {
  isLoggedIn: boolean;
  authUser: AuthUser | null;
  onLoginClick: () => void;
  onLogout: () => void;
  chatTitle?: string;
  onSummarize?: () => void;
  summarizing?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({
  isLoggedIn,
  authUser,
  onLoginClick,
  onLogout,
  chatTitle,
  onSummarize,
  summarizing = false,
  onToggleSidebar,
}: HeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <header
      className="grid items-center px-4 py-2.5 border-b shrink-0"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        height: "57px",
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 pr-3 shrink-0" style={chatTitle ? { borderRight: "1px solid var(--border)" } : {}}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1 -ml-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Menu size={18} />
            </button>
          )}
          <img src="/favicon/favicon.svg" alt="Logo" width={15} height={15} className={onToggleSidebar ? "hidden sm:block" : ""} />
          <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight hidden sm:block">
            Archit
          </span>
        </div>
        {chatTitle && (
          <span className="text-sm text-[var(--text-muted)] font-medium truncate" style={{ maxWidth: "180px" }}>
            {chatTitle}
          </span>
        )}
      </div>

      {/* Centre: Summarize button — always truly centred */}
      <div className="flex justify-center">
        {onSummarize && (
          <button
            onClick={onSummarize}
            disabled={summarizing}
            title="Generate a summary of this conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            {summarizing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <FileText size={12} />
            )}
            {summarizing ? "Summarizing…" : "Summary"}
          </button>
        )}
      </div>

      {/* Right: Auth control */}
      <div className="flex justify-end">
        {isLoggedIn && authUser ? (
          <>
            <button
              id="header-logout-btn"
              onClick={() => setConfirmOpen(true)}
              title="Sign out"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[120px]">
                {authUser.name}
              </span>
              <span style={{ width: 1, height: 14, background: "var(--border)", display: "inline-block", flexShrink: 0 }} />
              <LogOut size={12} className="shrink-0" />
            </button>

            {/* Logout confirmation modal */}
            {confirmOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
                onClick={() => setConfirmOpen(false)}
              >
                <div
                  className="w-full max-w-xs rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-message"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Sign out?</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      You&apos;ll be signed out of your account. Your chats will be saved.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setConfirmOpen(false); onLogout(); }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ background: "var(--danger, #e53e3e)", color: "#fff" }}
                    >
                      <LogOut size={12} />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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
      </div>
    </header>
  );
}
