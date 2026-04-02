module Api
  class CreditCardExpensesController < ApplicationController
    before_action :authenticate!

    def index
      page_num = (params.fetch(:page, 1)).to_i
      per_page = (params.fetch(:per_page, 50)).to_i

      base = credit_card_expenses
        .in_date_range(params.require(:from), params.require(:to))
        .order(date: :desc, created_at: :desc)

      total = base.count
      total_pages = (total.to_f / per_page).ceil
      transactions = base.offset((page_num - 1) * per_page).limit(per_page)

      render json: {
        results: transactions.map { |t| serialize(t) },
        page: page_num,
        total: total,
        total_pages: [total_pages, 1].max
      }
    end

    def summary
      from = params.require(:from)
      to = params.require(:to)

      expenses = credit_card_expenses
        .in_date_range(from, to)
        .expenses

      brl_sum = "COALESCE(amount_brl, amount)"

      monthly = expenses
        .group(Arel.sql("TO_CHAR(date, 'YYYY-MM')"))
        .select(Arel.sql("TO_CHAR(date, 'YYYY-MM') as month, SUM(#{brl_sum}) as spent, COUNT(*) as count"))
        .order(Arel.sql("month"))

      daily = expenses
        .group(:date)
        .select(Arel.sql("date, SUM(#{brl_sum}) as spent, COUNT(*) as count"))
        .order(:date)

      by_category = expenses
        .group(:category)
        .select(Arel.sql("category, SUM(#{brl_sum}) as spent, COUNT(*) as count"))
        .order(Arel.sql("SUM(#{brl_sum}) DESC"))

      render json: {
        total_spent: expenses.sum(Arel.sql(brl_sum)).to_f.round(2),
        transaction_count: expenses.count,
        monthly: monthly.to_h { |r| [r.month, { spent: r.spent.to_f.round(2), count: r.count }] },
        daily: daily.to_h { |r| [r.date.to_s, { spent: r.spent.to_f.round(2), count: r.count }] },
        by_category: by_category.map { |r| { category: r.category, spent: r.spent.to_f.round(2), count: r.count } }
      }
    end

    private

    def credit_card_expenses
      current_user.transactions
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
    end

    def serialize(t)
      {
        id: t.id,
        external_id: t.external_id,
        date: t.date,
        amount: t.amount.to_f,
        amount_brl: t.amount_brl&.to_f,
        currency_code: t.currency_code,
        description: t.description,
        category: t.category,
        original_category: t.original_category,
        transaction_type: t.transaction_type,
        status: t.status,
        account_id: t.account_id
      }
    end
  end
end
