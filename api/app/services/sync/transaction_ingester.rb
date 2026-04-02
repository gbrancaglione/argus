module Sync
  class TransactionIngester
    MAX_PAGES = 20

    def initialize(account, from:, to:)
      @account = account
      @from = from
      @to = to
      @stats = { created: 0, updated: 0, skipped: 0 }
    end

    def call
      fetch_all_from_pluggy.each { |tx_data| upsert(tx_data) }
      @stats
    end

    private

    def fetch_all_from_pluggy
      all = []
      page = 1

      loop do
        data = OpenFinance.client.transactions(
          account_id: @account.external_id,
          from: @from,
          to: @to,
          page: page,
          page_size: 500
        )
        all.concat(data["results"])
        break if page >= (data["totalPages"] || 1) || page >= MAX_PAGES

        page += 1
      end

      all
    end

    def upsert(data)
      tx = Transaction.with_deleted.find_by(external_id: data["id"])

      if tx.nil?
        create_transaction(data)
      elsif tx.deleted?
        @stats[:skipped] += 1
      elsif tx.raw_data != data
        update_transaction(tx, data)
      else
        @stats[:skipped] += 1
      end
    end

    def create_transaction(data)
      pluggy_category = data["category"]
      amount = data["amount"].to_f
      currency = data["currencyCode"] || "BRL"

      Transaction.create!(
        account: @account,
        external_id: data["id"],
        date: parse_date(data["date"]),
        amount: amount,
        amount_brl: resolve_brl_amount(amount, currency, data),
        currency_code: currency,
        description: data["description"],
        original_category: pluggy_category,
        category: pluggy_category,
        transaction_type: data["type"],
        status: data["status"],
        payment_method: data.dig("paymentData", "paymentMethod"),
        raw_data: data
      )
      @stats[:created] += 1
    end

    def update_transaction(tx, data)
      new_original = data["category"]
      amount = data["amount"].to_f
      currency = data["currencyCode"] || "BRL"

      attrs = {
        date: parse_date(data["date"]),
        amount: amount,
        amount_brl: resolve_brl_amount(amount, currency, data),
        currency_code: currency,
        description: data["description"],
        original_category: new_original,
        transaction_type: data["type"],
        status: data["status"],
        payment_method: data.dig("paymentData", "paymentMethod"),
        raw_data: data
      }

      # Only update user category if it was never manually changed
      attrs[:category] = new_original if tx.category == tx.original_category

      tx.update!(attrs)
      @stats[:updated] += 1
    end

    def resolve_brl_amount(amount, currency, data)
      if currency == "BRL"
        amount
      elsif data["amountInAccountCurrency"]
        data["amountInAccountCurrency"].to_f
      end
    end

    def parse_date(iso_string)
      Time.zone.parse(iso_string).to_date
    end
  end
end
