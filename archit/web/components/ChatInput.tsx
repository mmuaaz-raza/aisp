"use client";

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { ArrowUp, BookOpen, MessageSquare, Library } from "lucide-react";

export type QueryMode = "books" | "history" | "library";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onOpenBooks: () => void;
  loading: boolean;
  selectedBookCount: number;
  selectedBookTitles: string[];
  mode: QueryMode;
  onModeChange: (mode: QueryMode) => void;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onOpenBooks,
  loading,
  selectedBookCount,
  selectedBookTitles,
  mode,
  onModeChange,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // In history/library mode sending is always allowed (no book requirement)
  const canSend =
    !loading &&
    value.trim().length > 0 &&
    (mode !== "books" || selectedBookCount > 0);

  const bookLabel =
    selectedBookCount === 0
      ? "Books"
      : selectedBookCount === 1
      ? selectedBookTitles[0].length > 18
        ? selectedBookTitles[0].slice(0, 18) + "…"
        : selectedBookTitles[0]
      : `${selectedBookCount} books`;

  const placeholder =
    mode === "history"
      ? "Ask based on this conversation's history…"
      : mode === "library"
      ? "Search across the entire library…"
      : selectedBookCount === 0
      ? "Select books first — this model works best on book-specific questions…"
      : "Ask a specific question about the selected books…";

  return (
    <div className="px-4 pb-5 pt-2">
      <div
        className={`flex flex-col border rounded-xl bg-[var(--surface)] transition-shadow ${
          disabled
            ? "opacity-60 border-[var(--border)]"
            : "border-[var(--border)] shadow-sm focus-within:ring-1 focus-within:ring-[var(--accent-2)] focus-within:border-[var(--accent-2)]"
        }`}
      >
        {/* Textarea */}
        <div className="flex items-end gap-2 px-3 pt-3 pb-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none leading-relaxed py-1"
            style={{ maxHeight: "160px" }}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 gap-2">

          {/* Left: Mode toggle pill + Books picker */}
          <div className="flex items-center gap-2">
            {/* ── Mode toggle pill ── */}
            <div
              className="flex items-center rounded-lg border overflow-hidden shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => onModeChange("library")}
                title="Answer from entire library"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={
                  mode === "library"
                    ? {
                        background: "var(--accent)",
                        color: "var(--user-bubble-text)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--text-muted)",
                      }
                }
              >
                <Library size={11} />
                <span>Library</span>
              </button>

              <div style={{ width: 1, background: "var(--border)", height: 20 }} />

              <button
                type="button"
                onClick={() => onModeChange("books")}
                title="Answer from selected books"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={
                  mode === "books"
                    ? {
                        background: "var(--accent)",
                        color: "var(--user-bubble-text)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--text-muted)",
                      }
                }
              >
                <BookOpen size={11} />
                <span>Books</span>
              </button>

              {/* divider */}
              <div style={{ width: 1, background: "var(--border)", height: 20 }} />

              <button
                type="button"
                onClick={() => onModeChange("history")}
                title="Answer from chat discussion"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={
                  mode === "history"
                    ? {
                        background: "var(--accent)",
                        color: "var(--user-bubble-text)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--text-muted)",
                      }
                }
              >
                <MessageSquare size={11} />
                <span>Discussion</span>
              </button>
            </div>

            {/* Books picker — only visible in books mode */}
            {mode === "books" && (
              <button
                onClick={onOpenBooks}
                type="button"
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  selectedBookCount > 0
                    ? "border-[var(--accent-2)] bg-[var(--accent-light)] text-[var(--accent-2)] hover:bg-[var(--surface-2)]"
                    : "border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-light)] animate-pulse ring-2 ring-[var(--accent-light)]"
                }`}
                title="Choose books as context"
              >
                <span>{bookLabel}</span>
                {selectedBookCount > 0 && (
                  <span
                    className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
                    style={{
                      background: "var(--accent)",
                      color: "var(--user-bubble-text)",
                    }}
                  >
                    {selectedBookCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Right: hint + send */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:block">
              Shift+↵ new line
            </span>
            <button
              onClick={onSend}
              disabled={!canSend}
              title="Send message (Enter)"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                canSend ? "hover:opacity-80" : "cursor-not-allowed opacity-40"
              }`}
              style={
                canSend
                  ? {
                      background: "var(--accent)",
                      color: "var(--user-bubble-text)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }
                  : {
                      background: "var(--surface-2)",
                      color: "var(--text-muted)",
                    }
              }
            >
              {loading ? (
                <div
                  className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--border-light)",
                    borderTopColor: "var(--user-bubble-text)",
                  }}
                />
              ) : (
                <ArrowUp size={14} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
