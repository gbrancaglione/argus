module CreditCardExpenses
  class AnalyticsQuery
    BRL_SUM = "COALESCE(amount_brl, amount)".freeze

    GRANULARITIES = {
      "month" => "TO_CHAR(date, 'YYYY-MM')",
      "week"  => "TO_CHAR(date, 'IYYY-\"W\"IW')",
      "day"   => "TO_CHAR(date, 'YYYY-MM-DD')"
    }.freeze

    def initialize(user, from:, to:, granularity: "month")
      @user = user
      @from = from
      @to = to
      @granularity = GRANULARITIES.key?(granularity) ? granularity : "month"
    end

    def call
      {
        current_period: period_stats(@from, @to),
        previous_period: period_stats(previous_from, previous_to),
        monthly_trend: monthly_trend,
        category_trend: category_monthly_trend,
        top_categories: top_categories
      }
    end

    private

    def expenses(from_date, to_date)
      @user.transactions
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
        .in_date_range(from_date, to_date)
        .expenses
    end

    def period_stats(from_date, to_date)
      scope = expenses(from_date, to_date)
      stats = scope
        .reorder("")
        .select(Arel.sql("SUM(#{BRL_SUM}) as total_spent, COUNT(*) as transaction_count"))
        .take

      days = (Date.parse(to_date.to_s) - Date.parse(from_date.to_s)).to_i + 1
      total = (stats&.total_spent || 0).to_f.round(2)

      {
        total_spent: total,
        transaction_count: stats&.transaction_count || 0,
        daily_average: days > 0 ? (total / days).round(2) : 0,
        from: from_date.to_s,
        to: to_date.to_s
      }
    end

    def previous_from
      days = (Date.parse(@to.to_s) - Date.parse(@from.to_s)).to_i + 1
      (Date.parse(@from.to_s) - days).to_s
    end

    def previous_to
      (Date.parse(@from.to_s) - 1).to_s
    end

    def group_expr
      GRANULARITIES[@granularity]
    end

    def monthly_trend
      expenses(@from, @to)
        .group(Arel.sql(group_expr))
        .select(Arel.sql("#{group_expr} as period, SUM(#{BRL_SUM}) as spent, COUNT(*) as count"))
        .order(Arel.sql("period"))
        .to_h { |r| [r.period, { spent: r.spent.to_f.round(2), count: r.count }] }
    end

    def category_monthly_trend
      expenses(@from, @to)
        .left_joins(:label)
        .group("labels.name", Arel.sql(group_expr))
        .select(Arel.sql("labels.name as category, #{group_expr} as period, SUM(#{BRL_SUM}) as spent"))
        .order(Arel.sql("period"))
        .group_by(&:category)
        .transform_values { |rows| rows.to_h { |r| [r.period, r.spent.to_f.round(2)] } }
    end

    def top_categories
      total = expenses(@from, @to)
        .reorder("")
        .select(Arel.sql("SUM(#{BRL_SUM}) as total"))
        .take&.total.to_f

      expenses(@from, @to)
        .left_joins(:label)
        .group("labels.name")
        .select(Arel.sql("labels.name as category, SUM(#{BRL_SUM}) as spent, COUNT(*) as count"))
        .order(Arel.sql("SUM(#{BRL_SUM}) DESC"))
        .limit(10)
        .map do |r|
          {
            category: r.category,
            spent: r.spent.to_f.round(2),
            count: r.count,
            percentage: total > 0 ? (r.spent.to_f / total * 100).round(1) : 0
          }
        end
    end
  end
end
