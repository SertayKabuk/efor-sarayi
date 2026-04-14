import axios from "axios";
import type {
  Project,
  ProjectFormData,
  DocumentInfo,
  EstimationRequest,
  EstimationResponse,
} from "../types/project";

const api = axios.create({ baseURL: "/api/v1", withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(project: ProjectFormData): Promise<Project> {
  const { data } = await api.post<Project>("/projects", project);
  return data;
}

export async function updateProject(
  id: string,
  project: ProjectFormData
): Promise<Project> {
  const { data } = await api.put<Project>(`/projects/${id}`, project);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function getDocuments(projectId: string): Promise<DocumentInfo[]> {
  const { data } = await api.get<DocumentInfo[]>(
    `/projects/${projectId}/documents`
  );
  return data;
}

export async function uploadDocuments(
  projectId: string,
  files: File[]
): Promise<Project> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post<Project>(
    `/projects/${projectId}/documents`,
    form
  );
  return data;
}

export function getDocumentDownloadUrl(
  projectId: string,
  documentId: string
): string {
  return `/api/v1/projects/${projectId}/documents/${documentId}/download`;
}

export async function deleteDocument(
  projectId: string,
  documentId: string
): Promise<Project> {
  const { data } = await api.delete<Project>(
    `/projects/${projectId}/documents/${documentId}`
  );
  return data;
}

export async function extractFromDocuments(
  files: File[]
): Promise<EstimationRequest> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const { data } = await api.post<EstimationRequest>("/extract", form);
  return data;
}

export async function estimateEffort(
  request: EstimationRequest
): Promise<EstimationResponse> {
  const { data } = await api.post<EstimationResponse>("/estimate", request);
  return data;
}
