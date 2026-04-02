class Transaction < ApplicationRecord
  belongs_to :account

  validates :external_id, presence: true, uniqueness: true
  validates :date, :amount, :transaction_type, presence: true

  default_scope { where(deleted_at: nil) }

  scope :expenses, -> { where("amount > 0") }
  scope :credits, -> { where("amount < 0") }
  scope :in_date_range, ->(from, to) { where(date: from..to) }
  scope :excluding_card_payments, -> {
    where.not(original_category: "Credit card payment")
      .or(where(original_category: nil))
  }
  scope :with_deleted, -> { unscope(where: :deleted_at) }
  scope :only_deleted, -> { unscope(where: :deleted_at).where.not(deleted_at: nil) }

  delegate :user, to: :account

  def expense?
    amount > 0
  end

  def reset_category!
    update!(category: original_category)
  end

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def deleted?
    deleted_at.present?
  end
end
