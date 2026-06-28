import React, { useState, useEffect, useRef } from "react";
import {
    UploadCloud,
    FileVideo,
    FileAudio,
    Image as ImageIcon,
    FileText,
    File as FileIcon,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Clock,
    Download,
    RefreshCw,
    ArrowRight,
    Info,
} from "lucide-react";
import { getSupportedTargets, createJob, getJob, getDownloadUrl } from "@/lib/api"
import { getFileExtension, getFormatRule, formatFileSize, FORMAT_RULES } from "@/lib/constants";
import { Job } from "@/app/types";

const UploadConvert: React.FC = () => {
    // File selection state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileExt, setFileExt] = useState<string>("");
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Targets state
    const [supportedTargets, setSupportedTargets] = useState<string[]>([]);
    const [selectedOutputFormat, setSelectedOutputFormat] = useState<string>("");
    const [loadingTargets, setLoadingTargets] = useState<boolean>(false);

    // Error state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [clientSizeWarning, setClientSizeWarning] = useState<string | null>(null);

    // Active conversion job state
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [submittingJob, setSubmittingJob] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelect = async (file: File) => {
        setSelectedFile(file);
        setErrorMessage(null);
        setClientSizeWarning(null);
        setSupportedTargets([]);
        setSelectedOutputFormat("");
        setActiveJob(null);

        const ext = getFileExtension(file.name);
        if (!ext) {
            setErrorMessage("File has no extension. Please select a valid media file.");
            return;
        }

        setFileExt(ext);

        // Client-side size check
        const rule = getFormatRule(ext);
        if (rule) {
            if (file.size > rule.maxSizeBytes) {
                setClientSizeWarning(
                    `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${rule.maxSizeLabel} for ${rule.jobType} files.`
                );
            }
        }

        // Call GET /formats/{ext}/targets
        setLoadingTargets(true);
        try {
            const targets = await getSupportedTargets(ext);
            if (targets.length === 0) {
                setErrorMessage(`Format '${ext}' is not supported for conversion.`);
            } else {
                setSupportedTargets(targets);
                setSelectedOutputFormat(targets[0]); // Default to first option
            }
        } catch (err: any) {
            setErrorMessage(err.message || `Format '${ext}' is not supported.`);
        } finally {
            setLoadingTargets(false);
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Submit conversion job
    const handleConvertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !selectedOutputFormat || clientSizeWarning) return;

        setSubmittingJob(true);
        setErrorMessage(null);

        try {
            const job = await createJob(selectedFile, selectedOutputFormat);
            setActiveJob(job);
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to start conversion job.");
        } finally {
            setSubmittingJob(false);
        }
    };

    // Polling effect for active job
    useEffect(() => {
        if (!activeJob) return;
        if (activeJob.status === "completed" || activeJob.status === "failed") return;

        const timer = setInterval(async () => {
            try {
                const updatedJob = await getJob(activeJob.id);
                setActiveJob(updatedJob);
            } catch {
                // Polling errors should be silently retried on next tick per section 8
            }
        }, 2000);

        return () => clearInterval(timer);
    }, [activeJob]);

    // Reset form to convert another file
    const handleReset = () => {
        setSelectedFile(null);
        setFileExt("");
        setSupportedTargets([]);
        setSelectedOutputFormat("");
        setErrorMessage(null);
        setClientSizeWarning(null);
        setActiveJob(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Helper for media format icons
    const getIconForExtension = (ext: string) => {
        const r = getFormatRule(ext);
        if (!r) return <FileIcon className="h-10 w-10 text-slate-400" />;
        switch (r.jobType) {
            case "video":
                return <FileVideo className="h-10 w-10 text-blue-500" />;
            case "audio":
                return <FileAudio className="h-10 w-10 text-purple-500" />;
            case "image":
                return <ImageIcon className="h-10 w-10 text-emerald-500" />;
            case "document":
                return <FileText className="h-10 w-10 text-amber-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Title section */}
            <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Convert Media Files Instantly
                </h1>
                <p className="mt-2 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
                    High-performance conversion powered by FFmpeg, Pillow, and pdf2image. Select video, audio, image, or document files to begin.
                </p>
            </div>

            {/* Main Card */}
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden transition-all duration-300">
                {!activeJob ? (
                    /* UPLOAD & CONVERT FORM */
                    <form onSubmit={handleConvertSubmit} className="p-6 sm:p-10">
                        {/* Drag and Drop Upload Area */}
                        {!selectedFile ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${isDragging
                                    ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                                    : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 bg-slate-950/40"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={onFileInputChange}
                                    className="hidden"
                                    id="media-file-input"
                                />
                                <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-inner">
                                    <UploadCloud className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    Click to select file or drag and drop
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    Supports MP4, MKV, AVI, WEBM, MP3, WAV, FLAC, PNG, JPG, WEBP, PDF and more
                                </p>
                                <div className="mt-6 inline-flex items-center px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm shadow-md shadow-indigo-500/20 transition-colors">
                                    Browse Files
                                </div>
                            </div>
                        ) : (
                            /* Selected File Preview & Format Picker */
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-slate-950/60 rounded-2xl border border-slate-800 gap-4">
                                    <div className="flex items-center space-x-4 min-w-0">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                                            {getIconForExtension(fileExt)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-white text-base truncate" title={selectedFile.name}>
                                                {selectedFile.name}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                                                <span>{formatFileSize(selectedFile.size)}</span>
                                                <span>•</span>
                                                <span className="uppercase px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-semibold">
                                                    {fileExt}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="text-xs font-medium text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-red-500/40 bg-slate-900 transition-colors shrink-0"
                                    >
                                        Change File
                                    </button>
                                </div>

                                {/* Loading Targets Spinner */}
                                {loadingTargets && (
                                    <div className="p-8 text-center bg-indigo-950/30 rounded-2xl border border-indigo-500/30 flex flex-col items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-2" />
                                        <span className="text-sm font-medium text-indigo-200">
                                            Querying supported conversion formats...
                                        </span>
                                    </div>
                                )}

                                {/* Client-side Size Warning */}
                                {clientSizeWarning && (
                                    <div className="p-4 bg-amber-950/40 rounded-xl border border-amber-500/30 flex items-start gap-3 text-amber-200 text-sm">
                                        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block text-amber-300">Size Limit Exceeded</span>
                                            <span>{clientSizeWarning}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="p-4 bg-red-950/40 rounded-xl border border-red-500/30 flex items-start gap-3 text-red-200 text-sm">
                                        <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-bold block text-red-300">Conversion Error</span>
                                            <span>{errorMessage}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Output Format Picker */}
                                {!loadingTargets && supportedTargets.length > 0 && !clientSizeWarning && (
                                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                                        <label
                                            htmlFor="target-format-select"
                                            className="block text-sm font-bold text-slate-300 uppercase tracking-wider"
                                        >
                                            Convert to Target Format
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-2.5 bg-slate-800 rounded-xl font-mono font-bold text-slate-300 uppercase border border-slate-700">
                                                {fileExt}
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-slate-500 shrink-0" />
                                            <select
                                                id="target-format-select"
                                                value={selectedOutputFormat}
                                                onChange={(e) => setSelectedOutputFormat(e.target.value)}
                                                className="flex-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono font-bold text-indigo-300 text-lg shadow-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none uppercase cursor-pointer"
                                            >
                                                {supportedTargets.map((target) => (
                                                    <option key={target} value={target}>
                                                        {target.toUpperCase()}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Action */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={
                                            loadingTargets ||
                                            supportedTargets.length === 0 ||
                                            !!clientSizeWarning ||
                                            !!errorMessage ||
                                            submittingJob
                                        }
                                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-indigo-500/20 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                                    >
                                        {submittingJob ? (
                                            <>
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>Uploading & Starting Conversion...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Start Conversion</span>
                                                <ArrowRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                ) : (
                    /* ACTIVE JOB PROGRESS / RESULT SCREEN */
                    <div className="p-6 sm:p-10 space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                            <div>
                                <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-semibold">
                                    Job UUID: {activeJob.uuid}
                                </span>
                                <h3 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                                    <span>Converting</span>
                                    <span className="uppercase text-indigo-400 font-mono">{activeJob.input_format}</span>
                                    <ArrowRight className="h-5 w-5 text-slate-600" />
                                    <span className="uppercase text-indigo-400 font-mono">{activeJob.output_format}</span>
                                </h3>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-xs text-slate-500 block">Job Type</span>
                                <span className="font-mono text-sm font-bold uppercase text-slate-300">
                                    {activeJob.job_type}
                                </span>
                            </div>
                        </div>

                        {/* STATUS BANNER */}
                        <div
                            className={`p-6 sm:p-8 rounded-2xl border flex flex-col items-center justify-center text-center ${activeJob.status === "completed"
                                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                                : activeJob.status === "failed"
                                    ? "bg-red-950/20 border-red-500/30 text-red-200"
                                    : "bg-indigo-950/20 border-indigo-500/30 text-indigo-200"
                                }`}
                        >
                            {activeJob.status === "pending" && (
                                <>
                                    <Clock className="h-12 w-12 text-indigo-400 animate-pulse mb-3" />
                                    <h4 className="text-2xl font-bold text-white">Queued</h4>
                                    <p className="text-sm text-indigo-300 mt-1">
                                        Your conversion request is waiting for an available FFmpeg/Celery worker...
                                    </p>
                                </>
                            )}

                            {activeJob.status === "processing" && (
                                <>
                                    <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mb-3" />
                                    <h4 className="text-2xl font-bold text-white">Processing...</h4>
                                    <p className="text-sm text-indigo-300 mt-1">
                                        Converting media streams. Polling job status every 2 seconds...
                                    </p>
                                </>
                            )}

                            {activeJob.status === "completed" && (
                                <>
                                    <CheckCircle2 className="h-14 w-14 text-emerald-400 mb-3" />
                                    <h4 className="text-3xl font-extrabold text-white">Conversion Completed!</h4>
                                    <p className="text-sm text-emerald-300 mt-1 max-w-md">
                                        Your output file is ready. Click below to download directly to your device.
                                    </p>

                                    <div className="mt-8 w-full max-w-sm">
                                        <a
                                            href={getDownloadUrl(activeJob.id)}
                                            className="w-full py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Download className="h-6 w-6" />
                                            <span>Download Converted File</span>
                                        </a>
                                    </div>
                                </>
                            )}

                            {activeJob.status === "failed" && (
                                <>
                                    <AlertCircle className="h-14 w-14 text-red-400 mb-3" />
                                    <h4 className="text-3xl font-extrabold text-white">Conversion Failed</h4>
                                    <p className="text-sm text-red-300 mt-3 bg-slate-950/80 p-4 rounded-xl border border-red-500/30 max-w-xl font-mono text-left break-all">
                                        {activeJob.error_message || "An unknown error occurred during media processing."}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Convert Another Action */}
                        <div className="pt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span>Convert Another File</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reference Format Groups Footer Table */}
            <div className="mt-12 bg-slate-900/60 rounded-2xl p-6 border border-slate-800/80">
                <div className="flex items-center gap-2 mb-4 text-slate-200 font-bold text-sm">
                    <Info className="h-4 w-4 text-indigo-400" />
                    <span>Supported Format Reference & File Limits</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FORMAT_RULES.map((rule) => (
                        <div key={rule.jobType} className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xs">
                            <div 
                             className=""
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-white capitalize text-sm">{rule.jobType}</span>
                                </div>
                                <p className="text-xs font-mono text-slate-400 break-words leading-relaxed">
                                    {rule.extensions.join(", ")}
                                </p>
                            </div>
                            <div className="w-full flex flex-1 items-end justify-between mt-2">
                                <span className="text-xs font-mono px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded font-semibold">
                                    Max: {rule.maxSizeLabel}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default UploadConvert