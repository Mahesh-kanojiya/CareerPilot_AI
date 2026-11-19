export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ParsedExperience {
  title: string;
  company: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  highlights: string[];
}

export interface ParsedEducation {
  degree: string;
  institution: string;
  field_of_study?: string;
  graduation_year?: string;
  gpa?: string;
}

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ParsedResume {
  contact: ParsedContact;
  summary?: string;
  total_years_experience: number;
  technical_skills: string[];
  soft_skills: string[];
  tools_and_frameworks: string[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  projects: ParsedProject[];
  certifications: string[];
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  raw_text: string;
  parsed_json?: ParsedResume;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote_type: string;
  description: string;
  requirements?: string;
  required_skills: string[];
  experience_level: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
  source: string;
  source_url?: string;
  posted_at: string;
  created_at: string;
}

export interface JobMatch extends Job {
  match_score: number;
  semantic_similarity: number;
  skill_match_percentage: number;
  matching_skills: string[];
  missing_skills: string[];
  match_reason: string;
}

export interface LearningResource {
  title: string;
  type: string;
  url?: string;
  estimated_hours: number;
}

export interface RoadmapStep {
  step_number: number;
  skill_name: string;
  importance: string;
  duration_weeks: number;
  description: string;
  key_topics: string[];
  hands_on_project: string;
  resources: LearningResource[];
}

export interface SkillGapResponse {
  id?: string;
  user_id: string;
  job_id?: string;
  target_role?: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  summary: string;
  roadmap: RoadmapStep[];
  created_at: string;
}

export interface CoverLetterResponse {
  id?: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  tone: string;
  content: string;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_id: string;
  status: "Saved" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  job?: Job;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: Array<{
    tool_name: string;
    tool_args: Record<string, any>;
    result_summary: string;
  }>;
  created_at: string;
}
