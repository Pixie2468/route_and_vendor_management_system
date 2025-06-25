import { useState } from "react";
import { Toaster } from "sonner";
import { Routes } from "./Routes";
import { Items } from "./Items";
import Summary from "./Summary";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Route & Vendor Management</h2>
      </header>
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto h-full">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const [activeTab, setActiveTab] = useState<"routes" | "items" | "summary">("routes");
  const [exportedBillDate, setExportedBillDate] = useState<string | null>(null);

  const handleSetActiveTab = (tab: "routes" | "items" | "summary") => {
    setActiveTab(tab);
    if (tab !== 'summary') {
      setExportedBillDate(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold accent-text mb-4">Route & Vendor Management System</h1>
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleSetActiveTab("routes")}
            className={`px-4 py-2 rounded ${
              activeTab === "routes"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Routes & Vendors
          </button>
          <button
            onClick={() => handleSetActiveTab("items")}
            className={`px-4 py-2 rounded ${
              activeTab === "items"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Items
          </button>
          <button
            onClick={() => handleSetActiveTab("summary")}
            className={`px-4 py-2 rounded ${
              activeTab === "summary"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Summary
          </button>
        </div>
        {activeTab === "routes" ? <Routes setActiveTab={handleSetActiveTab} setExportedBillDate={setExportedBillDate} /> : activeTab === "items" ? <Items /> : <Summary exportedBillDate={exportedBillDate} setExportedBillDate={setExportedBillDate} />}
      </div>
    </div>
  );
}
