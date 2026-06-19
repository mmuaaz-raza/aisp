"use client";

import { useRef, useEffect } from "react";
import { Message, Book } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import ChatInput, { QueryMode } from "./ChatInput";
import { Sparkles } from "lucide-react";

interface ChatAreaProps {
  messages: Message[];
  loading: boolean;
  streamingContent: string;
  selectedBooks: Book[];
  inputValue: string;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onOpenBookPicker: () => void;
  mode: QueryMode;
  onModeChange: (mode: QueryMode) => void;
}

const SUGGESTED_PROMPTS = [
  "Summarize the core argument of this book",
  "What specific claims does the author defend?",
  "Extract key concepts unique to this work",
  "Where does the author agree or disagree with mainstream views?",
];

export default function ChatArea({
  messages,
  loading,
  streamingContent,
  selectedBooks,
  inputValue,
  onInputChange,
  onSend,
  onOpenBookPicker,
  mode,
  onModeChange,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll intentionally disabled so the view stays at the same level
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-[var(--bg)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent-light)" }}
            >
              <Sparkles size={22} className="text-[var(--accent-2)]" />
            </div>
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 tracking-tight text-center">
                {mode === "library"
                  ? "Explore the Library"
                  : mode === "books" && selectedBooks.length > 0
                  ? `Analyzing ${selectedBooks.length === 1 ? `"${selectedBooks[0].title}"` : `${selectedBooks.length} books`}`
                  : mode === "books"
                  ? "Book-Grounded Analysis"
                  : "Continue the Discussion"}
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-[420px] text-center leading-relaxed">
                {mode === "library"
                  ? "Ask anything. I'll search across our entire collection of texts to find the most accurate answers."
                  : mode === "books" && selectedBooks.length > 0
                  ? "Ask targeted questions based on your selection for highly accurate, text-grounded insights."
                  : mode === "books"
                  ? "Select specific books below to ground the AI's responses in specialized knowledge."
                  : "Follow up on previous answers or pivot the conversation to a new topic."}
              </p>
            </div>

            {selectedBooks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onInputChange(prompt)}
                    className="text-left text-xs border rounded-lg px-3 py-2.5 transition-all duration-150 cursor-pointer"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--accent-2)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--accent-2)";
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--accent-light)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--border)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--text-muted)";
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, idx) => (
          <MessageBubble key={`${msg.role}-${msg.timestamp}-${idx}`} message={msg} />
        ))}

        {/* Live streaming */}
        {loading && streamingContent && (
          <div className="flex justify-start group px-4 py-1">
            <div className="flex items-end gap-2 max-w-[80%]">
              <div
                className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center self-start mt-1"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                }}
              >
                <Sparkles size={13} className="text-[var(--accent-2)]" />
              </div>
              <div className="text-sm text-[var(--text-primary)] leading-relaxed">
                <div className="prose">
                  <p>{streamingContent}</p>
                </div>
                <span
                  className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-pulse rounded-sm"
                  style={{ background: "var(--accent-2)" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Thinking dots */}
        {loading && !streamingContent && (
          <div className="flex justify-start px-4 py-1">
            <div className="flex items-center gap-2">
              <div
                className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                }}
              >
                <Sparkles size={13} className="text-[var(--accent-2)]" />
              </div>
              <div className="flex gap-1 items-center h-7">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{
                      background: "var(--text-muted)",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        value={inputValue}
        onChange={onInputChange}
        onSend={onSend}
        onOpenBooks={onOpenBookPicker}
        loading={loading}
        selectedBookCount={selectedBooks.length}
        selectedBookTitles={selectedBooks.map((b) => b.title)}
        mode={mode}
        onModeChange={onModeChange}
      />
    </div>
  );
}
