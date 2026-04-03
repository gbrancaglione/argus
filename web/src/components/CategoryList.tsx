import type { CategoryBreakdown } from "../types/spending";
import { formatBRL } from "../utils/format";

type CategoryListProps = {
  categories: CategoryBreakdown[];
  totalSpent: number;
  onSelect: (category: string | null) => void;
};

export default function CategoryList({ categories, totalSpent, onSelect }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-neutral-medium text-sm py-8 text-center">
        Nenhum dado encontrado para o periodo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => {
        const percentage = totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0;
        return (
          <button
            key={cat.category ?? "uncategorized"}
            onClick={() => onSelect(cat.category)}
            className="bg-neutral-white rounded-lg shadow-level-1 px-5 py-4 w-full text-left cursor-pointer hover:bg-neutral-bg transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-bold text-neutral-darkest">
                  {cat.category ?? "Sem categoria"}
                </span>
                <span className="ml-2 text-xs text-neutral-medium">
                  {cat.count} transações
                </span>
              </div>
              <span className="font-heading font-black text-status-error">
                {formatBRL(cat.spent)}
              </span>
            </div>
            <div className="w-full bg-neutral-lightest rounded-full h-2">
              <div
                className="bg-brand-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs text-neutral-medium mt-1 block">
              {percentage.toFixed(1)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
