module TransactionSerialization
  extend ActiveSupport::Concern

  private

  def serialize_transaction(t)
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
