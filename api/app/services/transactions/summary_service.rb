module Transactions
  class SummaryService
    MAX_PAGES = 20

    def initialize(account_id:, from:, to:)
      @account_id = account_id
      @from = from
      @to = to
    end

    def call
      transactions = fetch_all

      {
        total_spent: transactions.sum { |t| expense_amount(t) }.round(2),
        monthly: group_by_period(transactions, "%Y-%m"),
        daily: group_by_period(transactions, "%Y-%m-%d"),
        transaction_count: transactions.size
      }
    end

    private

    def fetch_all
      all = []
      page = 1

      loop do
        data = OpenFinance.client.transactions(
          account_id: @account_id, from: @from, to: @to,
          page: page, page_size: 500
        )
        all.concat(data["results"])
        break if page >= data["totalPages"] || page >= MAX_PAGES

        page += 1
      end

      all
    end

    def expense_amount(transaction)
      amount = transaction["amount"].to_f
      amount > 0 ? amount : 0
    end

    def group_by_period(transactions, format)
      transactions
        .group_by { |t| Time.zone.parse(t["date"]).strftime(format) }
        .transform_values { |txns| { spent: txns.sum { |t| expense_amount(t) }.round(2), count: txns.size } }
        .sort_by { |k, _| k }
        .to_h
    end
  end
end
