"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Copy,
  Download,
  Sparkles,
  Check,
  Briefcase,
  AlertCircle,
  FileText,
  RotateCcw
} from "lucide-react";
import { api } from "@/lib/api";
import { Job, CoverLetterResponse } from "@/lib/types";

const TONES = [
  { value: "Professional", label: "Professional", desc: "Balanced, polished, industry-standard" },
  { value: "Technical", label: "Technical", desc: "Emphasizes architecture, code, and systems" },
  { value: "Enthusiastic", label: "Enthusiastic", desc: "High energy, passion for the mission" },
  { value: "Executive", label: "Executive", desc: "Focuses on strategic impact and scalability" }
];

function CoverLetterContent() {
  const searchParams = useSearchParams();
  const queryJobId = searchParams.get("job_id");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(queryJobId || "");
  const [selectedTone, setSelectedTone] = useState<string>("Professional");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [letterContent, setLetterContent] = useState<string>("");
  const [history, setHistory] = useState<CoverLetterResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load jobs
    api.getJobs({ limit: 20 }).then((data) => {
      setJobs(data.jobs);
      if (!selectedJobId && data.jobs.length > 0) {
        setSelectedJobId(data.jobs[0].id);
      }
    }).catch(console.error);

    // Load past letters
    api.listCoverLetters().then(setHistory).catch(console.error);
  }, [selectedJobId]);

  const handleGenerate = async () => {
    if (!selectedJobId) {
      setError("Please select a target job posting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.generateCoverLetter({
        job_id: selectedJobId,
        tone: selectedTone,
        custom_instructions: customPrompt || undefined
      });
      setLetterContent(res.content);
      // Reload history
      api.listCoverLetters().then(setHistory).catch(console.error);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Please upload an active resume first to generate personalized cover letters."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!letterContent) return;
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!letterContent) return;
    const blob = new Blob([letterContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cover_Letter_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Cover Letter Studio
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Synthesize persuasive, job-specific cover letters mapping your concrete project achievements to employer requirements.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Link href="/resume" className="font-bold underline ml-2 shrink-0">
            Upload Resume
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Settings */}
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Generator Parameters
            </h2>

            {/* Target Job Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Target Job Position
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} • {j.company}
                  </option>
                ))}
              </select>

              {selectedJob && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 mt-2">
                  <div className="font-bold text-slate-800">{selectedJob.title}</div>
                  <div className="text-slate-500">{selectedJob.company} • {selectedJob.location}</div>
                  <div className="text-[11px] text-slate-400">
                    Required: {selectedJob.required_skills?.slice(0, 4).join(", ")}
                  </div>
                </div>
              )}
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Writing Tone
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedTone(t.value)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      selectedTone === t.value
                        ? "border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="text-xs">{t.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Custom Emphasis / Instructions (Optional)
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Emphasize my experience with FastAPI, pgvector, and automated CI/CD pipelines..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating Tailored Letter..." : "Generate Cover Letter"}
            </button>
          </div>

          {/* Past Generated Letters History */}
          {history.length > 0 && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recently Generated ({history.length})
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLetterContent(h.content);
                      setSelectedJobId(h.job_id);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs transition"
                  >
                    <div className="font-bold text-slate-800">{h.job_title}</div>
                    <div className="text-[11px] text-slate-500">
                      {h.company} • {h.tone} Tone
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Letter Editor & Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-slate-900 text-sm">Draft Cover Letter</span>
              </div>

              {letterContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Copy Text
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-3">
                <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-400">
                  Synthesizing candidate background with job requirements...
                </p>
              </div>
            ) : (
              <textarea
                rows={18}
                value={letterContent}
                onChange={(e) => setLetterContent(e.target.value)}
                placeholder="Click 'Generate Cover Letter' on the left to produce a tailored letter, or write directly here..."
                className="w-full p-4 rounded-2xl border border-slate-200 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <React.Suspense fallback={<div className="text-center py-16 text-slate-400">Loading Cover Letter Studio...</div>}>
      <CoverLetterContent />
    </React.Suspense>
  );
}
