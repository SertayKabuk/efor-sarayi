export type ExportMode = "ai" | "definitions";

export interface PlanPhase {
  phase: string;
  tasks: string[];
  effort_days: number;
}

export interface Risk {
  description: string;
  impact: "low" | "medium" | "high";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  modules: string[];
  integrations: string[];
  requirements: string[];
  tech_stack: string[];
  duration_days: number;
  effort_person_days: number;
  complexity: "low" | "medium" | "high" | "very_high";
  constraints: string[];
  implementation_plan: PlanPhase[];
  team_composition: string[];
  assumptions: string[];
  risks: Risk[];
  questions: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  modules: string[];
  integrations: string[];
  requirements: string[];
  tech_stack: string[];
  duration_days: number;
  complexity: "low" | "medium" | "high" | "very_high";
  constraints: string[];
  implementation_plan: PlanPhase[];
  team_composition: string[];
  assumptions: string[];
  risks: Risk[];
  questions: string[];
  notes: string;
}

export interface DocumentInfo {
  id: string;
  project_id: string;
  filename: string;
  created_at: string;
}

export type ProjectChatRole = "user" | "assistant";

export interface ProjectChatMessage {
  role: ProjectChatRole;
  content: string;
}

export interface ProjectChatRequest {
  message: string;
  history: ProjectChatMessage[];
  include_documents?: boolean;
}

export interface ProjectChatResponse {
  answer: string;
  include_documents: boolean;
  project_context_included: boolean;
  document_count: number;
  document_filenames: string[];
}

export interface EstimationRequest {
  name: string;
  description: string;
  modules: string[];
  integrations: string[];
  requirements: string[];
  tech_stack: string[];
  complexity: "low" | "medium" | "high" | "very_high";
  constraints: string[];
  notes: string;
  custom_prompt: string;
}

export interface SimilarProject {
  id: string;
  name: string;
  description: string;
  modules: string[];
  integrations: string[];
  requirements: string[];
  tech_stack: string[];
  duration_days: number;
  effort_person_days: number;
  complexity: string;
  constraints: string[];
  similarity_score: number;
}

export interface EstimationResponse {
  estimated_days: number;
  effort_person_days: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  implementation_plan: PlanPhase[];
  team_composition: string[];
  assumptions: string[];
  risks: Risk[];
  questions: string[];
  similar_projects: SimilarProject[];
}
