"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Terminal,
  User,
  PlusCircle,
  MessageSquare,
  Wrench,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { ChatMessage } from "@/lib/types";

const SUGGESTED_PROMPTS = [
  "Find the best remote AI and backend jobs matching my resume",
  "Diagnose my skill gaps for a Senior AI Systems Architect role",
  "Summarize my background, technical skills, and experience",
  "Help me prepare for a FastAPI and pgvector backend interview"
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadSessions() {
    try {
      const sessions = await api.getChatSessions();
      setPastSessions(sessions);
      if (sessions.length > 0 && !sessionId) {
        loadSessionHistory(sessions[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadSessionHistory(id: string) {
    setSessionId(id);
    try {
      const res = await api.getChatSessionHistory(id);
      setMessages(res.messages);
    } catch (e) {
      console.error(e);
    }
  }

  const handleStartNewSession = () => {
    setSessionId(null);
    setMessages([]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage("");

    // Optimistically append user message
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      session_id: sessionId || "new",
      role: "user",
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.sendAssistantMessage({
        message: text,
        session_id: sessionId || undefined
      });

      setSessionId(res.session_id);
      setMessages((prev) => [...prev, res.message]);
      loadSessions();
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "error-" + Date.now(),
        session_id: sessionId || "new",
        role: "assistant",
        content:
          err.response?.data?.detail ||
          "I ran into an issue processing your request. Please ensure you are logged in and your active resume is uploaded.",
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-6">
      {/* Session History Sidebar */}
      <div className="w-full md:w-64 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col shrink-0">
        <button
          onClick={handleStartNewSession}
          className="w-full py-2.5 px-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          New Strategy Session
        </button>

        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-1">
          Past Sessions
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {pastSessions.length > 0 ? (
            pastSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSessionHistory(s.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2 truncate ${
                  sessionId === s.id
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{s.title}</span>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No previous sessions
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                CareerPilot Copilot
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  LangGraph Agent
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Connected to vector index, skill graph, and cover letter generator
              </div>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 max-w-lg mx-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  How can I help accelerate your career?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ask me to find semantic job matches, identify technical skill gaps, or draft custom cover letters.
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-brand-400 bg-slate-50/50 hover:bg-brand-50/40 text-xs text-slate-700 transition"
                  >
                    💬 {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-3xl p-4 sm:p-5 text-xs sm:text-sm space-y-3 ${
                      isUser
                        ? "bg-brand-600 text-white rounded-br-none"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-xs"
                    }`}
                  >
                    {/* Tool Calls Disclosure if agent used tools */}
                    {!isUser && m.tool_calls && m.tool_calls.length > 0 && (
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5 mb-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-brand-600" />
                          Autonomous Tool Invocations
                        </div>
                        {m.tool_calls.map((t, idx) => (
                          <div key={idx} className="text-xs font-mono text-slate-600">
                            • <span className="font-bold text-brand-700">{t.tool_name}</span>: {t.result_summary}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                Thinking, dispatching tools & querying vector database...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 border-t border-slate-200 flex gap-2 bg-white"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            placeholder="Ask about jobs, skill gaps, resume advice, or interview prep..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
