"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Book } from "@/lib/types";
import BookCard from "./BookCard";
import { X, Search, BookOpen, Check, ChevronDown, Loader2, Tag } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverFilteredRef = useRef(false);

  // ── Core fetch (append=true for load-more, false = replace) ───────────────
  const doFetch = useCallback(
    async (q: string, tags: string[], p: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p) });
        if (q.trim()) params.set("name", q.trim());
        tags.forEach((t) => params.append("tags", t));

        const res = await fetch(`/api/v1/books?${params}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const list: Book[] = data.books ?? [];
        const ftotal: number = data.ftotal ?? list.length;
        const tot: number = data.total ?? 0;

        const more = p * PAGE_LIMIT + ftotal < tot;

        setBooks((prev) => (append ? [...prev, ...list] : list));
        setHasMore(more);
        setTotal(tot);
        setPage(p);
        onBooksLoaded?.(list);
      } catch {
        if (!append) setError("Could not load books. Is the backend running?");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [onBooksLoaded]
  );

  // ── On modal open: fetch tags + initial books ────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTimeout(() => searchRef.current?.focus(), 80);
    // Fetch all available tags
    fetch("/api/v1/books/tags", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { tags: [] }))
      .then((data) => {
        const tagsArray = Array.isArray(data?.tags) ? data.tags : Array.isArray(data) ? data : [];
        setAvailableTags(tagsArray.sort());
      })
      .catch(() => setAvailableTags([]));
    // Fetch first page of books
    doFetch("", [], 0, false);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedTags([]);
      setBooks([]);
      setAvailableTags([]);
      setPage(0);
      setHasMore(false);
      setError(null);
      serverFilteredRef.current = false;
    }
  }, [open]);

  // ── Local filter (derived, instant) ──────────────────────────────────────
  const displayBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && selectedTags.length === 0) return books;
    return books.filter((b) => {
      const matchesName = !q || b.title.toLowerCase().includes(q);
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => b.tags.includes(t));
      return matchesName && matchesTags;
    });
  }, [books, query, selectedTags]);

  // ── Server fallback: only when local filter returns nothing ───────────────
  useEffect(() => {
    if (!open) return;
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);

    const hasFilter = query.trim() !== "" || selectedTags.length > 0;
    if (!hasFilter) {
      if (serverFilteredRef.current) {
        serverFilteredRef.current = false;
        doFetch("", [], 0, false);
      }
      return; 
    }

    const q = query.trim().toLowerCase();
    const localHits = books.filter((b) => {
      const matchesName = !q || b.title.toLowerCase().includes(q);
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((t) => b.tags.includes(t));
      return matchesName && matchesTags;
    });

    if (localHits.length === 0) {
      // Local search came up empty — ask the server (debounced, REPLACE books)
      fallbackTimer.current = setTimeout(() => {
        serverFilteredRef.current = true;
        doFetch(query, selectedTags, 0, false);
      }, 350);
    }

    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, [query, selectedTags, open]); // intentionally excludes `books` to avoid loops

  // ── Available tags from dedicated endpoint (set on open) ─────────────────

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  // ── Load more (always appends) ────────────────────────────────────────────
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      doFetch(query, selectedTags, page + 1, true);
    }
  };

  // ── Escape to close ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-4 z-50 flex items-center justify-center">
        <div
          className="w-full max-w-5xl h-full max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
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
                  style={{ background: "var(--accent)", color: "var(--user-bubble-text)" }}
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

          {/* Search + Tag filters */}
          <div
            className="px-5 py-3 border-b shrink-0 flex flex-col gap-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Text search */}
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
                placeholder="Search by title…"
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

            {/* Tag chips */}
            {availableTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag size={11} className="text-[var(--text-muted)] shrink-0" />
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className="text-[11px] px-2 py-0.5 rounded-full border transition-all cursor-pointer"
                      style={
                        active
                          ? {
                              background: "var(--accent)",
                              color: "var(--user-bubble-text)",
                              borderColor: "var(--accent)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--text-muted)",
                              borderColor: "var(--border)",
                            }
                      }
                    >
                      {tag}
                    </button>
                  );
                })}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer ml-1"
                  >
                    clear tags
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Book grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Loading skeleton */}
            {loading && displayBooks.length === 0 && (
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden animate-pulse">
                    <div
                      className="w-full"
                      style={{ aspectRatio: "3/4", background: "var(--surface-2)" }}
                    />
                    <div className="p-2.5 space-y-2">
                      <div className="h-3 rounded" style={{ background: "var(--surface-2)", width: "80%" }} />
                      <div className="h-2.5 rounded" style={{ background: "var(--surface-2)", width: "50%" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div
                className="p-4 rounded-xl flex flex-col items-center gap-2 text-center"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm text-[var(--danger)]">{error}</p>
                <button
                  onClick={() => doFetch(query, selectedTags, 0, false)}
                  className="text-xs text-[var(--accent-2)] hover:underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && displayBooks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <BookOpen size={32} className="text-[var(--border)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  {query || selectedTags.length > 0
                    ? `No books match your filter`
                    : "No books found"}
                </p>
              </div>
            )}

            {/* Books grid */}
            {displayBooks.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {displayBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      selected={selectedIds.includes(book.id)}
                      onToggle={() => onToggleBook(book.id)}
                    />
                  ))}
                </div>

                {/* Load more — only shown when no active filter OR filter matched server results */}
                {hasMore && displayBooks.length === books.length && (
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

                {!hasMore && (
                  <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
                    {displayBooks.length} book{displayBooks.length !== 1 ? "s" : ""} shown
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
                ? "Pick books to ground your questions"
                : `${selectedIds.length} ${selectedIds.length === 1 ? "book" : "books"} selected as context`}
            </p>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all cursor-pointer hover:opacity-80"
              style={{ background: "var(--accent)", color: "var(--user-bubble-text)" }}
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
