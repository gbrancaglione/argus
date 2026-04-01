import type { Transaction } from "../types/spending";
import { formatBRL } from "../utils/format";

type TransactionRowProps = {
  transaction: Transaction;
};

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const isExpense = transaction.amount > 0;

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-lightest last:border-b-0">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-bold text-neutral-darkest truncate">{transaction.description}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-medium">
            {new Intl.DateTimeFormat("pt-BR").format(new Date(transaction.date))}
          </span>
          {transaction.category && (
            <span className="bg-brand-primary-lightest text-brand-primary-dark rounded-2xl px-2 py-0.5 text-xs font-bold">
              {transaction.category}
            </span>
          )}
        </div>
      </div>
      <span className={`font-bold text-sm whitespace-nowrap ml-4 ${isExpense ? "text-status-error" : "text-status-success"}`}>
        {isExpense ? "- " : "+ "}
        {formatBRL(Math.abs(transaction.amount))}
      </span>
    </div>
  );
}
