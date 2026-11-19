import React from "react";
import Link from "next/link";
import { Compass, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xs">
              <Compass className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800">CareerPilot AI</span>
            <span className="text-xs text-slate-400">| Agentic Career Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-brand-600 transition-colors">Dashboard</Link>
            <Link href="/resume" className="hover:text-brand-600 transition-colors">Resume Studio</Link>
            <Link href="/jobs" className="hover:text-brand-600 transition-colors">Job Discovery</Link>
            <Link href="/assistant" className="hover:text-brand-600 transition-colors">AI Assistant</Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Built with Next.js, FastAPI & LangGraph</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
