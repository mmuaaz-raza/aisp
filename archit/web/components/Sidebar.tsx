"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/useTheme";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Lock,
  LogIn,
  Trash2,
} from "lucide-react";

/** Shape returned by GET /api/v1/chats (messages excluded) */
interface ChatListItem {
  id: string;
  title: string;
  summary: string;
  token_limit: number;
  tokens_used: number;
  is_exhausted: boolean;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

function groupByDate(chats: ChatListItem[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isYesterday = (d: Date) => d.toDateString() === yesterday.toDateString();
  const isLastWeek = (d: Date) => d >= lastWeek && !isToday(d) && !isYesterday(d);

  const groups: { label: string; items: ChatListItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Past 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  // Sort newest-first before grouping
  const sorted = [...chats].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  for (const c of sorted) {
    const d = new Date(c.updated_at);
    if (isToday(d)) groups[0].items.push(c);
    else if (isYesterday(d)) groups[1].items.push(c);
    else if (isLastWeek(d)) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
}

interface SidebarProps {
  activeChatId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
}



export default function Sidebar({
  activeChatId,
  collapsed,
  onToggleCollapse,
  isLoggedIn,
  onLoginClick,
}: SidebarProps) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingChat = chats.find((c) => c.id === pendingDeleteId) ?? null;
  // Incremented manually after create/delete — avoids activeChatId as a dep
  // (which caused a re-fetch — and parent re-render — on every navigation)
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch chat list from backend
  useEffect(() => {
    if (!isLoggedIn) return;
    const controller = new AbortController();
    fetch("/api/v1/chats", {
      credentials: "include",
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ChatListItem[]) => setChats(Array.isArray(data) ? data : []))
      .catch((err) => { if (err.name !== "AbortError") setChats([]); });
    return () => controller.abort();
  }, [isLoggedIn, refreshKey]); // refreshKey is only bumped after create/delete

  const handleNewChat = () => {
    // If we are already on the new chat page (activeChatId is null), do nothing.
    if (activeChatId === null) return;
    
    // Navigate to the fresh chat page where the user can enter their prompt.
    router.push("/chat");
    
    // Collapse sidebar on mobile automatically when starting a new chat
    if (window.innerWidth < 768 && !collapsed) {
      onToggleCollapse();
    }
  };

  const confirmDeleteChat = async () => {
    if (!pendingDeleteId) return;
    const chatId = pendingDeleteId;
    setPendingDeleteId(null);
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (chatId === activeChatId) router.push("/chat");
    try {
      await fetch(`/api/v1/chats/${chatId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setRefreshKey((k) => k + 1); // refresh list after deletion
    } catch {
      // silently ignore
    }
  };

  const groups = groupByDate(chats);

  return (
    <>
      {/* ── Confirmation modal ── */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-5 shadow-xl flex flex-col gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Delete chat?
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                &ldquo;{pendingChat?.title}&rdquo;
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                  background: "transparent",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 cursor-pointer"
                style={{
                  background: "var(--danger, #e53e3e)",
                  color: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {!collapsed && (
        <div 
          className="md:hidden absolute inset-0 z-40" 
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={onToggleCollapse} 
        />
      )}

      <aside
      className={`absolute md:relative z-40 flex flex-col h-full border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "-translate-x-full md:translate-x-0 w-64 md:w-14" : "translate-x-0 w-64 md:w-64"
      }`}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border)] min-h-[57px]">
        {!collapsed && (
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            History
          </span>
        )}

        <div className={`flex items-center gap-1 ${collapsed ? "mx-auto" : ""}`}>
          {/* Theme toggle */}
          {!collapsed && (
            <button
              onClick={toggle}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}

          {/* New chat */}
          {!collapsed && (
            <button
              onClick={handleNewChat}
              disabled={creating}
              title="New chat"
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus size={15} className={creating ? "animate-spin" : ""} />
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* ── Collapsed icon strip ── */}
      {collapsed && (
        <div className="flex flex-col items-center pt-3 gap-2">
          <button
            onClick={handleNewChat}
            disabled={creating}
            title="New chat"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus size={17} className={creating ? "animate-spin" : ""} />
          </button>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      )}

      {/* ── Expanded: history list ── */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2 px-2 relative">
          {!isLoggedIn ? (
            /* ── Logged-out placeholder list (blurred) ── */
            <div className="relative">
              {/* Fake rows */}
              {[80, 60, 72, 55, 68].map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 opacity-40"
                >
                  <div
                    className="w-3 h-3 rounded shrink-0"
                    style={{ background: "var(--border)" }}
                  />
                  <div
                    className="h-2.5 rounded"
                    style={{ background: "var(--border)", width: `${w}%` }}
                  />
                </div>
              ))}

              {/* Lock overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl text-center px-4"
                style={{ background: "var(--surface)", opacity: 0.92 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--surface-2)" }}
                >
                  <Lock size={18} className="text-[var(--text-muted)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    History locked
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    Sign in to save and access your chat history
                  </p>
                </div>
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
                  style={{
                    background: "var(--accent)",
                    color: "var(--user-bubble-text)",
                  }}
                >
                  <LogIn size={12} />
                  Sign in
                </button>
              </div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
              <MessageSquare size={20} className="text-[var(--border)]" />
              <p className="text-xs text-[var(--text-muted)]">
                No chats yet. Start a new conversation.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 pb-1">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((chat) => (
                    <ChatRow
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      onDelete={() => setPendingDeleteId(chat.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
    </>
  );
}

function ChatRow({
  chat,
  isActive,
  onDelete,
}: {
  chat: ChatListItem;
  isActive: boolean;
  onDelete: () => void;
}) {
  return (
    <Link
      href={`/chat/c/${chat.id}`}
      className={`group flex items-center gap-1.5 rounded-lg px-2 py-2 transition-colors ${
        isActive
          ? "bg-[var(--accent-light)] text-[var(--accent)]"
          : "hover:bg-[var(--surface-2)] text-[var(--text-primary)]"
      }`}
    >
      <MessageSquare
        size={13}
        className={`shrink-0 ${
          isActive ? "text-[var(--accent-2)]" : "text-[var(--text-muted)]"
        }`}
      />
      <span
        className={`flex-1 text-xs truncate ${
          isActive ? "text-[var(--accent)]" : ""
        }`}
      >
        {chat.title}
      </span>
      <button
        onClick={(e) => {
          e.preventDefault(); // don't navigate
          e.stopPropagation();
          onDelete();
        }}
        title="Delete chat"
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)]"
      >
        <Trash2 size={11} />
      </button>
    </Link>
  );
}
