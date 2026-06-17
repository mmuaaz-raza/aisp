"use client";

import { Message } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end group px-4 py-1">
        <div className="flex items-end gap-2 max-w-[75%]">
          <span className="text-[10px] text-[var(--text-muted)] self-end mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
          <div
            className="text-sm px-4 py-2.5 rounded-2xl rounded-br-sm leading-relaxed shadow-sm"
            style={{
              background: "var(--user-bubble)",
              color: "var(--user-bubble-text)",
            }}
          >
            {message.content}
          </div>
          <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--accent-light)] border border-[var(--border)] flex items-center justify-center self-end">
            <User size={13} className="text-[var(--accent-2)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start group px-4 py-1">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center self-start mt-1">
          <Sparkles size={13} className="text-[var(--accent-2)]" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-sm text-[var(--text-primary)] leading-relaxed">
            <div className="prose">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
