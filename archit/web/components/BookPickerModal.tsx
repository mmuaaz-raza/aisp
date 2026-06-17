"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Book } from "@/lib/types";
import BookCard from "./BookCard";
import { X, Search, BookOpen, Check, ChevronDown, Loader2 } from "lucide-react";

const BACKEND = "http://localhost:8000/api/v1";
const PAGE_LIMIT = 20;

interface BookPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onToggleBook: (id: string) => void;
  onBooksLoaded?: (books: Book[]) => void;
}

export default function BookPickerModal({
  open,
  onClose,
  selectedIds,
  onToggleBook,
  onBooksLoaded,
}: BookPickerModalProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search input value (shown immediately)
  const [query, setQuery] = useState("");
  // Debounced value sent to server
  const [serverQuery, setServerQuery] = useState("");

  const [page, setPage] = useState(0); // 0-indexed (matches Python backend)
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounce: reset to page 1 when query changes ─────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setServerQuery(query);
      setPage(0); // reset to first page on new query
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Fetch from server whenever open, serverQuery, or page changes ─────────
  const fetchBooks = useCallback(
    async (q: string, p: number, isNewQuery: boolean) => {
      try {
        if (isNewQuery) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        // Build query params matching Python signature:
        // name: str = "", tags: List[str] = [], page: int = 0
        const params = new URLSearchParams({ page: String(p) });
        if (q.trim()) params.set("name", q.trim());
        // tags param omitted here — handled via server default (empty list)

        const res = await fetch(`${BACKEND}/books?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Accept: Book[] OR { books, has_more, total, pages } OR { items, … }
        const list: Book[] = Array.isArray(data)
          ? data
          : data.books ?? data.items ?? [];

        // Detect if there are more pages
        const more: boolean =
          data.has_more ??
          data.hasMore ??
          (typeof data.total === "number"
            ? (p + 1) * PAGE_LIMIT < data.total
            : list.length === PAGE_LIMIT);

        const tot: number =
          data.total ??
          data.count ??
          (more ? (p + 1) * PAGE_LIMIT + 1 : (p + 1) * PAGE_LIMIT);

        if (isNewQuery) {
          setBooks(list);
        } else {
          setBooks((prev) => [...prev, ...list]);
        }

        setHasMore(more);
        setTotal(tot);
        onBooksLoaded?.(list);
      } catch {
        if (isNewQuery) setError("Could not load books. Is the backend running?");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [onBooksLoaded]
  );

  // Trigger fetch on open + when serverQuery/page change
  useEffect(() => {
    if (!open) return;
    fetchBooks(serverQuery, page, page === 1);
  }, [open, serverQuery, page, fetchBooks]);

  // Focus search + reset on open/close
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 80);
    } else {
      setQuery("");
      setServerQuery("");
      setPage(0); // reset to 0-indexed first page
      setBooks([]);
      setHasMore(false);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) setPage((p) => p + 1); // next 0-indexed page
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />

      {/* Panel — large centered dialog */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div
          className="w-full max-w-5xl h-full max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} className="text-[var(--accent-2)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Select Books
              </span>
              {total > 0 && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  {total} total
                </span>
              )}
              {selectedIds.length > 0 && (
                <span
                  className="text-[10px] rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    background: "var(--accent)",
                    color: "var(--user-bubble-text)",
                  }}
                >
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() => selectedIds.forEach((id) => onToggleBook(id))}
                  className="text-[11px] px-2.5 py-1.5 rounded-md transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface-2)]"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors cursor-pointer text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search — sends to server */}
          <div
            className="px-5 py-3 border-b shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="relative">
              {loading && query ? (
                <Loader2
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent-2)] animate-spin"
                />
              ) : (
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
              )}
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by title or tag…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Book grid — flex-1 scrollable */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Initial loading skeleton */}
            {loading && books.length === 0 && (
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden animate-pulse">
                    <div
                      className="w-full"
                      style={{
                        aspectRatio: "3/4",
                        background: "var(--surface-2)",
                      }}
                    />
                    <div className="p-2.5 space-y-2">
                      <div
                        className="h-3 rounded"
                        style={{ background: "var(--surface-2)", width: "80%" }}
                      />
                      <div
                        className="h-2.5 rounded"
                        style={{ background: "var(--surface-2)", width: "50%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div
                className="p-4 rounded-xl flex flex-col items-center gap-2 text-center"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <p className="text-sm text-[var(--danger)]">{error}</p>
                <button
                  onClick={() => fetchBooks(serverQuery, 1, true)}
                  className="text-xs text-[var(--accent-2)] hover:underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && books.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <BookOpen size={32} className="text-[var(--border)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  {query ? `No books match "${query}"` : "No books found"}
                </p>
              </div>
            )}

            {/* Books grid */}
            {books.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      selected={selectedIds.includes(book.id)}
                      onToggle={() => onToggleBook(book.id)}
                    />
                  ))}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-60"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                        background: "var(--surface-2)",
                      }}
                    >
                      {loadingMore ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}

                {/* Page indicator */}
                {!hasMore && books.length > 0 && (
                  <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
                    All {books.length} books loaded
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 border-t flex items-center justify-between shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-xs text-[var(--text-muted)] max-w-xs">
              {selectedIds.length === 0
                ? "Pick books to ground your questions — precise queries work best"
                : `${selectedIds.length} ${selectedIds.length === 1 ? "book" : "books"} selected as context · ask specific questions for best results`}
            </p>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all cursor-pointer hover:opacity-80"
              style={{
                background: "var(--accent)",
                color: "var(--user-bubble-text)",
              }}
            >
              <Check size={13} strokeWidth={2.5} />
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
