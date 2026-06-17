"use client";

import { useState } from "react";
import { Book } from "@/lib/types";
import { Check, BookOpen } from "lucide-react";
import Link from "next/link";

interface BookCardProps {
  book: Book;
  selected: boolean;
  onToggle: () => void;
}

export default function BookCard({ book, selected, onToggle }: BookCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-xl border overflow-hidden transition-all duration-150 cursor-pointer group relative ${
        selected
          ? "border-[var(--accent-2)] ring-1 ring-[var(--accent-2)]"
          : "border-[var(--border)] hover:border-[var(--accent-2)]"
      }`}
      style={{ background: "var(--surface)" }}
    >
      {/* Thumbnail */}
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: "3/4", background: "var(--surface-2)" }}
      >
        {book.thumbnail && !imgError ? (
          <img
            src={book.thumbnail}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Fallback placeholder */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 px-3"
            style={{ background: "var(--accent-light)" }}
          >
            <BookOpen size={28} style={{ color: "var(--accent-2)", opacity: 0.5 }} />
            <p
              className="text-[10px] font-medium text-center leading-tight line-clamp-3"
              style={{ color: "var(--accent)" }}
            >
              {book.title}
            </p>
          </div>
        )}

        {/* Selected overlay checkmark */}
        {selected && (
          <div
            className="absolute inset-0 flex items-start justify-end p-1.5"
            style={{ background: "rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shadow"
              style={{ background: "var(--accent)" }}
            >
              <Check size={11} strokeWidth={3} style={{ color: "var(--user-bubble-text)" }} />
            </div>
          </div>
        )}

        {/* Index badge */}
        {book.index && (
          <Link
            className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(0,0,0,0.45)",
              color: "#fff",
              backdropFilter: "blur(4px)",
            }}
            href={book.index}
            target="_blank"
          >
            Book Source
          </Link>
        )}
      </div>

      {/* Info section */}
      <div className="px-2.5 py-2">
        <p
          className={`text-[11px] font-semibold leading-snug line-clamp-2 mb-1.5 transition-colors ${
            selected ? "text-[var(--accent-2)]" : "text-[var(--text-primary)]"
          }`}
        >
          {book.title}
        </p>

        {/* Tags */}
        {book.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: selected ? "var(--accent)" : "var(--surface-2)",
                  color: selected ? "var(--user-bubble-text)" : "var(--text-muted)",
                }}
              >
                {tag}
              </span>
            ))}
            {book.tags.length > 3 && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ color: "var(--text-muted)" }}
              >
                +{book.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
