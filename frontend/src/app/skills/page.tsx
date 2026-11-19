"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GitBranch,
  Target,
  Clock,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { SkillGapResponse, Job } from "@/lib/types";

const TARGET_ROLES = [
  "AI / Machine Learning Engineer",
  "Backend Python & Distributed Systems Engineer",
  "Frontend React & Next.js Specialist",
  "Cloud & DevOps Infrastructure Engineer",
  "Full Stack Software Engineer",
  "Data Engineer & Analytics Specialist",
  "Senior AI Systems Architect"
];

function SkillsContent() {
  const searchParams = useSearchParams();
  const queryJobId = searchParams.get("job_id");

  const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[0]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(queryJobId || "");
  const [report, setReport] = useState<SkillGapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available jobs for target selector
    api.getJobs({ limit: 15 }).then((data) => {
      setAvailableJobs(data.jobs);
    }).catch(console.error);

    // Initial analysis
    runAnalysis(queryJobId ? { job_id: queryJobId } : { target_role: selectedRole });
  }, [queryJobId]);

  async function runAnalysis(params: { job_id?: string; target_role?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analyzeSkillGap(params);
      setReport(res);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Please upload a resume first to run skill gap diagnostics."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedJobId("");
    runAnalysis({ target_role: selectedRole });
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      runAnalysis({ job_id: jobId });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Skill Gap Analysis & Personalized Learning Roadmaps
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Diagnose the technical delta between your current resume and your dream role, with milestone-driven projects and curated curriculum.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Link href="/resume" className="font-bold underline ml-2">
            Go to Resume Studio
          </Link>
        </div>
      )}

      {/* Target Selector Toolbar */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Configure Analysis Target
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target by Standard Role */}
          <form onSubmit={handleRoleSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Select Target Engineering Role
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {TARGET_ROLES.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Analyze Role
              </button>
            </div>
          </form>

          {/* Target by Specific Ingested Job */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Or Benchmark Against Specific Job Posting
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Choose a job from catalog --</option>
              {availableJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} at {j.company} ({j.experience_level})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing skill gap report & curriculum roadmap...</p>
        </div>
      ) : report ? (
        <div className="space-y-8">
          {/* Executive Assessment Card */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Target Trajectory
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {report.target_role}
                </h2>
              </div>

              {/* Match Score Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-black text-brand-600">{report.match_score}%</div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Skill Readiness</div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                  <Target className="w-8 h-8" />
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              💡 {report.summary}
            </p>

            {/* Skills Delta Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mastered Skills ({report.matching_skills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.matching_skills.length > 0 ? (
                    report.matching_skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-200 shadow-xs"
                      >
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None detected yet</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Identified Gaps to Bridge ({report.missing_skills.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.missing_skills.length > 0 ? (
                    report.missing_skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white text-amber-700 border border-amber-200 shadow-xs"
                      >
                        + {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold">
                      🎉 No major skill gaps! You match 100% of core requirements.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Learning Roadmap Timeline */}
          {report.roadmap.length > 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Step-by-Step Practical Learning Roadmap
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Estimated Duration: {report.roadmap.reduce((acc, s) => acc + s.duration_weeks, 0)} Weeks
                </p>
              </div>

              <div className="space-y-6">
                {report.roadmap.map((step) => (
                  <div
                    key={step.step_number}
                    className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center">
                          {step.step_number}
                        </span>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{step.skill_name}</h4>
                          <span className="text-xs text-slate-500">{step.description}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {step.duration_weeks} Weeks
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                            step.importance === "Critical"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-brand-50 text-brand-700 border border-brand-200"
                          }`}
                        >
                          {step.importance}
                        </span>
                      </div>
                    </div>

                    {/* Key Topics */}
                    {step.key_topics?.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Key Concepts & Architecture Topics
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {step.key_topics.map((t, ti) => (
                            <span
                              key={ti}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                            >
                              • {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capstone Project */}
                    {step.hands_on_project && (
                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase">
                          <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                          Hands-On Portfolio Project
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {step.hands_on_project}
                        </p>
                      </div>
                    )}

                    {/* Curated Resources */}
                    {step.resources?.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Curated Learning Materials
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.resources.map((res, ri) => (
                            <a
                              key={ri}
                              href={res.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 rounded-xl border border-slate-200 hover:border-brand-400 bg-white hover:bg-slate-50 flex items-center justify-between transition text-xs group"
                            >
                              <div className="space-y-0.5 pr-2">
                                <span className="font-semibold text-slate-900 group-hover:text-brand-600 transition">
                                  {res.title}
                                </span>
                                <div className="text-[11px] text-slate-400">
                                  {res.type} • ~{res.estimated_hours}h
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function SkillsPage() {
  return (
    <React.Suspense fallback={<div className="text-center py-16 text-slate-400">Loading Skill Gap Studio...</div>}>
      <SkillsContent />
    </React.Suspense>
  );
}
