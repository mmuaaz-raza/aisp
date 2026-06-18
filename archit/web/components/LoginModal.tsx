"use client";

import { useEffect, useRef, useState } from "react";
import { AuthState } from "@/lib/useAuth";
import { X, Mail, Lock, Eye, EyeOff, Loader2, LogIn } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  auth: AuthState;
}

export default function LoginModal({ open, onClose, auth }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Focus email on open
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setShowPw(false);
      auth.clearError();
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    const ok = await auth.login(email.trim(), password);
    if (ok) onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 pt-6 pb-4"
          >
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Sign in to Archit
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Access your chat history and saved sessions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
            {/* Error */}
            {auth.error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--danger)",
                }}
              >
                {auth.error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none transition-shadow"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-2)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-sm pl-9 pr-10 py-2.5 rounded-xl focus:outline-none transition-shadow"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-2)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={auth.loading || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1 hover:opacity-85"
              style={{
                background: "var(--accent)",
                color: "var(--user-bubble-text)",
              }}
            >
              {auth.loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              {auth.loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
