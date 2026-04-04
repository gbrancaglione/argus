module CreditCardExpenses
  class SummaryQuery
    BRL_SUM = "COALESCE(amount_brl, amount)".freeze

    def initialize(user, from:, to:)
      @user = user
      @from = from
      @to = to
    end

    def call
      {
        total_spent: total_spent,
        transaction_count: transaction_count,
        monthly: monthly_breakdown,
        daily: daily_breakdown,
        by_category: category_breakdown
      }
    end

    private

    def expenses
      @expenses ||= @user.transactions
        .visible
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
        .in_date_range(@from, @to)
        .expenses
    end

    def stats
      @stats ||= expenses
        .reorder("")
        .select(Arel.sql("SUM(#{BRL_SUM}) as total_spent, COUNT(*) as transaction_count"))
        .take
    end

    def total_spent
      (stats&.total_spent || 0).to_f.round(2)
    end

    def transaction_count
      stats&.transaction_count || 0
    end

    def monthly_breakdown
      expenses
        .group(Arel.sql("TO_CHAR(date, 'YYYY-MM')"))
        .select(Arel.sql("TO_CHAR(date, 'YYYY-MM') as month, SUM(#{BRL_SUM}) as spent, COUNT(*) as count"))
        .order(Arel.sql("month"))
        .to_h { |r| [r.month, { spent: r.spent.to_f.round(2), count: r.count }] }
    end

    def daily_breakdown
      expenses
        .group(:date)
        .select(Arel.sql("date, SUM(#{BRL_SUM}) as spent, COUNT(*) as count"))
        .order(:date)
        .to_h { |r| [r.date.to_s, { spent: r.spent.to_f.round(2), count: r.count }] }
    end

    def category_breakdown
      expenses
        .left_joins(:label)
        .group("labels.name")
        .select(Arel.sql("labels.name as category, SUM(#{BRL_SUM}) as spent, COUNT(*) as count"))
        .order(Arel.sql("SUM(#{BRL_SUM}) DESC"))
        .map { |r| { category: r.category, spent: r.spent.to_f.round(2), count: r.count } }
    end
  end
end
