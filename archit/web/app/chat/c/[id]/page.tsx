"use client";

import { useState, useCallback, useEffect, use } from "react";
import { Message, Book, ChatSession, SearchRequest } from "@/lib/types";
import { QueryMode } from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import BookPickerModal from "@/components/BookPickerModal";
import LoginModal from "@/components/LoginModal";
import Header from "@/components/Header";
import SummaryModal from "@/components/SummaryModal";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/lib/useAuth";
import { Sparkles } from "lucide-react";

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Filter out the system prompt so the UI only shows user/assistant turns */
function visibleMessages(messages: Message[]): Message[] {
  return messages.filter((m) => m.role !== "system");
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = use(params);
  const auth = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [bookRegistry, setBookRegistry] = useState<Record<string, Book>>({});
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedQueryTags, setSelectedQueryTags] = useState<string[]>([]);
  const [mode, setMode] = useState<QueryMode>("library");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  // ── Fetch chat on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    async function fetchChat() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/chats/${chatId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        setChat({ ...data, selectedBookIds: [] });
        // Seed summary text if the backend already has one
        if (data.summary && data.summary.trim().length > 0) {
          setSummaryText(data.summary);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setFetchError(
          err instanceof Error ? err.message : "Failed to load chat"
        );
      }
    }
    fetchChat();
    return () => controller.abort();
  }, [chatId]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedBooks = selectedBookIds
    .map((id) => bookRegistry[id])
    .filter(Boolean) as Book[];

  const displayMessages = chat ? visibleMessages(chat.messages) : [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const registerBooks = useCallback((books: Book[]) => {
    setBookRegistry((prev) => {
      const next = { ...prev };
      books.forEach((b) => (next[b.id] = b));
      return next;
    });
  }, []);

  const handleToggleBook = useCallback((bookId: string) => {
    setSelectedBookIds((prev) => {
      const isRemoving = prev.includes(bookId);
      if (!isRemoving) setSelectedQueryTags([]); // clear tags if adding book
      return isRemoving ? prev.filter((id) => id !== bookId) : [...prev, bookId];
    });
  }, []);

  const handleToggleQueryTag = useCallback((tag: string) => {
    setSelectedQueryTags((prev) => {
      const isRemoving = prev.includes(tag);
      if (!isRemoving) setSelectedBookIds([]); // clear books if adding tag
      return isRemoving ? prev.filter((t) => t !== tag) : [...prev, tag];
    });
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || loading || !chat) return;

    const query = inputValue.trim();
    setInputValue("");

    // Optimistically add user message to UI
    const optimisticUser: Message = {
      role: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };
    setChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimisticUser] } : prev
    );

    setLoading(true);

    const payload: SearchRequest = {
      ids: mode === "history" || mode === "library" ? [] : selectedBookIds,
      query,
      chat_id: chatId,
      is_entire_corpus: mode === "library",
      is_history: mode === "history",
      tags: mode === "history" || mode === "library" ? [] : selectedQueryTags,
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/chats/c`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Query failed (${res.status}): ${text}`);
      }

      const data = await res.json();
      const responseText: string =
        data?.response ?? data?.content ?? data?.message ?? JSON.stringify(data);

      const assistantMessage: Message = {
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
        isNew: true,
      };

      setChat((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, assistantMessage] }
          : prev
      );
    } catch (err) {
      const errText =
        err instanceof Error ? err.message : "Unknown error occurred";
      const errMessage: Message = {
        role: "assistant",
        content: `Sorry, I couldn't reach the backend. ${errText}`,
        timestamp: new Date().toISOString(),
      };
      setChat((prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, errMessage] }
          : prev
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (summarizing || !chat) return;
    setSummarizing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/chats/summary/${chatId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setSummaryText(data.summary ?? null);
      setSummaryOpen(true);
    } catch (err) {
      console.error("Summary failed:", err);
    } finally {
      setSummarizing(false);
    }
  };

  // ── Auth loading / gate ───────────────────────────────────────────────────
  if (auth.initializing) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "var(--accent-light)" }}
          >
            <img src="/favicon/favicon.svg" alt="Logo" width={22} height={22} />
          </div>
          <div className="flex gap-1.5">
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
    );
  }

  if (!auth.isLoggedIn) {
    return <AuthGate auth={auth} />;
  }

  // ── Fetch error state ─────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-4 px-6 text-center max-w-sm">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}
          >
            <img src="/favicon/favicon.svg" alt="Logo" width={22} height={22} />
          </div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Couldn&apos;t load chat
          </p>
          <p className="text-xs text-[var(--text-muted)]">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              background: "var(--accent)",
              color: "var(--user-bubble-text)",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Chat loading skeleton ─────────────────────────────────────────────────
  if (!chat) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ background: "var(--accent-light)" }}
          >
            <img src="/favicon/favicon.svg" alt="Logo" width={22} height={22} />
          </div>
          <div className="flex gap-1.5">
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
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* ── Top Header ── */}
      <Header
        isLoggedIn={auth.isLoggedIn}
        authUser={auth.user}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={auth.logout}
        chatTitle={chat?.title}
        onSummarize={displayMessages.length > 0 ? () => {
          // If already fetched, just open; otherwise fetch it
          if (summaryText) { setSummaryOpen(true); } else { handleSummarize(); }
        } : undefined}
        summarizing={summarizing}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
      />

      {/* ── Main content: sidebar + chat ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeChatId={chatId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          isLoggedIn={auth.isLoggedIn}
          onLoginClick={() => setLoginModalOpen(true)}
        />

        <ChatArea
          messages={displayMessages}
          loading={loading}
          streamingContent=""
          selectedBooks={selectedBooks}
          selectedQueryTags={selectedQueryTags}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onOpenBookPicker={() => setBookPickerOpen(true)}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      <SummaryModal
        open={summaryOpen}
        summary={summaryText}
        onClose={() => setSummaryOpen(false)}
        onRegenerate={handleSummarize}
        regenerating={summarizing}
      />

      <BookPickerModal
        open={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        selectedIds={selectedBookIds}
        onToggleBook={handleToggleBook}
        selectedQueryTags={selectedQueryTags}
        onToggleQueryTag={handleToggleQueryTag}
        onBooksLoaded={registerBooks}
      />

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        auth={auth}
      />
    </div>
  );
}
