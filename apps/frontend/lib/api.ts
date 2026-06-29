/* eslint-disable @typescript-eslint/no-explicit-any */
import { Job, PaginatedJobsResponse } from "@/app/types"

export function getApiBaseUrl(): string {
  // Check Vite import.meta.env
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv.NEXT_PUBLIC_API_URL) return metaEnv.NEXT_PUBLIC_API_URL;
    if (metaEnv.VITE_API_URL) return metaEnv.VITE_API_URL;
  }
  // Check Node / Next.js process.env
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Check window runtime injection
  if (typeof window !== "undefined" && (window as any).NEXT_PUBLIC_API_URL) {
    return (window as any).NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:8000/api/v1";
}

async function handleResponseError(res: Response): Promise<never> {
  let errorMessage = "Something went wrong, please try again.";
  try {
    const data = await res.json();
    if (data && data.detail) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
      } else {
        errorMessage = JSON.stringify(data.detail);
      }
    }
  } catch {
    // JSON parse failed, keep generic fallback
  }
  throw new Error(errorMessage);
}

export async function getSupportedTargets(inputFormat: string): Promise<string[]> {
  const baseUrl = getApiBaseUrl();
  const cleanExt = inputFormat.toLowerCase().replace(/^\./, "");
  const res = await fetch(`${baseUrl}/formats/${encodeURIComponent(cleanExt)}/targets`);
  if (!res.ok) {
    await handleResponseError(res);
  }
  const data = await res.json();
  return data.supported_targets || [];
}

export async function createJob(file: File, outputFormat: string): Promise<Job> {
  const baseUrl = getApiBaseUrl();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("output_format", outputFormat);

  const res = await fetch(`${baseUrl}/jobs/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    await handleResponseError(res);
  }
  return res.json();
}

export async function getJob(jobId: number): Promise<Job> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/jobs/${jobId}`);
  if (!res.ok) {
    await handleResponseError(res);
  }
  return res.json();
}

export async function listJobs(page: number = 1, pageSize: number = 20): Promise<PaginatedJobsResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/jobs/?page=${page}&page_size=${pageSize}`);
  if (!res.ok) {
    await handleResponseError(res);
  }
  return res.json();
}

export async function deleteJob(jobId: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    await handleResponseError(res);
  }
}

export function getDownloadUrl(jobId: number): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/jobs/${jobId}/download`;
}
