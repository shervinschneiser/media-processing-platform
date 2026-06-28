"use client"
import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar/Navbar";


export default function Home() {

  const [currentTab, setCurrentTab] = useState<"upload" | "history">("upload");

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


    </div>
  );
}
