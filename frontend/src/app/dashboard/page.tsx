"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  GitBranch,
  Bot,
  Mail,
  Kanban,
  ArrowRight,
  Sparkles,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { Resume, JobMatch, Application } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Candidate");
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [recommendations, setRecommendations] = useState<JobMatch[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Get current profile
        const profile = await api.getMe();
        setUserName(profile.user.full_name);

        // 2. Get active resume
        const resume = await api.getActiveResume();
        setActiveResume(resume);

        // 3. Get recommendations if resume exists
        if (resume) {
          try {
            const recs = await api.getRecommendations({ limit: 3 });
            setRecommendations(recs);
          } catch (e) {
            console.error("Recs error", e);
          }
        }

        // 4. Get applications
        const apps = await api.getApplications();
        setApplications(apps);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
          return;
        }
        setError("Could not load dashboard data. Ensure backend service is running.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating career intelligence...</p>
      </div>
    );
  }

  const parsed = activeResume?.parsed_json;
  const skillsCount = parsed?.technical_skills?.length || 0;
  const topSkills = parsed?.technical_skills?.slice(0, 8) || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-3xl text-white shadow-lg">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            AI Career Cockpit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {userName}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            {activeResume
              ? "Your resume is parsed and indexed. Explore personalized job matches or converse with your career copilot."
              : "Upload your resume to activate dense vector matching and personalized skill gap diagnostics."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/resume"
            className="px-4 py-2.5 rounded-xl bg-white text-brand-900 hover:bg-slate-100 font-semibold text-sm transition shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-brand-600" />
            {activeResume ? "Manage Resume" : "Upload Resume"}
          </Link>

          <Link
            href="/assistant"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition shadow-sm flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            Ask Copilot
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Active Resume</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {activeResume ? "Indexed & Ready" : "No Resume"}
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              {activeResume ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
              {activeResume ? activeResume.file_name : "Upload to unlock features"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Extracted Skills</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{skillsCount} Skills</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              {skillsCount > 0 ? "Mapped to industry ontology" : "Awaiting resume"}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">High Matches</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {recommendations.length > 0 ? `${recommendations.length} Roles` : "Ready to rank"}
            </div>
            <div className="text-xs text-brand-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Hybrid semantic score
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-400">Tracked Applications</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{applications.length} Active</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Kanban pipeline</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Kanban className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Top Matched Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recommended Opportunities</h2>
              <p className="text-xs text-slate-500">Ranked by 384-d semantic similarity and skill overlap</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((job) => (
                <div
                  key={job.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {job.remote_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.company} • {job.location}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {job.match_score}% Match
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{job.description}</p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {job.matching_skills.slice(0, 4).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        ✓ {s}
                      </span>
                    ))}
                    {job.missing_skills.slice(0, 2).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100"
                      >
                        + {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 italic text-[11px]">{job.match_reason}</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cover-letter?job_id=${job.id}`}
                        className="text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        Write Cover Letter
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-600">
                {activeResume
                  ? "Explore the Job Matcher to view available industry roles."
                  : "Upload your resume first to activate AI personalized ranking."}
              </p>
              <Link
                href={activeResume ? "/jobs" : "/resume"}
                className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-medium text-xs"
              >
                {activeResume ? "Explore Job Board" : "Upload Resume Now"}
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Active Profile & Copilot Quick Access */}
        <div className="space-y-6">
          {/* Resume Snapshot */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Resume Profile</h2>
              <Link href="/resume" className="text-xs text-brand-600 font-semibold hover:underline">
                View Studio
              </Link>
            </div>

            {activeResume ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-xs font-semibold text-slate-800">{activeResume.file_name}</div>
                  <div className="text-[11px] text-slate-500">
                    Experience: {parsed?.total_years_experience || 1.0} years
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-1.5">Top Identified Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {topSkills.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/skills"
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Diagnose Skill Gaps
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">No active resume on file.</p>
                <Link
                  href="/resume"
                  className="inline-block px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium text-xs"
                >
                  Upload PDF/DOCX
                </Link>
              </div>
            )}
          </div>

          {/* Copilot Action Card */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-brand-50 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Bot className="w-4 h-4 text-brand-600" />
              Career Copilot Ready
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ask your AI career assistant to analyze missing skills, search jobs, or write tailored cover letters.
            </p>
            <Link
              href="/assistant"
              className="w-full py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              Start Conversation
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
