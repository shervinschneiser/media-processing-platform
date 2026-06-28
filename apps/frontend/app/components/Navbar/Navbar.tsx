import React from "react";
import { UploadCloud, History, Layers } from "lucide-react";

interface NavbarProps {
  currentTab: "upload" | "history";
  onTabChange: (tab: "upload" | "history") => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => onTabChange("upload")}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-sans font-bold tracking-tight text-white text-lg sm:text-xl block leading-none">
              MediaConverter
            </span>
            <span className="font-mono text-[10px] text-slate-400 block mt-1 uppercase tracking-wider">
              Format Processing Engine
            </span>
          </div>
        </div>

        <nav className="flex items-center space-x-2">
          <button
            onClick={() => onTabChange("upload")}
            className={`px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${currentTab === "upload"
              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
              }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload & Convert</span>
          </button>

          <button
            onClick={() => onTabChange("history")}
            className={`px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${currentTab === "history"
              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent"
              }`}
          >
            <History className="h-4 w-4" />
            <span>Job History</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar