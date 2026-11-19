"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Code2,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";
import { Resume, ParsedResume } from "@/lib/types";

export default function ResumePage() {
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"parsed" | "raw">("parsed");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadResume();
  }, []);

  async function loadResume() {
    setLoading(true);
    try {
      const data = await api.getActiveResume();
      setActiveResume(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMessage("Extracting text, running AI parser, and generating vector embeddings...");
    setErrorMessage(null);

    try {
      const res = await api.uploadResume(file);
      setActiveResume(res.resume);
      setStatusMessage("Resume successfully parsed and indexed!");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || "Failed to upload and parse resume. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeResume) return;
    if (!confirm("Are you sure you want to remove your active resume?")) return;

    try {
      await api.deleteResume(activeResume.id);
      setActiveResume(null);
    } catch (err: any) {
      alert("Failed to delete resume.");
    }
  };

  const parsed = activeResume?.parsed_json;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Resume Studio & AI Parser
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload PDF or DOCX resumes. The engine extracts contact details, skills, and projects, indexing them for semantic matching.
          </p>
        </div>

        {activeResume && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Active Resume
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="p-8 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-3xl bg-white text-center transition-all">
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,.docx,.txt"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="resume-upload"
          className="cursor-pointer flex flex-col items-center justify-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner">
            <Upload className={`w-7 h-7 ${uploading ? "animate-bounce" : ""}`} />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base">
              {uploading ? "Parsing & Indexing..." : "Click to upload or drag & drop"}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, DOCX, and TXT files (Up to 10MB)
            </p>
          </div>
          <span className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-500/20">
            Select File
          </span>
        </label>
      </div>

      {/* Parsed Resume Display */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading resume details...</div>
      ) : activeResume && parsed ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Bar with Tabs */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-slate-800 text-sm">{activeResume.file_name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Active Resume
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab("parsed")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "parsed"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Parsed Breakdown
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "raw"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Raw Text
              </button>
            </div>
          </div>

          {activeTab === "parsed" ? (
            <div className="p-6 sm:p-8 space-y-8">
              {/* Candidate Info Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {parsed.contact?.name || "Candidate"}
                  </h2>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                    {parsed.total_years_experience || 1.0} Years Experience
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  {parsed.contact?.email && <span>📧 {parsed.contact.email}</span>}
                  {parsed.contact?.phone && <span>📞 {parsed.contact.phone}</span>}
                  {parsed.contact?.location && <span>📍 {parsed.contact.location}</span>}
                  {parsed.contact?.linkedin && (
                    <a
                      href={parsed.contact.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-0.5"
                    >
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {parsed.contact?.github && (
                    <a
                      href={parsed.contact.github}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline flex items-center gap-0.5"
                    >
                      GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {parsed.summary && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-3 leading-relaxed">
                    {parsed.summary}
                  </p>
                )}
              </div>

              {/* Skills Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-600" />
                  Identified Technical & Soft Skills
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Core Technologies ({parsed.technical_skills?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.technical_skills?.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-semibold text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {parsed.tools_and_frameworks?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        DevOps, Tools & Frameworks
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.tools_and_frameworks.map((tool, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium text-xs"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {parsed.soft_skills?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Professional & Collaborative Competencies
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {parsed.soft_skills.map((soft, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 font-medium text-xs"
                          >
                            {soft}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience Timeline */}
              {parsed.experience?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-600" />
                    Work Experience
                  </h3>

                  <div className="space-y-4">
                    {parsed.experience.map((exp, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-sm">{exp.title}</span>
                          <span className="text-xs text-slate-500 font-medium">
                            {exp.start_date || "Past"} - {exp.is_current ? "Present" : exp.end_date || "Completed"}
                          </span>
                        </div>
                        <div className="text-xs text-brand-700 font-medium">{exp.company}</div>
                        {exp.highlights?.length > 0 && (
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 pt-1">
                            {exp.highlights.map((h, hi) => (
                              <li key={hi}>{h}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {parsed.projects?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-brand-600" />
                    Key Projects
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsed.projects.map((proj, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="font-bold text-slate-900 text-sm">{proj.name}</div>
                        <p className="text-xs text-slate-600">{proj.description}</p>
                        {proj.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.technologies.map((t, ti) => (
                              <span
                                key={ti}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {parsed.education?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-600" />
                    Education
                  </h3>

                  <div className="space-y-2">
                    {parsed.education.map((edu, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="font-bold text-slate-900">{edu.degree}</div>
                        <div className="text-slate-600 mt-0.5">
                          {edu.institution} {edu.graduation_year ? `• Class of ${edu.graduation_year}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6">
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs rounded-2xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[600px]">
                {activeResume.raw_text}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Resume Uploaded Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload your resume above to extract your skills, compute dense semantic embeddings, and start receiving AI-ranked job recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
