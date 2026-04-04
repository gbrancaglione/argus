class TransactionSerializer
  def initialize(transaction)
    @transaction = transaction
  end

  def as_json
    {
      id: @transaction.id,
      external_id: @transaction.external_id,
      date: @transaction.date,
      amount: @transaction.amount.to_f,
      amount_brl: @transaction.amount_brl&.to_f,
      currency_code: @transaction.currency_code,
      description: @transaction.description,
      category: @transaction.label&.name,
      label_id: @transaction.label_id,
      category_edited: @transaction.category_edited,
      original_category: @transaction.original_category,
      transaction_type: @transaction.transaction_type,
      status: @transaction.status,
      account_id: @transaction.account_id,
      sync_action: @transaction.sync_action
    }
  end

  def self.many(transactions)
    transactions.map { |t| new(t).as_json }
  end
end
