import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useSync } from "../hooks/useSync";
import { formatDateBR } from "../utils/format";
import Button from "../components/Button";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "CREDIT", label: "Cartão de crédito" },
  { value: "BANK", label: "Conta bancária" },
];

export default function SyncPage() {
  const { isAuthenticated, user, signOut } = useAuth();
  const {
    accounts,
    syncLogs,
    from,
    setFrom,
    to,
    setTo,
    selectedTypes,
    setSelectedTypes,
    loading,
    syncing,
    error,
    lastResult,
    loadData,
    syncNow,
  } = useSync();

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

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

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="font-heading text-xl font-black text-neutral-darkest mb-6">
          Sincronização
        </h2>

        {error && (
          <div className="bg-status-error-light text-status-error-dark rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {lastResult && (
          <div className="bg-status-success-light text-status-success-dark rounded-lg px-4 py-3 mb-6 text-sm">
            Sincronização concluída: {lastResult.transactions_created} criadas,{" "}
            {lastResult.transactions_updated} atualizadas,{" "}
            {lastResult.transactions_skipped} ignoradas.
            {" "}({lastResult.accounts_synced} contas sincronizadas)
          </div>
        )}

        {/* Sync Form */}
        <div className="bg-neutral-white rounded-lg shadow-level-2 p-6 mb-8">
          <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
            Nova sincronização
          </h3>

          {/* Account type selection */}
          <div className="mb-4">
            <label className="text-sm text-neutral-dark mb-2 block">
              Tipo de conta
            </label>
            <div className="flex gap-3">
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(opt.value)}
                    onChange={() => toggleType(opt.value)}
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-sm text-neutral-darkest">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm text-neutral-dark mb-1 block">De</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-neutral-dark mb-1 block">Até</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border border-neutral-light rounded-lg px-3 py-2 text-sm text-neutral-darkest bg-neutral-white"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="large"
            onClick={syncNow}
            disabled={syncing || selectedTypes.length === 0}
            style={{ width: "100%" }}
          >
            {syncing ? "Sincronizando..." : "Sincronizar agora"}
          </Button>
        </div>

        {/* Synced accounts */}
        {accounts.length > 0 && (
          <div className="bg-neutral-white rounded-lg shadow-level-2 p-6 mb-8">
            <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
              Contas sincronizadas
            </h3>
            <div className="space-y-2">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-lightest last:border-0"
                >
                  <div>
                    <span className="text-sm font-bold text-neutral-darkest">
                      {acc.name}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-neutral-lightest text-neutral-medium">
                      {acc.account_type === "CREDIT" ? "Cartão" : "Conta"}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-medium">
                    {acc.account_subtype}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync log history */}
        <div className="bg-neutral-white rounded-lg shadow-level-2 p-6">
          <h3 className="font-heading font-black text-lg text-neutral-darkest mb-4">
            Histórico de sincronizações
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-brand-primary-lightest border-t-brand-primary rounded-full animate-spin" />
            </div>
          ) : syncLogs.length === 0 ? (
            <p className="text-sm text-neutral-medium">
              Nenhuma sincronização realizada ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3 border-b border-neutral-lightest last:border-0"
                >
                  <div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        log.status === "completed"
                          ? "bg-status-success-light text-status-success-dark"
                          : log.status === "failed"
                            ? "bg-status-error-light text-status-error-dark"
                            : "bg-status-warning-light text-status-warning-dark"
                      }`}
                    >
                      {log.status === "completed"
                        ? "Concluído"
                        : log.status === "failed"
                          ? "Falhou"
                          : "Executando"}
                    </span>
                    <span className="ml-3 text-sm text-neutral-darkest">
                      {formatDateBR(log.from_date)} — {formatDateBR(log.to_date)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-neutral-medium">
                    <div>
                      {log.transactions_created} criadas / {log.transactions_updated}{" "}
                      atualizadas
                    </div>
                    {log.error_message && (
                      <div className="text-status-error">{log.error_message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
