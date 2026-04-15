export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/efor-sarayi-api/api/v1";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: FormData | object;
  headers?: HeadersInit;
  reloadOnUnauthorized?: boolean;
}

function buildError(message: string): Error {
  return new Error(message);
}

async function getResponseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";

  if (contentType.includes("application/json")) {
    try {
      const data = (await response.json()) as unknown;

      if (typeof data === "string" && data.trim()) {
        return data;
      }

      if (data && typeof data === "object") {
        const detail = (data as { detail?: unknown }).detail;

        if (typeof detail === "string" && detail.trim()) {
          return detail;
        }

        if (Array.isArray(detail) && detail.length) {
          return detail
            .map((item) =>
              typeof item === "string" ? item : JSON.stringify(item)
            )
            .join(", ");
        }
      }
    } catch {
      // Fall back to plain text parsing below.
    }
  }

  try {
    const text = await response.text();
    if (text.trim()) {
      return text;
    }
  } catch {
    // Ignore and use default error message below.
  }

  return "Request failed.";
}

async function request(path: string, options: RequestOptions = {}): Promise<Response> {
  const {
    method = "GET",
    body,
    headers,
    reloadOnUnauthorized = true,
  } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: requestHeaders,
    body: requestBody,
  });

  if (response.status === 401 && reloadOnUnauthorized) {
    window.location.reload();
    throw buildError("Session expired, reloading page...");
  }

  if (!response.ok) {
    throw buildError(await getResponseErrorMessage(response));
  }

  return response;
}

export async function requestJson<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await request(path, options);
  return (await response.json()) as T;
}

export async function requestVoid(
  path: string,
  options: RequestOptions = {}
): Promise<void> {
  await request(path, options);
}