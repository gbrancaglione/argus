class Account < ApplicationRecord
  belongs_to :user
  has_many :transactions, dependent: :destroy

  validates :external_id, presence: true, uniqueness: { scope: :user_id }
  validates :name, :account_type, :item_id, presence: true

  scope :credit_cards, -> { where(account_type: "CREDIT") }
  scope :bank_accounts, -> { where(account_type: "BANK") }

  def credit_card?
    account_type == "CREDIT"
  end
end
