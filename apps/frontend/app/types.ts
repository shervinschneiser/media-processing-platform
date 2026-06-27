export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type JobType = "video" | "audio" | "image" | "document";

export interface Job {
  id: number;
  uuid: string;
  status: JobStatus;
  job_type: JobType;
  input_format: string; // e.g. "mp4"
  output_format: string; // e.g. "mp3"
  input_file_path: string | null;
  output_file_path: string | null;
  error_message: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface PaginatedJobsResponse {
  items: Job[];
  total: number;
  page: number;
  page_size: number;
}

export interface FormatGroupInfo {
  group: JobType;
  maxSize: number; // in bytes
  maxSizeLabel: string;
}
