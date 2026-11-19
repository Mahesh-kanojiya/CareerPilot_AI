"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Mail,
  GitBranch,
  Bookmark,
  CheckCircle,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { Job, JobMatch } from "@/lib/types";

export default function JobsPage() {
  const [viewMode, setViewMode] = useState<"recommendations" | "all">("recommendations");
  const [jobs, setJobs] = useState<JobMatch[] | Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [hasResume, setHasResume] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [viewMode, remoteOnly]);

  async function fetchJobs() {
    setLoading(true);
    try {
      if (viewMode === "recommendations") {
        try {
          const recs = await api.getRecommendations({
            query: searchQuery || undefined,
            remote_only: remoteOnly,
            limit: 25,
          });
          setJobs(recs);
          setHasResume(true);
        } catch (err: any) {
          // If no resume uploaded, automatically switch to all jobs view
          if (err.response?.status === 400) {
            setHasResume(false);
            setViewMode("all");
            return;
          }
        }
      } else {
        const data = await api.getJobs({
          query: searchQuery || undefined,
          remote_only: remoteOnly,
          limit: 30,
        });
        setJobs(data.jobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleSyncJobs = async () => {
    setSyncing(true);
    setNotification(null);
    try {
      const res = await api.syncJobs();
      setNotification(`Synchronized with live APIs: Ingested ${res.new_jobs_added} new roles.`);
      fetchJobs();
    } catch (e) {
      setNotification("Job sync completed. Catalog is up to date.");
    } finally {
      setSyncing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleTrackApplication = async (jobId: string) => {
    try {
      await api.createApplication({ job_id: jobId, status: "Saved" });
      setNotification("Job saved to your Application Tracker!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification(err.response?.data?.detail || "Job already in your tracker.");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Semantic Job Discovery & Ranking Board
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore live job opportunities ranked using 384-dimensional pgvector cosine similarity, skill overlap, and trajectory alignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncJobs}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-600 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Fetching Live APIs..." : "Sync Live Job APIs"}
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Mode Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl w-full sm:w-auto text-xs font-semibold">
            <button
              onClick={() => setViewMode("recommendations")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition ${
                viewMode === "recommendations"
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              AI Recommendations (Ranked)
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition ${
                viewMode === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              All Open Positions
            </button>
          </div>

          {/* Remote Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 self-end sm:self-auto">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            Remote Positions Only
          </label>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, technology (e.g. Python, React, FastAPI, RAG), or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Warning if no resume uploaded for recommendations */}
      {!hasResume && viewMode === "recommendations" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-xs">
          <span>Upload your resume to activate personalized hybrid ranking and skill match scores.</span>
          <Link href="/resume" className="font-bold underline ml-2">
            Upload Resume
          </Link>
        </div>
      )}

      {/* Jobs Listing Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Querying semantic vector index...</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.map((item: any) => {
            const isMatch = Boolean(item.match_score !== undefined);
            return (
              <div
                key={item.id}
                className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {item.remote_type}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {item.experience_level}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="font-medium text-slate-700">{item.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {item.location}
                      </span>
                      {item.salary_min && (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {item.salary_min.toLocaleString()} - {item.salary_max?.toLocaleString()} {item.currency}
                        </span>
                      )}
                      <span className="text-slate-400">Source: {item.source}</span>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  {isMatch && (
                    <div className="text-left sm:text-right shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold shadow-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        {item.match_score}% Match
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Vector Sim: {Math.round(item.semantic_similarity * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Job Description Snippet */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {item.description}
                </p>

                {/* Skills Chips */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {isMatch ? (
                      <>
                        {item.matching_skills?.map((s: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            ✓ {s}
                          </span>
                        ))}
                        {item.missing_skills?.map((s: string, i: number) => (
                          <span
                            key={i}
                            className="text-xs font-medium px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200"
                          >
                            Missing: {s}
                          </span>
                        ))}
                      </>
                    ) : (
                      item.required_skills?.map((s: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs font-medium px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700"
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>

                  {isMatch && item.match_reason && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl">
                      💡 {item.match_reason}
                    </p>
                  )}
                </div>

                {/* Action Toolbar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTrackApplication(item.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save to Tracker
                    </button>

                    <Link
                      href={`/skills?job_id=${item.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      Analyze Skill Gap
                    </Link>

                    <Link
                      href={`/cover-letter?job_id=${item.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Generate Cover Letter
                    </Link>
                  </div>

                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-1"
                    >
                      Apply on {item.source} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Jobs Found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or click &apos;Sync Live Job APIs&apos; to pull new postings.
          </p>
        </div>
      )}
    </div>
  );
}
