"use client";

import { useEffect, useRef, useState } from "react";
import { AuthState } from "@/lib/useAuth";
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  User,
  AtSign,
  BookOpen,
  MessageSquare,
  Zap,
} from "lucide-react";

type Tab = "login" | "register";

interface AuthGateProps {
  auth: AuthState;
}

const FEATURES = [
  {
    icon: BookOpen,
    title: "Book-grounded answers",
    desc: "Ask precise questions tied directly to your selected texts.",
  },
  {
    icon: MessageSquare,
    title: "Persistent history",
    desc: "All your conversations saved and organized by date.",
  },
  {
    icon: Zap,
    title: "Streaming responses",
    desc: "See answers appear in real time as the model reasons.",
  },
];

export default function AuthGate({ auth }: AuthGateProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or username
  const [email, setEmail] = useState("");           // register only
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Reset fields on tab switch
  useEffect(() => {
    setName("");
    setIdentifier("");
    setEmail("");
    setPassword("");
    setShowPw(false);
    auth.clearError();
    setTimeout(() => emailRef.current?.focus(), 80);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "login") {
      if (!identifier.trim() || !password) return;
      await auth.login(identifier.trim(), password);
    } else {
      if (!name.trim() || !email.trim() || !password) return;
      await auth.register(name.trim(), email.trim(), password);
    }
  };

  const inputBase =
    "w-full text-sm pl-9 pr-4 py-2.5 rounded-xl focus:outline-none transition-all duration-150";
  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--accent-2)";
    e.currentTarget.style.boxShadow = "0 0 0 2px color-mix(in srgb, var(--accent-2) 20%, transparent)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "var(--border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Decorative background blobs ── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, var(--accent-2) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* ── Left: Brand + features ── */}
        <div className="flex-1 text-center lg:text-left">
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)" }}
            >
              <Sparkles size={22} className="text-[var(--accent-2)]" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Archit
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-3">
            AI built for
            <br />
            <span style={{ color: "var(--accent-2)" }}>serious readers.</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0">
            Select your books, ask precise questions, and get answers grounded in the actual text — not generic knowledge.
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-xs mx-auto lg:mx-0">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "var(--accent-light)", border: "1px solid var(--border-light)" }}
                >
                  <Icon size={15} className="text-[var(--accent-2)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{title}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Auth card ── */}
        <div
          className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden shrink-0"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: tab === t ? "var(--surface)" : "var(--surface-2)",
                  color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
                  borderBottom: tab === t ? "2px solid var(--accent-2)" : "2px solid transparent",
                }}
              >
                {t === "login" ? <LogIn size={13} /> : <UserPlus size={13} />}
                {t === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="px-6 pt-5 pb-6">
            {/* Heading */}
            <div className="mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {tab === "login" ? "Welcome back" : "Get started"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {tab === "login"
                  ? "Sign in to continue your research"
                  : "Create your free Archit account"}
              </p>
            </div>

            {/* Error */}
            {auth.error && (
              <div
                className="text-xs px-3 py-2.5 rounded-lg mb-3"
                style={{
                  background: "color-mix(in srgb, var(--danger) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                  color: "var(--danger)",
                }}
              >
                {auth.error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name (register only) */}
              {tab === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
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
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    Email or username
                  </label>
                  <div className="relative">
                    <AtSign
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
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
                  <label className="text-xs font-medium text-[var(--text-muted)]">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
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
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
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
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="auth-gate-submit-btn"
                type="submit"
                disabled={
                  auth.loading ||
                  (tab === "login" ? (!identifier.trim() || !password) : (!name.trim() || !email.trim() || !password))
                }
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                style={{
                  background: "var(--accent)",
                  color: "var(--user-bubble-text)",
                }}
                onMouseEnter={(e) => {
                  if (!auth.loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = "1";
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
      </div>
    </div>
  );
}
