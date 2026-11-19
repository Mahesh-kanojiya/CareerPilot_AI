import axios, { AxiosError } from "axios";
import {
  AuthResponse,
  User,
  Resume,
  Job,
  JobMatch,
  SkillGapResponse,
  CoverLetterResponse,
  Application,
  ChatMessage
} from "./types";

// Default to deployed Render backend in production/Vercel, localhost in local development
let rawBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000/api/v1"
    : "https://careerpilot-ai-cn1r.onrender.com/api/v1");
rawBaseUrl = rawBaseUrl.replace(/\/+$/, "");
if (!rawBaseUrl.endsWith("/api/v1")) {
  rawBaseUrl = `${rawBaseUrl}/api/v1`;
}
const API_BASE_URL = rawBaseUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("careerpilot_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/register", data);
    if (typeof window !== "undefined" && res.data.access_token) {
      localStorage.setItem("careerpilot_token", res.data.access_token);
      localStorage.setItem("careerpilot_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/login", data);
    if (typeof window !== "undefined" && res.data.access_token) {
      localStorage.setItem("careerpilot_token", res.data.access_token);
      localStorage.setItem("careerpilot_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe(): Promise<{ user: User; has_active_resume: boolean; active_resume_id?: string; resume_name?: string }> {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("careerpilot_token");
      localStorage.removeItem("careerpilot_user");
    }
  },

  // Resumes
  async uploadResume(file: File): Promise<{ message: string; resume: Resume }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/resumes/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async getActiveResume(): Promise<Resume | null> {
    const res = await apiClient.get("/resumes/active");
    return res.data;
  },

  async listResumes(): Promise<Resume[]> {
    const res = await apiClient.get("/resumes/");
    return res.data;
  },

  async deleteResume(resumeId: string): Promise<void> {
    await apiClient.delete(`/resumes/${resumeId}`);
  },

  // Jobs
  async getJobs(params?: { query?: string; remote_only?: boolean; limit?: number; offset?: number }): Promise<{ total: number; jobs: Job[] }> {
    const res = await apiClient.get("/jobs/", { params });
    return res.data;
  },

  async getJobById(jobId: string): Promise<Job> {
    const res = await apiClient.get(`/jobs/${jobId}`);
    return res.data;
  },

  async syncJobs(): Promise<{ message: string; new_jobs_added: number; total_jobs_in_db: number }> {
    const res = await apiClient.post("/jobs/sync");
    return res.data;
  },

  // Recommendations
  async getRecommendations(params?: { query?: string; remote_only?: boolean; limit?: number; min_score?: number }): Promise<JobMatch[]> {
    const res = await apiClient.get("/recommendations/", { params });
    return res.data;
  },

  // Skill Gap & Roadmap
  async analyzeSkillGap(data: { job_id?: string; target_role?: string }): Promise<SkillGapResponse> {
    const res = await apiClient.post("/skills/analyze", data);
    return res.data;
  },

  async getSkillGapHistory(): Promise<any[]> {
    const res = await apiClient.get("/skills/history");
    return res.data;
  },

  // Cover Letters
  async generateCoverLetter(data: { job_id: string; tone?: string; custom_instructions?: string }): Promise<CoverLetterResponse> {
    const res = await apiClient.post("/cover-letters/generate", data);
    return res.data;
  },

  async listCoverLetters(): Promise<CoverLetterResponse[]> {
    const res = await apiClient.get("/cover-letters/");
    return res.data;
  },

  // Applications
  async getApplications(): Promise<Application[]> {
    const res = await apiClient.get("/applications/");
    return res.data;
  },

  async createApplication(data: { job_id: string; status?: string; notes?: string }): Promise<Application> {
    const res = await apiClient.post("/applications/", data);
    return res.data;
  },

  async updateApplication(appId: string, data: { status?: string; notes?: string }): Promise<Application> {
    const res = await apiClient.patch(`/applications/${appId}`, data);
    return res.data;
  },

  async deleteApplication(appId: string): Promise<void> {
    await apiClient.delete(`/applications/${appId}`);
  },

  // Assistant
  async sendAssistantMessage(data: { message: string; session_id?: string; target_job_id?: string }): Promise<{
    session_id: string;
    message: ChatMessage;
  }> {
    const res = await apiClient.post("/assistant/chat", data);
    return res.data;
  },

  async getChatSessions(): Promise<any[]> {
    const res = await apiClient.get("/assistant/sessions");
    return res.data;
  },

  async getChatSessionHistory(sessionId: string): Promise<{ id: string; title: string; messages: ChatMessage[] }> {
    const res = await apiClient.get(`/assistant/sessions/${sessionId}`);
    return res.data;
  },
};
