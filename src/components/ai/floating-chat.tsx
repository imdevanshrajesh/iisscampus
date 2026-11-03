"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, RotateCcw, MessageSquare, Bot } from "lucide-react";
import { ChatMarkdown } from "./chat-markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "📅 What events are coming up?",
  "👑 Who is on the Student Council?",
  "🏆 What are the latest achievements?",
  "📢 What are the current announcements?",
];

export function FloatingAiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! 👋 I'm your **Campus AI Assistant**. Ask me anything about upcoming campus events, competitions, student council members, or school achievements!",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Check if user has a custom client key stored in localStorage
      const clientKey = typeof window !== "undefined" ? localStorage.getItem("iiss_grok_api_key") : null;

      const res = await fetch("/api/campus-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(clientKey ? { "x-grok-api-key": clientKey } : {}),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.reply) {
        const errorText =
          data?.error || "I could not fetch an answer right now. Please try again shortly.";
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `⚠️ **Notice**: ${errorText}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "⚠️ **Connection Error**: Unable to reach the Campus AI service. Please check your network connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `initial-${Date.now()}`,
        role: "assistant",
        content:
          "Chat reset! Ask me anything about campus events, student council, achievements, or announcements.",
      },
    ]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Campus AI Assistant"
          className="mb-3 flex h-[520px] max-h-[85vh] w-[calc(100vw-2.5rem)] sm:w-[410px] flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-[#12141c] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold tracking-tight text-white">Campus Assistant</h3>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                </div>
                <p className="text-[11px] text-white/60">Grok AI · Events & Council Guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="Restart chat"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Reset chat conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fbfcfd]">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-6 w-6 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      isUser
                        ? "bg-[#1c2438] text-white rounded-br-xs shadow-xs"
                        : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <ChatMarkdown content={m.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0 mb-1">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-xs bg-white border border-gray-200/80 px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 text-xs text-muted font-medium">Grok is replying...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Starter Chips (shown when few messages) */}
          {messages.length <= 2 && (
            <div className="border-t border-gray-100 bg-white px-3 py-2 flex gap-1.5 overflow-x-auto text-xs scrollbar-none">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="border-t border-gray-200/80 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about events, council, achievements..."
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50/80 px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-orange-600 focus:outline-hidden transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white transition-opacity disabled:opacity-40 hover:bg-orange-700 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                aria-label="Send query"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-gray-400">
              Only answers questions regarding IISS Campus activities & council.
            </p>
          </div>
        </div>
      )}

      {/* Floating Launcher Pill / Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex items-center gap-2.5 rounded-full bg-[#12141c] px-4 py-2.5 text-white shadow-xl hover:bg-[#1c2438] hover:shadow-2xl transition-all duration-200 active:scale-95 border border-white/10"
        aria-label="Open Campus AI Assistant"
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
        </span>
        <span className="text-xs font-semibold tracking-wide text-white">
          {isOpen ? "Close Assistant" : "Ask Campus AI"}
        </span>
      </button>
    </div>
  );
}
