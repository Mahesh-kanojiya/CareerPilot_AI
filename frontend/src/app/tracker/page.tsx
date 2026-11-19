"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Kanban,
  Plus,
  Trash2,
  ExternalLink,
  Mail,
  Calendar,
  FileEdit,
  Building,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Application } from "@/lib/types";

const STAGES: Array<"Saved" | "Applied" | "Interviewing" | "Offer" | "Rejected"> = [
  "Saved",
  "Applied",
  "Interviewing",
  "Offer",
  "Rejected"
];

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Saved: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  Applied: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Interviewing: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Offer: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Rejected: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" }
};

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>("");

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await api.getApplications();
      setApplications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await api.updateApplication(appId, { status: newStatus });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any } : a))
      );
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm("Remove this application from your tracker?")) return;
    try {
      await api.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (e) {
      alert("Failed to delete application.");
    }
  };

  const handleSaveNotes = async (appId: string) => {
    try {
      await api.updateApplication(appId, { notes: noteText });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, notes: noteText } : a))
      );
      setEditingNotesId(null);
    } catch (e) {
      alert("Failed to save note.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Application Pipeline Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize your opportunities across pipeline stages, log interview notes, and track application velocity.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Job from Board
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading pipeline...</div>
      ) : (
        /* Kanban Board Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage);
            const style = STAGE_COLORS[stage];

            return (
              <div
                key={stage}
                className="bg-slate-100/70 p-3.5 rounded-3xl border border-slate-200 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      {stage}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[11px] font-bold flex items-center justify-center shadow-xs">
                      {stageApps.length}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {app.job?.title || "Role Title"}
                          </h4>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {app.job?.company || "Company"}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(app.id)}
                          title="Remove application"
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Move Stage Selector */}
                      <div className="pt-1">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className="w-full text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Notes Section */}
                      <div className="pt-1 border-t border-slate-100 text-[11px]">
                        {editingNotesId === app.id ? (
                          <div className="space-y-1.5 mt-1">
                            <textarea
                              rows={2}
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add interview notes or recruiter contacts..."
                              className="w-full p-2 border border-slate-200 rounded-lg text-[11px]"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setEditingNotesId(null)}
                                className="px-2 py-0.5 text-slate-500 text-[10px]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotes(app.id)}
                                className="px-2 py-0.5 bg-brand-600 text-white rounded text-[10px] font-semibold"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(app.id);
                              setNoteText(app.notes || "");
                            }}
                            className="cursor-pointer text-slate-500 hover:text-slate-800 flex items-center justify-between"
                          >
                            <span className="truncate italic">
                              {app.notes ? app.notes : "+ Add note"}
                            </span>
                            <FileEdit className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                          </div>
                        )}
                      </div>

                      {/* 1-Click Action to Cover Letter */}
                      <div className="pt-1">
                        <Link
                          href={`/cover-letter?job_id=${app.job_id}`}
                          className="text-[10px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          Tailored Cover Letter
                        </Link>
                      </div>
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
