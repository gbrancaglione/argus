module CreditCardExpenses
  class SpendingPaceQuery
    BRL_SUM = "COALESCE(amount_brl, amount)".freeze

    def initialize(user, months: 6)
      @user = user
      @months = months
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
      result = {}

      @months.times do |offset|
        date = Date.current.beginning_of_month - offset.months
        from = date.beginning_of_month
        to = date.end_of_month
        key = from.strftime("%Y-%m")

        daily = expenses(from, to)
          .group(Arel.sql("EXTRACT(DAY FROM date)::integer"))
          .select(Arel.sql("EXTRACT(DAY FROM date)::integer as day_num, SUM(#{BRL_SUM}) as spent"))
          .order(Arel.sql("day_num"))
          .to_h { |r| [r.day_num, r.spent.to_f.round(2)] }

        cumulative = {}
        running = 0.0
        max_day = offset == 0 ? Date.current.day : to.day
        (1..max_day).each do |d|
          running += (daily[d] || 0)
          cumulative[d] = running.round(2)
        end

        result[key] = {
          label: I18n.l(from, format: "%b"),
          days: cumulative,
          total: running.round(2)
        }
      end

      result
    end

    def expenses(from_date, to_date)
      @user.transactions
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
        .in_date_range(from_date, to_date)
        .expenses
    end
  end
end
