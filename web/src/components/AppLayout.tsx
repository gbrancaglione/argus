import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return (
    <div className="flex min-h-screen bg-neutral-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center px-4 py-3 bg-neutral-white shadow-level-1 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-dark hover:bg-neutral-bg cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M3 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <h1 className="font-heading text-lg font-black text-brand-primary ml-2">
            Argus
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
