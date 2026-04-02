import type { Transaction } from "../types/spending";
import TransactionRow from "./TransactionRow";

type TransactionListProps = {
  transactions: Transaction[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function TransactionList({ transactions, page, totalPages, onPageChange }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className="text-neutral-medium text-sm py-8 text-center">Nenhuma transação encontrada.</p>;
  }

  return (
    <div>
      <div className="bg-neutral-white rounded-lg shadow-level-1 px-5">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-sm text-neutral-medium px-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-neutral-light text-neutral-dark hover:bg-brand-primary-lightest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
