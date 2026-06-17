"use client";

import { useState, useCallback, useEffect } from "react";
import { Message, Book, ChatSession, ChatRequest } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import BookPickerModal from "@/components/BookPickerModal";

const STORAGE_KEY = "archit_chat_sessions";

function reviveDates(sessions: ChatSession[]): ChatSession[] {
  return sessions.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
  }));
}

function newSession(selectedBookIds: string[] = []): ChatSession {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    selectedBookIds,
    createdAt: now,
    updatedAt: now,
  };
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bookRegistry, setBookRegistry] = useState<Record<string, Book>>({});
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = reviveDates(JSON.parse(raw));
        setSessions(parsed);
        if (parsed.length > 0) setActiveId(parsed[0].id);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  // Active session derived
  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const updateSession = useCallback(
    (id: string, patch: Partial<ChatSession>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date() } : s))
      );
    },
    []
  );

  const handleNewChat = useCallback(() => {
    const session = newSession(activeSession?.selectedBookIds ?? []);
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setInputValue("");
  }, [activeSession]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === activeId) {
          setActiveId(next.length > 0 ? next[0].id : null);
        }
        if (next.length === 0) localStorage.removeItem(STORAGE_KEY);
        return next;
      });
    },
    [activeId]
  );

  const handleSelectSession = useCallback((id: string) => {
    setActiveId(id);
    setInputValue("");
  }, []);

  const handleToggleBook = useCallback(
    (bookId: string) => {
      if (!activeId) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const ids = s.selectedBookIds.includes(bookId)
            ? s.selectedBookIds.filter((b) => b !== bookId)
            : [...s.selectedBookIds, bookId];
          return { ...s, selectedBookIds: ids, updatedAt: new Date() };
        })
      );
    },
    [activeId]
  );

  const registerBooks = useCallback((books: Book[]) => {
    setBookRegistry((prev) => {
      const next = { ...prev };
      books.forEach((b) => (next[b.id] = b));
      return next;
    });
  }, []);

  const selectedBooks = (activeSession?.selectedBookIds ?? [])
    .map((id) => bookRegistry[id])
    .filter(Boolean) as Book[];

  const handleSend = async () => {
    if (!inputValue.trim() || !activeId || loading) return;
    if ((activeSession?.selectedBookIds.length ?? 0) === 0) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const isFirstMessage = (activeSession?.messages.length ?? 0) === 0;
    const sessionTitle = isFirstMessage
      ? userMessage.content.slice(0, 48) + (userMessage.content.length > 48 ? "…" : "")
      : (activeSession?.title ?? "New chat");

    updateSession(activeId, {
      messages: [...(activeSession?.messages ?? []), userMessage],
      title: sessionTitle,
    });

    setInputValue("");
    setLoading(true);
    setStreamingContent("");

    const allMessages = [...(activeSession?.messages ?? []), userMessage];
    const payload: ChatRequest = {
      messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
      selectedBookIds: activeSession?.selectedBookIds ?? [],
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Backend returned ${res.status}`);

      const contentType = res.headers.get("content-type") ?? "";
      let accumulated = "";

      if (
        res.body &&
        (contentType.includes("stream") ||
          contentType.includes("text/plain") ||
          contentType.includes("text/event-stream"))
      ) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          if (contentType.includes("event-stream")) {
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  accumulated +=
                    parsed?.choices?.[0]?.delta?.content ??
                    parsed?.content ??
                    parsed?.text ??
                    "";
                } catch {
                  accumulated += data;
                }
              }
            }
          } else {
            accumulated += chunk;
          }
          setStreamingContent(accumulated);
        }
      } else {
        const data = await res.json();
        accumulated =
          data?.content ?? data?.message ?? data?.answer ?? data?.response ?? JSON.stringify(data);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: accumulated,
        timestamp: new Date(),
      };

      updateSession(activeId, {
        messages: [...allMessages, assistantMessage],
      });
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I couldn't reach the backend. Please make sure the Python server is running and try again.",
        timestamp: new Date(),
      };
      updateSession(activeId, {
        messages: [...allMessages, errMsg],
      });
    } finally {
      setLoading(false);
      setStreamingContent("");
    }
  };

  // If no active session, create one lazily
  const ensureSession = () => {
    if (!activeId) {
      handleNewChat();
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg)]" onClick={ensureSession}>
      <Sidebar
        sessions={[...sessions].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )}
        activeSessionId={activeId}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <ChatArea
        messages={activeSession?.messages ?? []}
        loading={loading}
        streamingContent={streamingContent}
        selectedBooks={selectedBooks}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onOpenBookPicker={() => {
          ensureSession();
          setBookPickerOpen(true);
        }}
      />

      <BookPickerModal
        open={bookPickerOpen}
        onClose={() => setBookPickerOpen(false)}
        selectedIds={activeSession?.selectedBookIds ?? []}
        onToggleBook={handleToggleBook}
        onBooksLoaded={registerBooks}
      />
    </div>
  );
}
