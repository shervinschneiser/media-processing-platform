/* eslint-disable react-hooks/set-state-in-effect */
"use client"
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import UploadConvert from "./components/UploadConvert/UploadConvert";
import { JobHistory } from "./components/JobHistory/JobHistory";


export default function Home() {

  const [currentTab, setCurrentTab] = useState<"upload" | "history">("upload");

  useEffect(() => {
    // Check initial route
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.includes("/jobs") || hash === "#history") {
      setCurrentTab("history");
    }

    // Handle browser back/forward buttons
    const handlePopState = () => {
      const m_pathname = window.location.pathname;
      const m_hash = window.location.hash;
      if (m_pathname.includes("/jobs") || m_hash === "#history") {
        setCurrentTab("history");
      } else {
        setCurrentTab("upload");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: "upload" | "history") => {
    setCurrentTab(tab);
    if (tab === "history") {
      window.history.pushState(null, "", "/jobs");
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar currentTab={currentTab} onTabChange={handleTabChange} />
      <main className="flex-1 pb-16">
        {currentTab === "upload" ? <UploadConvert /> : <JobHistory />}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">MediaConverter</span>
            <span>•</span>
            <span>Media Converter</span>
          </div>
          <div className="text-slate-500">
            Supports Video, Audio, Image & Document processing
          </div>
        </div>
      </footer>
    </div>
  );
}
