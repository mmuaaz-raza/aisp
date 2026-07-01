"use client";

import { useState, useEffect } from "react";
import { Message } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { User, Sparkles, Copy, Share2, Check } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

function formatTime(timestamp: string) {
  if (!timestamp) return "Just now";
  
  // If the backend returns a naive UTC datetime (no 'Z' or offset), append 'Z'
  // so JS correctly interprets it as UTC and converts it to the user's local time.
  let timeStr = timestamp;
  if (!timeStr.endsWith("Z") && !timeStr.includes("+") && timeStr.includes("T")) {
    timeStr += "Z";
  }

  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return "Just now";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * The backend wraps each user query in <query>…</query> before storing.
 * Strip those tags so the bubble shows just the plain text.
 * Falls back to raw content if the tag isn't present (e.g. optimistic messages).
 */
function parseUserQuery(content: string): string {
  const match = content.match(/<query>([\s\S]*?)<\/query>/i);
  return match ? match[1].trim() : content;
}

function processTextWithCitations(text: string) {
  const citations: string[] = [];
  const processedText = text.replace(/<cite>(.*?)<\/cite>/gi, (match, title) => {
    let index = citations.indexOf(title);
    if (index === -1) {
      citations.push(title);
      index = citations.length - 1;
    }
    return `[${index + 1}](#cite:${encodeURIComponent(title)})`;
  });
  return { processedText, citations };
}

const markdownComponents = {
  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith("#cite:")) {
      const title = decodeURIComponent(href.slice(6));
      return (
        <sup 
          className="ml-0.5 cursor-help text-[var(--accent)] hover:underline font-semibold" 
          title={title}
        >
          <span className="text-xs">[{children}]</span>
        </sup>
      );
    }
    return <a href={href} {...props} className="text-[var(--accent)] hover:underline" />;
  }
};

function MarkdownWithCitations({ text }: { text: string }) {
  const { processedText, citations } = processTextWithCitations(text);
  
  return (
    <div className="flex flex-col gap-3">
      <div className="prose max-w-none">
        <ReactMarkdown components={markdownComponents}>{processedText}</ReactMarkdown>
      </div>
      
      {citations.length > 0 && (
        <div className="mt-2 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)] w-full">
          <div className="font-semibold mb-1.5 text-[var(--text-primary)]">References</div>
          <ol className="list-decimal list-inside space-y-1">
            {citations.map((cite, i) => (
              <li key={i}>
                <span className="italic">{cite}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function TypewriterLines({ text }: { text: string }) {
  const lines = text.split("\n");
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    if (visibleLines < lines.length) {
      const timer = setTimeout(() => {
        setVisibleLines((v) => v + 1);
      }, 80); // minor delay per line
      return () => clearTimeout(timer);
    }
  }, [visibleLines, lines.length]);

  return <MarkdownWithCitations text={lines.slice(0, visibleLines).join("\n")} />;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Check if Web Share API is supported (e.g. mobile, Safari) to avoid hydration mismatch
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "AI Response",
        text: message.content,
      }).catch(() => {});
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end group px-4 py-1 animate-message">
        <div className="flex flex-col items-end gap-0.5 max-w-[75%]">
          <div
            className="text-base px-4 py-2.5 rounded-2xl rounded-br-sm leading-relaxed shadow-sm"
            style={{
              background: "var(--user-bubble)",
              color: "var(--user-bubble-text)",
            }}
          >
            {parseUserQuery(message.content)}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start group px-4 py-1 animate-message">
      <div className="flex items-end gap-2 max-w-[95%]">
        <div className="flex flex-col gap-1 w-full">
          <div className="text-base text-[var(--text-primary)] leading-relaxed">
            <div className="w-full">
              {message.isNew ? (
                <TypewriterLines text={message.content} />
              ) : (
                <MarkdownWithCitations text={message.content} />
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-[var(--text-muted)]">
              {formatTime(message.timestamp)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] cursor-pointer"
                title="Copy response"
              >
                {copied ? <Check size={11} className="text-[var(--accent)]" /> : <Copy size={11} />}
                {copied ? "Copied" : "Copy"}
              </button>
              {canShare && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] cursor-pointer"
                  title="Share response"
                >
                  <Share2 size={11} />
                  Share
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
