const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: number;
  uuid: string;
  status: JobStatus;
  job_type: string;
  input_format: string;
  output_format: string;
  input_file_path: string | null;
  output_file_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportedTargetsResponse {
  input_format: string;
  supported_targets: string[];
}

export async function getSupportedTargets(inputFormat: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/formats/${inputFormat}/targets`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Format '${inputFormat}' is not supported`);
    }
    throw new Error("Error in fetching available formats");
  }

  const data: SupportedTargetsResponse = await res.json();
  return data.supported_targets;
}

export async function createJob(file: File, outputFormat: string): Promise<Job> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("output_format", outputFormat);

  const res = await fetch(`${API_URL}/jobs/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? "Error in job creation");
  }

  return res.json();
}

export async function getJob(jobId: number): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`);

  if (!res.ok) {
    throw new Error("Error in fetching job status");
  }

  return res.json();
}

export function getDownloadUrl(jobId: number): string {
  return `${API_URL}/jobs/${jobId}/download`;
}