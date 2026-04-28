import type {
  Project,
  ProjectFormData,
  DocumentInfo,
  ProjectChatRequest,
  ProjectChatResponse,
  EstimationRequest,
  EstimationResponse,
  ExportMode,
} from "../types/project";
import { API_BASE_URL, requestJson, requestVoid } from "./http";

export async function getProjects(): Promise<Project[]> {
  return requestJson<Project[]>("/projects");
}

export async function getProject(id: string): Promise<Project> {
  return requestJson<Project>(`/projects/${id}`);
}

export async function createProject(project: ProjectFormData): Promise<Project> {
  return requestJson<Project>("/projects", { method: "POST", body: project });
}

export async function updateProject(
  id: string,
  project: ProjectFormData
): Promise<Project> {
  return requestJson<Project>(`/projects/${id}`, {
    method: "PUT",
    body: project,
  });
}

export async function deleteProject(id: string): Promise<void> {
  await requestVoid(`/projects/${id}`, { method: "DELETE" });
}

export async function getDocuments(projectId: string): Promise<DocumentInfo[]> {
  return requestJson<DocumentInfo[]>(`/projects/${projectId}/documents`);
}

export async function uploadDocuments(
  projectId: string,
  files: File[],
  customPrompt?: string
): Promise<Project> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (customPrompt) form.append("custom_prompt", customPrompt);
  return requestJson<Project>(`/projects/${projectId}/documents`, {
    method: "POST",
    body: form,
  });
}

export function getDocumentDownloadUrl(
  projectId: string,
  documentId: string
): string {
  return `${API_BASE_URL}/projects/${projectId}/documents/${documentId}/download`;
}

export async function deleteDocument(
  projectId: string,
  documentId: string
): Promise<Project> {
  return requestJson<Project>(`/projects/${projectId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function chatWithProject(
  projectId: string,
  request: ProjectChatRequest
): Promise<ProjectChatResponse> {
  return requestJson<ProjectChatResponse>(`/projects/${projectId}/chat`, {
    method: "POST",
    body: request,
  });
}

export async function extractFromDocuments(
  files: File[],
  customPrompt?: string
): Promise<EstimationRequest> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  if (customPrompt) form.append("custom_prompt", customPrompt);
  return requestJson<EstimationRequest>("/extract", {
    method: "POST",
    body: form,
  });
}

export async function estimateEffort(
  request: EstimationRequest
): Promise<EstimationResponse> {
  return requestJson<EstimationResponse>("/estimate", {
    method: "POST",
    body: request,
  });
}

export async function exportProject(
  project: Project,
  mode: ExportMode,
  customPrompt?: string
): Promise<string> {
  const trimmedPrompt = customPrompt?.trim();
  const response = await fetch(`${API_BASE_URL}/export/project`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "text/plain" },
    body: JSON.stringify({
      project,
      mode,
      custom_prompt: mode === "ai" ? trimmedPrompt || null : null,
    }),
  });
  if (!response.ok) throw new Error("Export failed");
  return response.text();
}

export async function exportEstimate(
  estimate: EstimationResponse,
  mode: ExportMode,
  customPrompt?: string
): Promise<string> {
  const trimmedPrompt = customPrompt?.trim();
  const response = await fetch(`${API_BASE_URL}/export/estimate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "text/plain" },
    body: JSON.stringify({
      estimate,
      mode,
      custom_prompt: mode === "ai" ? trimmedPrompt || null : null,
    }),
  });
  if (!response.ok) throw new Error("Export failed");
  return response.text();
}
