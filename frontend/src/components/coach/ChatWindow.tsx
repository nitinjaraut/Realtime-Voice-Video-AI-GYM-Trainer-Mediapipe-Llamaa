"use client";

import { useState, useRef, useEffect } from "react";
import GlassCard from "@/components/ui/GlassCard";
import ChatBubble from "./ChatBubble";
import { askCoach, type ChatMessage } from "@/lib/api";

export default function ChatWindow() {
  const [messages, setMessages] = useState<(ChatMessage & { isFallback?: boolean; hasDisclaimer?: boolean })[]>([
    {
      role: "assistant",
      content: "Hi! I'm your FormFit AI Coach. I can help you with exercise form, workout routines, nutrition, injury prevention, and recovery. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    // Add user message to UI immediately
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Send to API (pass only role and content)
      const apiHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askCoach(userMsg, apiHistory);
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          isFallback: response.is_fallback,
          hasDisclaimer: response.has_disclaimer,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
          isFallback: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="flex flex-col h-[600px] max-h-[80vh] p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border-glass)] bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="font-bold text-[var(--color-text-primary)]">FormFit AI Coach</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Powered by RAG Knowledge Base</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent-green)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-accent-green)]"></span>
          </span>
          <span className="text-xs text-[var(--color-accent-green)]">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <ChatBubble
            key={idx}
            role={msg.role}
            content={msg.content}
            isFallback={msg.isFallback}
            hasDisclaimer={msg.hasDisclaimer}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="chat-bubble-ai px-4 py-3 text-[var(--color-text-muted)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-dimmed)] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-dimmed)] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-[var(--color-text-dimmed)] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[var(--color-border-glass)] bg-black/20">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about exercises, form, nutrition, or recovery..."
            className="flex-1 bg-white/5 border border-[var(--color-border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-dimmed)] focus:outline-none focus:border-[var(--color-accent-blue)]/50 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-[var(--color-accent-blue)] to-[#2563EB] text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </GlassCard>
  );
}
