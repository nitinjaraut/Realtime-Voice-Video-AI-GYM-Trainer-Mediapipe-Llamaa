"use client";

import clsx from "clsx";
import ReactMarkdown from "react-markdown";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isFallback?: boolean;
  hasDisclaimer?: boolean;
}

export default function ChatBubble({ role, content, isFallback, hasDisclaimer }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={clsx("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] sm:max-w-[75%] px-4 py-3",
          isUser ? "chat-bubble-user text-white" : "chat-bubble-ai text-[var(--color-text-primary)]"
        )}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🤖</span>
            <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider">
              FORM FIT AI
            </span>
            {isFallback && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)] border border-[var(--color-accent-amber)]/30 ml-auto">
                General Knowledge
              </span>
            )}
            {hasDisclaimer && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] border border-[var(--color-accent-red)]/30 ml-auto">
                Medical Disclaimer
              </span>
            )}
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              a: (props) => (
                <a {...props} className="text-[var(--color-accent-blue)] hover:underline" target="_blank" rel="noopener noreferrer" />
              ),
              strong: (props) => (
                <strong {...props} className="text-white font-bold" />
              ),
              ul: (props) => (
                <ul {...props} className="list-disc pl-4 my-2 space-y-1" />
              ),
              ol: (props) => (
                <ol {...props} className="list-decimal pl-4 my-2 space-y-1" />
              ),
              li: (props) => (
                <li {...props} className="text-sm" />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
