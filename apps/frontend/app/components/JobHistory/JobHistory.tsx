/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { listJobs, deleteJob, getDownloadUrl } from "@/lib/api";
import { formatDate } from "@/lib/constants";
import { Job, JobStatus } from "@/app/types";

export const JobHistory: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const applyJobsData = (data: Awaited<ReturnType<typeof listJobs>>, page: number) => {
    setJobs(data.items || []);
    setTotalJobs(data.total || 0);
    setCurrentPage(data.page || page);
    setError(null);
    setActionError(null);
  };

  const fetchJobs = async (page: number) => {
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const data = await listJobs(page, pageSize);
      applyJobsData(data, page);
    } catch (err: any) {
      setError(err.message || "Failed to load job history.");
    } finally {
      setLoading(false);
    }
  };

  const changePage = (page: number) => {
    setLoading(true);
    setError(null);
    setActionError(null);
    setCurrentPage(page);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await listJobs(currentPage, pageSize);
        if (cancelled) return;
        applyJobsData(data, currentPage);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to load job history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  const handleDelete = async (job: Job) => {
    setActionError(null);
    if (!window.confirm(`Are you sure you want to delete conversion job #${job.id} (${job.input_format} → ${job.output_format})?`)) {
      return;
    }

    setDeletingId(job.id);
    try {
      await deleteJob(job.id);
      // On success remove row or refetch current page
      if (jobs.length === 1 && currentPage > 1) {
        changePage(currentPage - 1);
      } else {
        await fetchJobs(currentPage);
      }
    } catch (err: any) {
      setActionError(err.message || "Cannot delete this job.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalJobs / pageSize));

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Pending</span>
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/40 text-blue-300 border border-blue-500/30">
            <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
            <span>Processing</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Completed</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-300 border border-red-500/30">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Conversion History
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View, download, or delete previous media conversion jobs. Total jobs recorded: <span className="font-mono font-bold text-white">{totalJobs}</span>
          </p>
        </div>

        <button
          onClick={() => fetchJobs(currentPage)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm shadow-xs transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Table</span>
        </button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="mb-6 p-4 bg-red-950/40 rounded-xl border border-red-500/30 flex items-center justify-between text-red-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs underline hover:text-white font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {loading && jobs.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Fetching conversion jobs from PostgreSQL...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">Failed to load jobs</h3>
            <p className="text-sm text-red-300 max-w-md mx-auto mb-6">{error}</p>
            <button
              onClick={() => fetchJobs(currentPage)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No conversion jobs found</h3>
            <p className="text-sm text-slate-400 mt-1">
              You haven&apos;t converted any media files yet. Switch to the Upload tab to start.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">ID / UUID</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Conversion</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created At</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-mono font-bold text-white">#{job.id}</div>
                      <div className="font-mono text-[11px] text-slate-500 truncate max-w-[120px] sm:max-w-[180px]" title={job.uuid}>
                        {job.uuid}
                      </div>
                    </td>
                    <td className="py-4 px-6 capitalize font-semibold text-slate-300">
                      {job.job_type}
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg font-mono text-xs font-bold text-indigo-300">
                        <span className="uppercase">{job.input_format}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500" />
                        <span className="uppercase">{job.output_format}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(job.status)}</td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {job.status === "completed" && (
                        <a
                          href={getDownloadUrl(job.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(job)}
                        disabled={deletingId === job.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/40 bg-slate-950 hover:bg-red-950/30 text-slate-400 hover:text-red-300 text-xs font-bold transition-colors disabled:opacity-50"
                        title="Delete job"
                      >
                        {deletingId === job.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="border-t border-slate-800 bg-slate-950/50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 font-mono">
            Showing page <span className="font-bold text-white">{currentPage}</span> of{" "}
            <span className="font-bold text-white">{totalPages}</span> ({totalJobs} total items)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
