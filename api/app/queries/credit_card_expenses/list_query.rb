module CreditCardExpenses
  class ListQuery
    def initialize(user, from:, to:, page: 1, per_page: 50, label_name: nil)
      @user = user
      @from = from
      @to = to
      @page = page.to_i
      @per_page = per_page.to_i
      @label_name = label_name
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
      @base_scope ||= begin
        scope = credit_card_expenses
          .in_date_range(@from, @to)
          .order(date: :desc, created_at: :desc)
        scope = apply_label_filter(scope) if @label_name.present?
        scope
      end
    end

    def apply_label_filter(scope)
      if @label_name == "uncategorized"
        scope.where(label_id: nil)
      else
        scope.joins(:label).where(labels: { name: @label_name })
      end
    end

    def credit_card_expenses
      @user.transactions
        .joins(:account)
        .includes(:label)
        .where(accounts: { account_type: "CREDIT" })
        .excluding_card_payments
    end
  end
end
