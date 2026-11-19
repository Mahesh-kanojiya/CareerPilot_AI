import React from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  FileText,
  Briefcase,
  GitBranch,
  Bot,
  Mail,
  Kanban,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: "AI Resume Parsing & OCR",
      desc: "Instant text extraction from PDF and DOCX. Converts raw resumes into structured skills, experience, and projects.",
      href: "/resume",
      tag: "Parsing"
    },
    {
      icon: Briefcase,
      title: "Semantic Vector Job Matching",
      desc: "Combines 384-dimensional dense embeddings with pgvector and skill overlap for high-precision role ranking.",
      href: "/jobs",
      tag: "Vector Search"
    },
    {
      icon: GitBranch,
      title: "Skill Gap Diagnostics & Roadmap",
      desc: "Identifies missing competencies and outputs step-by-step learning milestones with practical project ideas.",
      href: "/skills",
      tag: "Career Growth"
    },
    {
      icon: Bot,
      title: "LangGraph Career Agent",
      desc: "Autonomous conversational AI with live tool calling: queries jobs, inspects resumes, and answers career inquiries.",
      href: "/assistant",
      tag: "Agentic AI"
    },
    {
      icon: Mail,
      title: "AI Cover Letter Studio",
      desc: "Generates job-specific, persuasive cover letters matching your actual projects with the employer's needs.",
      href: "/cover-letter",
      tag: "Generative AI"
    },
    {
      icon: Kanban,
      title: "Application Pipeline Tracker",
      desc: "Organize applications across Saved, Applied, Interviewing, and Offer stages with custom notes and timeline.",
      href: "/tracker",
      tag: "Productivity"
    }
  ];

  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Autonomous Career Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
          Navigate Your Tech Career with <br />
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Agentic AI Intelligence
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Upload your resume, discover live tech jobs matched semantically via dense embeddings,
          diagnose missing skills, and strategize with an autonomous career copilot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/resume"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition-all hover:-translate-y-0.5"
          >
            Upload Resume
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/jobs"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
          >
            Explore Job Board
          </Link>

          <Link
            href="/assistant"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            Chat with Career Agent
          </Link>
        </div>

        {/* Value Badges */}
        <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>PostgreSQL & pgvector</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>FastAPI Asynchronous Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>LangGraph Agentic Tool Calling</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Gemini & Sentence Transformers</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            End-to-End AI Engineering Career Stack
          </h2>
          <p className="text-slate-600">
            Every feature is engineered from scratch for high performance, accuracy, and real utility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Link
                key={i}
                href={f.href}
                className="group relative p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                      {f.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex items-center text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform">
                  Explore feature <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Architecture Highlights Section */}
      <section className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            Under the Hood
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Industry-Level Architecture & Clean Engineering
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            CareerPilot AI replaces legacy keyword heuristics with a hybrid ranking engine: combining 
            dense semantic vector cosine similarity with exact-fuzzy skill graph overlap and experience alignment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-brand-400 font-bold text-lg">0.50 × Semantic Vector</div>
            <p className="text-xs text-slate-300">
              Cosine similarity between 384-dimensional dense embeddings of candidate resume and job posting requirements.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-brand-400 font-bold text-lg">0.35 × Skill Graph Overlap</div>
            <p className="text-xs text-slate-300">
              Token boundary regex & NLP token overlap identifying mastered vs missing technologies.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="text-brand-400 font-bold text-lg">0.15 × Experience Level</div>
            <p className="text-xs text-slate-300">
              Calculates structural trajectory alignment between candidate years and target role seniority.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
