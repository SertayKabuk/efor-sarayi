import axios from "axios";
import type {
  Project,
  ProjectFormData,
  DocumentInfo,
  EstimationRequest,
  EstimationResponse,
} from "../types/project";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/efor-sarayi-api/api/v1";

const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

function buildError(message: string): Error {
  return new Error(message);
}

function parseSseMessage(block: string): unknown | null {
  const lines = block.split("\n");
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  try {
    return JSON.parse(dataLines.join("\n"));
  } catch {
    throw buildError("Received an invalid SSE JSON payload.");
  }
}

async function postSse<T>(
  path: string,
  body: FormData | object,
  method: "POST" | "PUT" | "DELETE" = "POST"
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
    body: body instanceof FormData ? body : JSON.stringify(body),
  });

  if (response.status === 401) {
    window.location.reload();
    throw buildError("Unauthorized.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw buildError(text || "Request failed.");
  }

  if (!response.body) {
    throw buildError("Streaming response body is missing.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    buffer = buffer.replace(/\r\n/g, "\n");

    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const parsed = parseSseMessage(part);
      if (!parsed) continue;
      result = parsed as T;
    }

    if (done) {
      break;
    }
  }

  if (result === undefined && buffer.trim()) {
    const parsed = parseSseMessage(buffer);
    if (parsed) {
      result = parsed as T;
    }
  }

  if (result === undefined) {
    throw buildError("Streaming response completed without a result.");
  }

  return result;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>("/projects");
  return data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProject(project: ProjectFormData): Promise<Project> {
  return postSse<Project>("/projects", project);
}

export async function updateProject(
  id: string,
  project: ProjectFormData
): Promise<Project> {
  return postSse<Project>(`/projects/${id}`, project, "PUT");
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
  return postSse<Project>(`/projects/${projectId}/documents`, form);
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
  return postSse<Project>(
    `/projects/${projectId}/documents/${documentId}`,
    {},
    "DELETE"
  );
}

export async function extractFromDocuments(
  files: File[]
): Promise<EstimationRequest> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return postSse<EstimationRequest>("/extract", form);
}

export async function estimateEffort(
  request: EstimationRequest
): Promise<EstimationResponse> {
  return postSse<EstimationResponse>("/estimate", request);
}
