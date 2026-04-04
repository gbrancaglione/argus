class Transaction < ApplicationRecord
  CREDIT_CARD_PAYMENT_CATEGORY = "Credit card payment".freeze

  belongs_to :account
  belongs_to :label, optional: true

  validates :external_id, presence: true, uniqueness: true
  validates :date, :amount, :transaction_type, presence: true

  default_scope { where(deleted_at: nil) }

  scope :expenses, -> { where("amount > 0") }
  scope :credits, -> { where("amount < 0") }
  scope :in_date_range, ->(from, to) { where(date: from..to) }
  scope :excluding_card_payments, -> {
    where.not(original_category: CREDIT_CARD_PAYMENT_CATEGORY)
      .or(where(original_category: nil))
  }
  scope :with_deleted, -> { unscope(where: :deleted_at) }
  scope :only_deleted, -> { unscope(where: :deleted_at).where.not(deleted_at: nil) }
  scope :projected, -> { where(status: "PROJECTED") }
  scope :not_projected, -> { where.not(status: "PROJECTED") }

  delegate :user, to: :account

  def self.generate_purchase_key(account_id:, purchase_date:, amount:)
    Digest::MD5.hexdigest("#{account_id}:#{purchase_date}:#{amount}")[0, 16]
  end

  def expense?
    amount > 0
  end

  def projected?
    status == "PROJECTED"
  end

  def installment?
    total_installments.present? && total_installments > 1 && installment_number.present?
  end

  def project_future_installments!
    return unless installment? && installment_number < total_installments

    ((installment_number + 1)..total_installments).each do |n|
      next if self.class.with_deleted.exists?(
        account_id: account_id, purchase_key: purchase_key, installment_number: n
      )

      months_ahead = n - installment_number
      self.class.create!(
        account_id: account_id,
        external_id: "projected:#{purchase_key}:#{n}",
        date: date + months_ahead.months,
        amount: amount,
        amount_brl: amount_brl,
        currency_code: currency_code,
        description: description,
        original_category: original_category,
        label: label,
        category_edited: false,
        transaction_type: transaction_type,
        status: "PROJECTED",
        installment_number: n,
        total_installments: total_installments,
        purchase_date: purchase_date,
        purchase_key: purchase_key,
        raw_data: {}
      )
    end
  end

  def category_name
    label&.name
  end

  def reset_label!
    if original_category.present?
      default_label = user.labels.find_or_create_by!(name: original_category)
      update!(label: default_label, category_edited: false)
    else
      update!(label: nil, category_edited: false)
    end
  end

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def deleted?
    deleted_at.present?
  end
end
