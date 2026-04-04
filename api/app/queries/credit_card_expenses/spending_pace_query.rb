module CreditCardExpenses
  class SpendingPaceQuery
    BRL_SUM = "COALESCE(amount_brl, amount)".freeze
    MAX_MONTHS = 12

    def initialize(user, months: 6)
      @user = user
      @months = [months, MAX_MONTHS].min
    end

    def call
      {
        months: monthly_cumulative_data,
        today: Date.current.day,
        current_month: Date.current.strftime("%Y-%m")
      }
    end

    private

    def monthly_cumulative_data
      start_date = Date.current.beginning_of_month - (@months - 1).months
      end_date = Date.current.end_of_month

      # Single query for all months
      daily_data = expenses(start_date, end_date)
        .group(Arel.sql("TO_CHAR(date, 'YYYY-MM'), EXTRACT(DAY FROM date)::integer"))
        .select(Arel.sql("TO_CHAR(date, 'YYYY-MM') as month_key, EXTRACT(DAY FROM date)::integer as day_num, SUM(#{BRL_SUM}) as spent"))
        .order(Arel.sql("month_key, day_num"))
        .group_by(&:month_key)

      result = {}
      @months.times do |offset|
        date = Date.current.beginning_of_month - offset.months
        key = date.strftime("%Y-%m")
        daily = (daily_data[key] || []).to_h { |r| [r.day_num, r.spent.to_f.round(2)] }

        cumulative = {}
        running = 0.0
        max_day = offset == 0 ? Date.current.day : date.end_of_month.day
        (1..max_day).each do |d|
          running += (daily[d] || 0)
          cumulative[d] = running.round(2)
        end

        result[key] = {
          label: I18n.l(date, format: "%b"),
          days: cumulative,
          total: running.round(2)
        }
      end

      result
    end

    def expenses(from_date, to_date)
      @user.transactions
        .visible
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
        .in_date_range(from_date, to_date)
        .expenses
    end
  end
end
