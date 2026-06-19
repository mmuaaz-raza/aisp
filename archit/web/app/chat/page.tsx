"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Book, SearchRequest } from "@/lib/types";
import { QueryMode } from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import BookPickerModal from "@/components/BookPickerModal";
import LoginModal from "@/components/LoginModal";
import Header from "@/components/Header";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/lib/useAuth";
import { Sparkles } from "lucide-react";

export default function NewChatPage() {
  const auth = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [bookRegistry, setBookRegistry] = useState<Record<string, Book>>({});
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [mode, setMode] = useState<QueryMode>("library");

  const selectedBooks = selectedBookIds
    .map((id) => bookRegistry[id])
    .filter(Boolean) as Book[];

  const registerBooks = useCallback((books: Book[]) => {
    setBookRegistry((prev) => {
      const next = { ...prev };
      books.forEach((b) => (next[b.id] = b));
      return next;
    });
  }, []);

  const handleToggleBook = useCallback((bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId]
    );
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const query = inputValue.trim();
    setInputValue("");
    setLoading(true);

    try {
      // 1. Create a new chat
      const chatRes = await fetch("/api/v1/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query }),
      });
      if (!chatRes.ok) throw new Error(`Failed to create chat (${chatRes.status})`);
      const chat = await chatRes.json();
      const chatId: string = chat.id;

      // 2. Send the first query
      const payload: SearchRequest = {
        ids: mode === "history" || mode === "library" ? [] : selectedBookIds,
        query,
        chat_id: chatId,
        is_entire_corpus: mode === "library",
      };
      const queryRes = await fetch("/api/v1/chats/c", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!queryRes.ok) throw new Error(`Query failed (${queryRes.status})`);

      // 3. Navigate to the chat page — it will fetch the saved messages from the backend
      router.push(`/chat/c/${chatId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ── Auth loading / gate ──────────────────────────────────────────────────
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
                style={{ background: "var(--text-muted)", animationDelay: `${i * 0.15}s` }}
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

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* ── Top Header ── */}
      <Header
        isLoggedIn={auth.isLoggedIn}
        authUser={auth.user}
        onLoginClick={() => setLoginModalOpen(true)}
        onLogout={auth.logout}
        chatTitle="New Chat"
      />

      {/* ── Main content: sidebar + chat ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeChatId={null}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          isLoggedIn={auth.isLoggedIn}
          onLoginClick={() => setLoginModalOpen(true)}
        />

        <ChatArea
          messages={[]}
          loading={loading}
          streamingContent=""
          selectedBooks={selectedBooks}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onOpenBookPicker={() => setBookPickerOpen(true)}
          mode={mode}
          onModeChange={setMode}
        />
      </div>

      <BookPickerModal
        open={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        selectedIds={selectedBookIds}
        onToggleBook={handleToggleBook}
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
