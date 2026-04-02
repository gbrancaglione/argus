module CreditCardExpenses
  class ListQuery
    def initialize(user, from:, to:, page: 1, per_page: 50)
      @user = user
      @from = from
      @to = to
      @page = page.to_i
      @per_page = per_page.to_i
    end

    def call
      total = base_scope.count
      total_pages = [(total.to_f / @per_page).ceil, 1].max
      records = base_scope
        .offset((@page - 1) * @per_page)
        .limit(@per_page)

      {
        results: records,
        page: @page,
        total: total,
        total_pages: total_pages
      }
    end

    private

    def base_scope
      @base_scope ||= credit_card_expenses
        .in_date_range(@from, @to)
        .order(date: :desc, created_at: :desc)
    end

    def credit_card_expenses
      @user.transactions
        .joins(:account)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
    end
  end
end
