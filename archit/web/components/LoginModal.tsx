"use client";

import { useEffect, useRef, useState } from "react";
import { AuthState } from "@/lib/useAuth";
import { X, Mail, Lock, Eye, EyeOff, Loader2, LogIn, UserPlus, User, AtSign } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  auth: AuthState;
}

type Tab = "login" | "register";

export default function LoginModal({ open, onClose, auth }: LoginModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username
  const [email, setEmail] = useState("");           // register only
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTab("login");
      setName("");
      setIdentifier("");
      setEmail("");
      setPassword("");
      setShowPw(false);
      auth.clearError();
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset fields when switching tabs
  useEffect(() => {
    setName("");
    setIdentifier("");
    setEmail("");
    setPassword("");
    setShowPw(false);
    auth.clearError();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    let ok = false;
    if (tab === "login") {
      if (!identifier.trim() || !password) return;
      ok = await auth.login(identifier.trim(), password);
    } else {
      if (!name.trim() || !email.trim() || !password) return;
      ok = await auth.register(name.trim(), email.trim(), password);
    }
    if (ok) onClose();
  };

  if (!open) return null;

  const inputBase =
    "w-full text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none transition-shadow";

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--accent-2)";
    e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-2)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.40)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {tab === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {tab === "login"
                  ? "Sign in to access your chat history"
                  : "Get started with Archit"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-4 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors cursor-pointer"
                style={{
                  background: tab === t ? "var(--accent)" : "var(--surface-2)",
                  color: tab === t ? "var(--user-bubble-text)" : "var(--text-muted)",
                }}
              >
                {t === "login" ? <LogIn size={12} /> : <UserPlus size={12} />}
                {t === "login" ? "Sign in" : "Register"}
              </button>
            ))}
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

            {/* Name (register only) */}
            {tab === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Name</label>
                <div className="relative">
                  <User
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    className={inputBase}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            )}

            {/* Login identifier (email or username) */}
            {tab === "login" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Email or username</label>
                <div className="relative">
                  <AtSign
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    ref={emailRef}
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or username"
                    required
                    autoComplete="username"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            )}

            {/* Email (register only) */}
            {tab === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Email</label>
                <div className="relative">
                  <Mail
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                  <input
                    ref={tab === "register" ? emailRef : undefined}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className={inputBase}
                    style={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-muted)]">Password</label>
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
                  className={`${inputBase} pr-10`}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
              disabled={
                auth.loading ||
                (tab === "login" ? (!identifier.trim() || !password) : (!name.trim() || !email.trim() || !password))
              }
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1 hover:opacity-85"
              style={{
                background: "var(--accent)",
                color: "var(--user-bubble-text)",
              }}
            >
              {auth.loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : tab === "login" ? (
                <LogIn size={15} />
              ) : (
                <UserPlus size={15} />
              )}
              {auth.loading
                ? tab === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : tab === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
