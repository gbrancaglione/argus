import type { LocalTransaction } from "../types/spending";
import { formatBRL } from "../utils/format";

type CreditCardTransactionRowProps = {
  transaction: LocalTransaction;
  onClick: (transaction: LocalTransaction) => void;
};

export default function CreditCardTransactionRow({
  transaction,
  onClick,
}: CreditCardTransactionRowProps) {
  const isExpense = transaction.amount > 0;
  const isForeign = transaction.currency_code !== "BRL";
  const categoryChanged = transaction.category !== transaction.original_category;

  return (
    <button
      type="button"
      onClick={() => onClick(transaction)}
      className="w-full flex items-center justify-between py-3 border-b border-neutral-lightest last:border-b-0 cursor-pointer hover:bg-neutral-bg transition-colors text-left -mx-5 px-5"
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="text-sm font-bold text-neutral-darkest truncate">
          {transaction.description}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-medium">
            {new Intl.DateTimeFormat("pt-BR").format(
              new Date(transaction.date + "T12:00:00")
            )}
          </span>
          {transaction.category && (
            <span
              className={`rounded-2xl px-2 py-0.5 text-xs font-bold ${
                categoryChanged
                  ? "bg-status-warning-light text-status-warning-dark"
                  : "bg-brand-primary-lightest text-brand-primary-dark"
              }`}
            >
              {transaction.category}
            </span>
          )}
          {isForeign && (
            <span className="bg-neutral-lightest text-neutral-dark rounded-2xl px-2 py-0.5 text-xs font-bold">
              {transaction.currency_code}
            </span>
          )}
        </div>
      </div>
      <div className="text-right ml-4">
        <span
          className={`font-bold text-sm whitespace-nowrap ${
            isExpense ? "text-status-error" : "text-status-success"
          }`}
        >
          {isExpense ? "- " : "+ "}
          {isForeign && transaction.amount_brl != null
            ? formatBRL(Math.abs(transaction.amount_brl))
            : formatBRL(Math.abs(transaction.amount))}
        </span>
        {isForeign && (
          <div className="text-xs text-neutral-medium">
            {Math.abs(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} {transaction.currency_code}
          </div>
        )}
      </div>
    </button>
  );
}
