"use client";

import { useEffect } from "react";
import { X, FileText, Copy, Check, RefreshCw } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface SummaryModalProps {
  open: boolean;
  summary: string | null;
  onClose: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export default function SummaryModal({ open, summary, onClose, onRegenerate, regenerating = false }: SummaryModalProps) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl flex flex-col animate-message"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          maxHeight: "80vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-light)" }}
            >
              <FileText size={14} className="text-[var(--accent-2)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Conversation Summary
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                AI-generated overview of this chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Regenerate button */}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                title="Regenerate summary"
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
                <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
                {regenerating ? "Generating…" : "Regenerate"}
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              title="Copy summary"
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              {copied ? <Check size={12} className="text-[var(--accent)]" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-[var(--surface-2)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {summary ? (
            <div className="prose text-sm text-[var(--text-primary)] leading-relaxed">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic text-center py-6">
              No summary available yet.
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-5 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-[10px] text-[var(--text-muted)] text-center">
            Summaries capture key points and decisions — they don&apos;t replace the full conversation.
          </p>
        </div>
      </div>
    </div>
  );
}
