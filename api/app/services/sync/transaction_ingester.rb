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
        projected = find_projected_match(data)
        if projected
          promote_projected(projected, data)
        else
          create_transaction(data)
        end
      elsif tx.deleted?
        @stats[:skipped] += 1
      elsif tx.raw_data != data
        update_transaction(tx, data)
      else
        @stats[:skipped] += 1
      end
    end

    def create_transaction(data)
      attrs = base_attributes(data)
      attrs[:account] = @account
      attrs[:external_id] = data["id"]
      attrs[:label] = resolve_label(attrs[:original_category])
      attrs[:category_edited] = false

      tx = Transaction.create!(attrs)
      tx.project_future_installments! if tx.installment?
      @stats[:created] += 1
    end

    def promote_projected(tx, data)
      attrs = base_attributes(data)
      attrs[:external_id] = data["id"]

      unless tx.category_edited
        attrs[:label] = resolve_label(attrs[:original_category])
      end

      tx.update!(attrs)
      @stats[:updated] += 1
    end

    def find_projected_match(data)
      cc_meta = data["creditCardMetadata"]
      return nil unless cc_meta&.dig("totalInstallments") && cc_meta["purchaseDate"]

      purchase_date = Date.parse(cc_meta["purchaseDate"])
      key = Transaction.generate_purchase_key(
        account_id: @account.id,
        purchase_date: purchase_date,
        amount: data["amount"].to_f
      )

      Transaction.find_by(
        purchase_key: key,
        installment_number: cc_meta["installmentNumber"],
        status: "PROJECTED"
      )
    end

    def update_transaction(tx, data)
      attrs = base_attributes(data)

      # Only update label if user never manually changed it
      unless tx.category_edited
        attrs[:label] = resolve_label(attrs[:original_category])
      end

      tx.update!(attrs)
      @stats[:updated] += 1
    end

    def base_attributes(data)
      amount = data["amount"].to_f
      currency = data["currencyCode"] || "BRL"
      cc_meta = data["creditCardMetadata"]

      attrs = {
        date: parse_date(data["date"]),
        amount: amount,
        amount_brl: resolve_brl_amount(amount, currency, data),
        currency_code: currency,
        description: data["description"],
        original_category: data["category"],
        transaction_type: data["type"],
        status: data["status"],
        payment_method: data.dig("paymentData", "paymentMethod"),
        raw_data: data
      }

      if cc_meta&.dig("totalInstallments") && cc_meta["purchaseDate"]
        purchase_date = Date.parse(cc_meta["purchaseDate"])
        attrs[:installment_number] = cc_meta["installmentNumber"]
        attrs[:total_installments] = cc_meta["totalInstallments"]
        attrs[:purchase_date] = purchase_date
        attrs[:purchase_key] = Transaction.generate_purchase_key(
          account_id: @account.id,
          purchase_date: purchase_date,
          amount: amount
        )
      end

      attrs
    end

    def resolve_brl_amount(amount, currency, data)
      if currency == "BRL"
        amount
      elsif data["amountInAccountCurrency"]
        data["amountInAccountCurrency"].to_f
      end
    end

    def resolve_label(category_name)
      return nil if category_name.blank?
      @labels_cache ||= {}
      @labels_cache[category_name] ||= @account.user.labels.find_or_create_by!(name: category_name)
    end

    def parse_date(iso_string)
      Time.zone.parse(iso_string).to_date
    end
  end
end
