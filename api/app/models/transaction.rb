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

  delegate :user, to: :account

  def expense?
    amount > 0
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
