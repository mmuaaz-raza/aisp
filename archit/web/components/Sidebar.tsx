"use client";

import { ChatSession } from "@/lib/types";
import { useTheme } from "@/lib/useTheme";
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function groupByDate(sessions: ChatSession[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isYesterday = (d: Date) => d.toDateString() === yesterday.toDateString();
  const isLastWeek = (d: Date) => d >= lastWeek && !isToday(d) && !isYesterday(d);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Past 7 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (isToday(d)) groups[0].items.push(s);
    else if (isYesterday(d)) groups[1].items.push(s);
    else if (isLastWeek(d)) groups[2].items.push(s);
    else groups[3].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { theme, toggle } = useTheme();
  const groups = groupByDate(sessions);

  return (
    <aside
      className={`flex flex-col h-full border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[var(--border)] min-h-[57px]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--accent-2)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">
              Archit
            </span>
          </div>
        )}
        <div className={`flex items-center gap-1 ${collapsed ? "mx-auto" : ""}`}>
          {!collapsed && (
            <button
              onClick={toggle}
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}
          {!collapsed && (
            <button
              onClick={onNewChat}
              title="New chat"
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer"
            >
              <Plus size={15} />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* Collapsed state */}
      {collapsed && (
        <div className="flex flex-col items-center pt-3 gap-2">
          <button
            onClick={onNewChat}
            title="New chat"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--accent-2)] transition-colors cursor-pointer"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {sessions.length > 0 && (
            <div className="w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] text-[10px] font-bold flex items-center justify-center">
              {sessions.length}
            </div>
          )}
        </div>
      )}

      {/* Expanded: history list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {sessions.length === 0 ? (
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
                  {group.items.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      isActive={session.id === activeSessionId}
                      onSelect={() => onSelectSession(session.id)}
                      onDelete={() => onDeleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}

function SessionRow({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
        isActive
          ? "bg-[var(--accent-light)] text-[var(--accent)]"
          : "hover:bg-[var(--surface-2)] text-[var(--text-primary)]"
      }`}
      onClick={onSelect}
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
        {session.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete"
        className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-all cursor-pointer"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
