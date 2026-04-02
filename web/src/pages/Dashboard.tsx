import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import Button from "../components/Button";

export default function Dashboard() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  return (
    <div className="min-h-screen bg-neutral-bg">
      <header className="flex items-center justify-between px-6 py-4 bg-neutral-white shadow-level-1">
        <h1 className="font-heading text-2xl font-black text-brand-primary">Argus</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-medium">{user?.email}</span>
          <Button variant="tertiary" size="small" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center gap-6" style={{ minHeight: "calc(100vh - 64px)" }}>
        <p className="text-neutral-medium text-lg">Welcome to Argus</p>
        <Button variant="primary" size="large" onClick={() => navigate("/spending")}>
          Ver gastos
        </Button>
      </main>
    </div>
  );
}
