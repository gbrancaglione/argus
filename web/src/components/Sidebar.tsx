import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    key: "credit-card",
    label: "Cartão de Crédito",
    path: "/credit-card",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1.5" y="4" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.5 8H18.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "analytics",
    label: "Analytics",
    path: "/analytics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 17V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 17V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 17V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 17V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "sync",
    label: "Sincronizar",
    path: "/sync",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M14.5 3.5L17 6L14.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5.5 16.5L3 14L5.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 14H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  function handleNav(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-darkest/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-56 bg-neutral-white shadow-level-2
          flex flex-col transition-transform duration-200
          lg:translate-x-0 lg:sticky lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-neutral-lightest">
          <h1
            className="font-heading text-2xl font-black text-brand-primary cursor-pointer"
            onClick={() => handleNav("/")}
          >
            Argus
          </h1>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNav(item.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors
                ${
                  isActive(item.path)
                    ? "bg-brand-primary-lightest text-brand-primary font-bold"
                    : "text-neutral-dark hover:bg-neutral-bg"
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User / Sign out */}
        <div className="px-4 py-4 border-t border-neutral-lightest">
          <p className="text-xs text-neutral-medium truncate mb-2">
            {user?.email}
          </p>
          <button
            onClick={signOut}
            className="text-xs text-neutral-medium hover:text-status-error transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
